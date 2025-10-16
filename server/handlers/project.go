package handlers

import (
	"context"
	"errors"
	"strconv"
	"strings"
	"time"

	"github.com/Subomi7/todoist-clone/server/db"
	"github.com/Subomi7/todoist-clone/server/models"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

const projectDBtimeout = 8 * time.Second

// DTO
type CreateProjectDTO struct {
	Name string `json:"name"`
}

type UpdateProjectDTO struct {
	Name string `json:"name"`
}

type ProjectResponse struct {
	Data *models.Project `json:"data"`
}

type ProjectsListResponse struct {
	Data []*models.Project `json:"data"`
	Meta models.PaginationMeta `json:"meta"`
}



// getUserIdFromCtx (re-use your JWT local name "user_id")
func getUserID(c *fiber.Ctx) (primitive.ObjectID, error) {
	uidRaw := c.Locals("user_id")
	if uidRaw == nil {
		return primitive.NilObjectID, errors.New("unauthorized")
	}
	uidStr, ok := uidRaw.(string)
	if !ok {
		return primitive.NilObjectID, errors.New("unauthorized")
	}
	uid, err := primitive.ObjectIDFromHex(uidStr)
	if err != nil {
		return primitive.NilObjectID, errors.New("unauthorized")
	}
	return uid, nil
}



// CreateProject - create a project for the authenticated user.
// returns 201 and created project, 400 on validation, 409 on duplicate.
func CreateProject(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
	}	

	var dto CreateProjectDTO
	if err := c.BodyParser(&dto); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error":"invalid body"})
	}
	name := strings.TrimSpace(dto.Name)
	if name == "" {
		return  c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error":"name is required"})
	}

	now := time.Now().UTC()
	proj := models.Project{
		ID:        primitive.NewObjectID(),
		UserID:    userID,
		Name:      name,
		CreatedAt: now,
		UpdatedAt: now,
	}

	ctx, cancel := context.WithTimeout(context.Background(), projectDBtimeout)
	defer cancel()

	col := db.ProjectsCol()
	_, err = col.InsertOne(ctx, proj)
	if err != nil {
		if we, ok := err.(mongo.WriteException); ok {
			for _, e := range we.WriteErrors {
				if e.Code == 11000 {
					return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error":"project with this name already exists"})
				}
			}
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error":"failed to create project"})
	}
	return c.Status(fiber.StatusCreated).JSON(ProjectResponse{Data: &proj})
}

func GetProjects(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
	}

	page := 1
	pageSize := 10
	if p := c.Query("page", ""); p != "" {
		if v, err := strconv.Atoi(p); err == nil && v > 0 {
			page = v
		}
	}
	if ps := c.Query("pageSize", ""); ps != "" {
		if v, err := strconv.Atoi(ps); err == nil && v > 0 {
			pageSize = v
		}
	}

	ctx, cancel := context.WithTimeout(context.Background(), projectDBtimeout)
	defer cancel()

	col := db.ProjectsCol()

	// Build aggregation pipeline
	pipeline := mongo.Pipeline{
		// Only fetch projects belonging to this user
		{{Key: "$match", Value: bson.M{"userId": userID}}},
		// Lookup tasks that belong to each project (excluding completed)
		{
			{Key: "$lookup", Value: bson.M{
				"from": "tasks",
				"let": bson.M{"projId": "$_id"},
				"pipeline": bson.A{
					bson.M{
						"$match": bson.M{
							"$expr": bson.M{"$and": bson.A{
								bson.M{"$eq": bson.A{"$projectId", "$$projId"}},
								bson.M{"$eq": bson.A{"$userId", userID}},
								bson.M{"$eq": bson.A{"$completed", false}},
							}},
						},
					},
				},
				"as": "projectTasks",
			}},
		},
		// Add a taskCount field
		{{Key: "$addFields", Value: bson.M{"taskCount": bson.M{"$size": "$projectTasks"}}}},
		// Remove the full tasks array
		{{Key: "$project", Value: bson.M{"projectTasks": 0}}},
		// Sort and paginate
		{{Key: "$sort", Value: bson.M{"created_at": -1}}},
		{{Key: "$skip", Value: (page - 1) * pageSize}},
		{{Key: "$limit", Value: pageSize}},
	}

	cur, err := col.Aggregate(ctx, pipeline)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to aggregate projects"})
	}
	defer cur.Close(ctx)

	// Define a custom struct to hold project + taskCount
	type ProjectWithCount struct {
		ID          primitive.ObjectID `bson:"_id" json:"id"`
		UserID      primitive.ObjectID `bson:"userId" json:"userId"`
		Name        string             `bson:"name" json:"name"`
		Description string             `bson:"description" json:"description"`
		IsSystem    bool               `bson:"is_system" json:"is_system"`
		CreatedAt   time.Time          `bson:"created_at" json:"created_at"`
		UpdatedAt   time.Time          `bson:"updated_at" json:"updated_at"`
		TaskCount   int                `bson:"taskCount" json:"taskCount"`
	}

	var projects []*ProjectWithCount
	if err := cur.All(ctx, &projects); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to decode aggregated projects"})
	}

	// Count total (without pagination)
	total, err := col.CountDocuments(ctx, bson.M{"userId": userID})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to count projects"})
	}

	meta := models.PaginationMeta{Page: page, PageSize: pageSize, Total: int(total)}

	return c.JSON(fiber.Map{
		"data": projects,
		"meta": meta,
	})
}


