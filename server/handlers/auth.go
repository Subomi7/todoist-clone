package handlers

import (
	"context"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"log"
	"net/mail"
	"os"
	"strings"
	"time"

	"crypto/rand"

	"go.mongodb.org/mongo-driver/mongo"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/crypto/bcrypt"

	"github.com/Subomi7/todoist-clone/server/db"
	"github.com/Subomi7/todoist-clone/server/models"
)

// -------- DTOs ----------
type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name,omitempty"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	// optional: client can request token be returned in cookie or body
}

type TokenResponse struct {
	AccessToken  string    `json:"access_token"`
	ExpiresAt    time.Time `json:"expires_at"`
	RefreshToken string    `json:"refresh_token,omitempty"` // Include if input was in body
}

// -------- settings ----------
const (
	AccessTokenTTL    = 15 * time.Minute
	RefreshTokenTTL   = 7 * 24 * time.Hour
	RefreshCookieName = "refresh_token"
	bcryptCost        = 12 // Increased from default (10) for better security
	issuer            = "todoist-clone" // Issuer for JWT validation
	maxNameLength     = 100 // Maximum length for user name
)

// -------- helpers ----------
func hashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcryptCost)
	return string(bytes), err
}

func checkPasswordHash(hash, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
}

func createAccessToken(userID primitive.ObjectID, email string) (string, time.Time, error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return "", time.Time{}, errors.New("JWT_SECRET not set")
	}

	exp := time.Now().Add(AccessTokenTTL)
	claims := jwt.MapClaims{
		"user_id": userID.Hex(),
		"email":   email,
		"exp":     exp.Unix(),
		"iat":     time.Now().Unix(),
		"iss":     issuer,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(secret))
	return signed, exp, err
}

// generate a cryptographically secure random string (base64-url encoded)
func generateRandomToken(nBytes int) (string, error) {
	b := make([]byte, nBytes)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

func hashToken(tok string) string {
	sum := sha256.Sum256([]byte(tok))
	return hex.EncodeToString(sum[:])
}

// DB helpers for refresh tokens
func saveRefreshToken(db *mongo.Database, userID primitive.ObjectID, tokenPlain string, expiresAt time.Time) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	col := db.Collection("refresh_tokens")
	rt := models.RefreshToken{
		UserID:    userID,
		TokenHash: hashToken(tokenPlain),
		CreatedAt: time.Now(),
		ExpiresAt: expiresAt,
		Revoked:   false,
	}
	_, err := col.InsertOne(ctx, rt)
	if err != nil {
		log.Printf("Failed to save refresh token: %v", err)
	}
	return err
}

func deleteRefreshTokenByHash(hash string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	col := db.GetCollection("refresh_tokens")
	_, err := col.DeleteOne(ctx, bson.M{"token_hash": hash})
	if err != nil {
		log.Printf("Failed to delete refresh token by hash: %v", err)
	}
	return err
}

func findRefreshTokenByHash(hash string) (*models.RefreshToken, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	col := db.GetCollection("refresh_tokens")
	var r models.RefreshToken
	err := col.FindOne(ctx, bson.M{"token_hash": hash}).Decode(&r)
	if err != nil {
		log.Printf("Failed to find refresh token: %v", err)
		return nil, err
	}
	return &r, nil
}

// revoke (delete) all refresh tokens for a user (useful on password change)
func revokeAllRefreshTokensForUser(userID primitive.ObjectID) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	col := db.GetCollection("refresh_tokens")
	_, err := col.DeleteMany(ctx, bson.M{"user_id": userID})
	if err != nil {
		log.Printf("Failed to revoke all refresh tokens: %v", err)
	}
	return err
}

// CleanupExpiredTokens deletes expired refresh tokens from the database
func CleanupExpiredTokens() error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	col := db.GetCollection("refresh_tokens")
	_, err := col.DeleteMany(ctx, bson.M{"expires_at": bson.M{"$lt": time.Now()}})
	if err != nil {
		log.Printf("Failed to cleanup expired tokens: %v", err)
	}
	return err
}

// -------- Handlers ----------

