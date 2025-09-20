package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type RefreshToken struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID    primitive.ObjectID `bson:"user_id" json:"user_id"`
	TokenHash string             `bson:"token_hash" json:"-"`
	CreatedAt time.Time         `bson:"created_at" json:"created_at"`
	ExpiresAt time.Time         `bson:"expires_at" json:"expires_at"`
	Revoked   bool               `bson:"revoked" json:"revoked"`
}