// GetProject - fetch a single project by id (ensures ownership)
func GetProject(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
	}
	idParam := c.Params("id")
	objID, err := primitive.ObjectIDFromHex(idParam)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid project id"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), projectDBtimeout)
	defer cancel()
	col := db.ProjectsCol()

	var proj models.Project
	if err := col.FindOne(ctx, bson.M{"_id": objID, "userId": userID}).Decode(&proj); err != nil {
		if err == mongo.ErrNoDocuments {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "project not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to fetch project"})
	}

	return c.Status(fiber.StatusOK).JSON(ProjectResponse{Data: &proj})
}

// UpdateProject - rename a project (ensures ownership and unique name)
func UpdateProject(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
	}
	idParam := c.Params("id")
	objID, err := primitive.ObjectIDFromHex(idParam)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid project id"})
	}

	var dto UpdateProjectDTO
	if err := c.BodyParser(&dto); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid body"})
	}
	name := strings.TrimSpace(dto.Name)
	if name == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "name is required"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), projectDBtimeout)
	defer cancel()
	col := db.ProjectsCol()

	res, err := col.UpdateOne(ctx, bson.M{"_id": objID, "userId": userID}, bson.M{"$set": bson.M{"name": name, "updatedAt": time.Now().UTC()}})
	if err != nil {
		// duplicate name?
		if we, ok := err.(mongo.WriteException); ok {
			for _, e := range we.WriteErrors {
				if e.Code == 11000 {
					return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "project with that name already exists"})
				}
			}
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to update project"})
	}
	if res.MatchedCount == 0 {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "project not found"})
	}

	// return updated project
	var proj models.Project
	if err := col.FindOne(ctx, bson.M{"_id": objID, "userId": userID}).Decode(&proj); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to fetch updated project"})
	}

	return c.Status(fiber.StatusOK).JSON(ProjectResponse{Data: &proj})
}

// DeleteProject - reassign tasks to Inbox (NilObjectID) and delete the project
func DeleteProject(c *fiber.Ctx) error {
    userID, err := getUserID(c)
    if err != nil {
        return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
    }
    idParam := c.Params("id")
    objID, err := primitive.ObjectIDFromHex(idParam)
    if err != nil {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid project id"})
    }

    ctx, cancel := context.WithTimeout(context.Background(), projectDBtimeout)
    defer cancel()

    pcol := db.ProjectsCol()

    // ensure project exists & belongs to user
    var proj models.Project
    if err := pcol.FindOne(ctx, bson.M{"_id": objID, "userId": userID}).Decode(&proj); err != nil {
        if err == mongo.ErrNoDocuments {
            return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "project not found"})
        }
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to verify project"})
    }

    // Block deleting "Inbox"
    if strings.EqualFold(proj.Name, "Inbox") {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "cannot delete Inbox project"})
    }

    // Find the user's Inbox project ID
    inboxID, err := GetInboxProjectID(ctx, userID)
    if err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "could not resolve inbox"})
    }

    // Reassign tasks from this project to Inbox
    tcol := db.TasksCol()
    if _, err := tcol.UpdateMany(
        ctx,
        bson.M{"projectId": objID, "userId": userID},
        bson.M{"$set": bson.M{"projectId": inboxID, "updatedAt": time.Now().UTC()}},
    ); err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to reassign tasks"})
    }

    // Delete the project
    if _, err := pcol.DeleteOne(ctx, bson.M{"_id": objID, "userId": userID}); err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to delete project"})
    }

    return c.SendStatus(fiber.StatusNoContent)
}