// Register creates a new user with validated input and hashed password
func Register(c *fiber.Ctx) error {
	req := new(RegisterRequest)
	if err := c.BodyParser(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid body"})
	}
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	req.Name = strings.TrimSpace(req.Name)
	if req.Email == "" || req.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "email and password required"})
	}

	// Validate email format
	if _, err := mail.ParseAddress(req.Email); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid email format"})
	}

	// Enforce password strength (basic: min length)
	if len(req.Password) < 8 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "password must be at least 8 characters"})
	}

	// Validate name length
	if len(req.Name) > maxNameLength {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "name too long"})
	}

	hashed, err := hashPassword(req.Password)
	if err != nil {
		log.Printf("Failed to hash password: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "could not hash password"})
	}

	user := &models.User{
		ID:           primitive.NewObjectID(),
		Email:        req.Email,
		PasswordHash: hashed,
		CreatedAt:    time.Now(),
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	collection := db.GetCollection("users")
	_, err = collection.InsertOne(ctx, user)
	if err != nil {
		if mongo.IsDuplicateKeyError(err) {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "email already in use"})
		}
		log.Printf("Database error in register: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "database error"})
	}

	pcol := db.ProjectsCol()
	inbox := models.Project{
    ID:        primitive.NewObjectID(),
    UserID:    user.ID,
    Name:      "Inbox",
    IsSystem:  true,
    CreatedAt: time.Now().UTC(),
    UpdatedAt: time.Now().UTC(),
}
_, err = pcol.InsertOne(ctx, inbox)
if err != nil {
    log.Printf("failed to create Inbox for user %s: %v", user.ID.Hex(), err)
}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"id":    user.ID.Hex(),
		"email": user.Email,
	})
}

// Login authenticates a user and issues tokens
func Login(c *fiber.Ctx) error {
	req := new(LoginRequest)
	if err := c.BodyParser(req); err != nil {
		log.Printf("Login: body parse error: %v\n", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid body"})
	}
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	if req.Email == "" || req.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "email and password required"})
	}

	// ctx with timeout for DB call
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	collection := db.GetCollection("users")
	var user models.User
	if err := collection.FindOne(ctx, bson.M{"email": req.Email}).Decode(&user); err != nil {
		// log details on server for debugging (don't return raw error to client)
		if err == mongo.ErrNoDocuments {
			log.Printf("Login: user not found for email=%s\n", req.Email)
		} else {
			log.Printf("Login: FindOne error for email=%s: %v\n", req.Email, err)
		}
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "invalid credentials"})
	}

	// Quick sanity: log existence of password hash (not the hash value itself)
	if user.PasswordHash == "" {
		log.Printf("Login: user %s has empty password hash!\n", req.Email)
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "invalid credentials"})
	}
	log.Printf("Login: found user id=%s email=%s hash_len=%d\n", user.ID.Hex(), user.Email, len(user.PasswordHash))

	// Compare password
	if err := checkPasswordHash(user.PasswordHash, req.Password); err != nil {
		// bcrypt will return ErrMismatchedHashAndPassword for wrong password; log for debug
		log.Printf("Login: password mismatch for email=%s: %v\n", req.Email, err)
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "invalid credentials"})
	}

	// create access token
	accessToken, exp, err := createAccessToken(user.ID, user.Email)
	if err != nil {
		log.Printf("Login: token creation failed for user=%s: %v\n", user.Email, err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "could not create token"})
	}

	// create refresh token (opaque)
	refreshPlain, err := generateRandomToken(32)
	if err != nil {
		log.Printf("Login: refresh token gen failed for user=%s: %v\n", user.Email, err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "could not create refresh token"})
	}
	refreshExp := time.Now().Add(RefreshTokenTTL)
	if err := saveRefreshToken(db.GetCollection("refresh_tokens").Database(), user.ID, refreshPlain, refreshExp); err != nil {
		log.Printf("Login: saveRefreshToken failed for user=%s: %v\n", user.Email, err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "could not save refresh token"})
	}

	// set refresh cookie (note: if testing over HTTP, set Secure:false)
	c.Cookie(&fiber.Cookie{
		Name:     RefreshCookieName,
		Value:    refreshPlain,
		Expires:  refreshExp,
		HTTPOnly: true,
		Secure:   false, // use false while testing locally over HTTP
		SameSite: "Lax",
		Path:     "/api/auth",
	})

	log.Printf("Login: success for user=%s id=%s\n", user.Email, user.ID.Hex())
	return c.Status(fiber.StatusOK).JSON(TokenResponse{
		AccessToken: accessToken,
		ExpiresAt:   exp,
	})
}


// Refresh rotates the refresh token and issues a new access token
func Refresh(c *fiber.Ctx) error {
	// read refresh token from cookie first, fallback to JSON body
	refreshToken := c.Cookies(RefreshCookieName)
	isCookieInput := refreshToken != ""
	if refreshToken == "" {
		var body struct{ RefreshToken string `json:"refresh_token"` }
		if err := c.BodyParser(&body); err == nil {
			refreshToken = body.RefreshToken
		}
	}
	if refreshToken == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "refresh token missing"})
	}

	// look up by hash
	hash := hashToken(refreshToken)
	rt, err := findRefreshTokenByHash(hash)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "invalid refresh token"})
	}

	// check expiry / revoked
	if rt.ExpiresAt.Before(time.Now()) || rt.Revoked {
		if err := deleteRefreshTokenByHash(hash); err != nil {
			log.Printf("Failed to delete expired/revoked token: %v", err)
		}
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "refresh token expired or revoked"})
	}

	userID := rt.UserID
	// fetch user to include email claim
	var user models.User
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := db.GetCollection("users").FindOne(ctx, bson.M{"_id": userID}).Decode(&user); err != nil {
		log.Printf("Failed to find user in refresh: %v", err)
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "user not found"})
	}

	// create new access token
	accessToken, exp, err := createAccessToken(userID, user.Email)
	if err != nil {
		log.Printf("Failed to create access token in refresh: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "could not create access token"})
	}

	// create a new refresh token and save it first (to avoid race)
	newRefresh, err := generateRandomToken(32)
	if err != nil {
		log.Printf("Failed to generate new refresh token: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "could not create refresh token"})
	}
	newExp := time.Now().Add(RefreshTokenTTL)
	if err := saveRefreshToken(db.GetCollection("refresh_tokens").Database(), userID, newRefresh, newExp); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "could not save refresh token"})
	}

	// Now delete old token
	if err := deleteRefreshTokenByHash(hash); err != nil {
		log.Printf("Failed to delete old refresh token: %v", err)
		// Continue, as new token is already saved
	}

	// Prepare response
	resp := TokenResponse{
		AccessToken: accessToken,
		ExpiresAt:   exp,
	}

	if !isCookieInput {
		resp.RefreshToken = newRefresh
	} else {
		// set cookie
		c.Cookie(&fiber.Cookie{
			Name:     RefreshCookieName,
			Value:    newRefresh,
			Expires:  newExp,
			HTTPOnly: true,
			Secure:   true, // Always true in production
			SameSite: "Strict",
			Path:     "/api/auth",
			Domain:   os.Getenv("COOKIE_DOMAIN"),
		})
	}

	return c.Status(fiber.StatusOK).JSON(resp)
}

// Logout revokes the refresh token
func Logout(c *fiber.Ctx) error {
	// get refresh token
	refreshToken := c.Cookies(RefreshCookieName)
	if refreshToken == "" {
		// also accept token in body
		var body struct{ RefreshToken string `json:"refresh_token"` }
		if err := c.BodyParser(&body); err != nil {
			log.Printf("Failed to parse logout body: %v", err)
		} else {
			refreshToken = body.RefreshToken
		}
	}

	if refreshToken != "" {
		hash := hashToken(refreshToken)
		if err := deleteRefreshTokenByHash(hash); err != nil {
			log.Printf("Failed to delete refresh token in logout: %v", err)
			// Continue with logout
		}
	}

	// clear cookie
	c.Cookie(&fiber.Cookie{
		Name:     RefreshCookieName,
		Value:    "",
		Expires:  time.Now().Add(-time.Hour),
		HTTPOnly: true,
		Secure:   true,
		SameSite: "Strict",
		Path:     "/api/auth",
		Domain:   os.Getenv("COOKIE_DOMAIN"),
	})

	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "logged out"})
}

// ProtectedProfile returns the authenticated user's profile
func ProtectedProfile(c *fiber.Ctx) error {
	uid := c.Locals("user_id")
	if uid == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
	}
	idHex, ok := uid.(string)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "invalid token"})
	}
	oid, err := primitive.ObjectIDFromHex(idHex)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "invalid token"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var user models.User
	if err := db.GetCollection("users").FindOne(ctx, bson.M{"_id": oid}).Decode(&user); err != nil {
		log.Printf("Failed to find user in profile: %v", err)
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "user not found"})
	}

	return c.JSON(fiber.Map{
		"id":    user.ID.Hex(),
		"email": user.Email,
	})
}

// JWTMiddleware validates the JWT access token
func JWTMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		auth := c.Get("Authorization")
		if auth == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "missing authorization header"})
		}
		parts := strings.SplitN(auth, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "invalid authorization header"})
		}

		tokenString := parts[1]
		secret := os.Getenv("JWT_SECRET")
		if secret == "" {
			log.Printf("JWT secret not configured")
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "jwt secret not configured"})
		}

		claims := jwt.MapClaims{}
		_, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, errors.New("unexpected signing method")
			}
			return []byte(secret), nil
		})
		if err != nil {
			log.Printf("Invalid token: %v", err)
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "invalid token"})
		}

		// Check expiration
		if exp, ok := claims["exp"].(float64); ok {
			if time.Unix(int64(exp), 0).Before(time.Now()) {
				return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "token expired"})
			}
		} else {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "invalid token claims"})
		}

		// Check issuer
		if iss, ok := claims["iss"].(string); !ok || iss != issuer {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "invalid token issuer"})
		}

		uidRaw, ok := claims["user_id"]
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "invalid token claims"})
		}
		uid, ok := uidRaw.(string)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "invalid token claims"})
		}

		c.Locals("user_id", uid)
		return c.Next()
	}
}