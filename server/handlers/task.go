package handlers

import (
	"context"
	"errors"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"

	"github.com/Subomi7/todoist-clone/server/db"
	"github.com/Subomi7/todoist-clone/server/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// db timeout used across handlers (same as other handlers)
const dbOpTimeout = 6 * time.Second

// CreateTaskDTO - explicit input payload for creating a task
type CreateTaskDTO struct {
	Title       string `json:"title"`
	Description string `json:"description,omitempty"`
	DueDate     string `json:"dueDate,omitempty"`   // RFC3339 string (optional)
	Priority    int    `json:"priority,omitempty"`  // 1=Low,2=Medium,3=High
	ProjectID   string `json:"projectId,omitempty"` // optional: hex string of project
}

// CreateTaskResponse
type CreateTaskResponse struct {
	Data models.Task `json:"data"`
}

type TaskResponse = CreateTaskResponse

type PaginationMeta struct {
    Page     int   `json:"page"`
    PageSize int   `json:"pageSize"`
    Total    int64 `json:"total"`
}

type TasksListResponse struct {
    Data []models.Task  `json:"data"`
    Meta PaginationMeta `json:"meta"`
}

// helper to get tasks and projects collections
// func tasksCol() *mongo.Collection {
// 	return db.GetCollection("tasks")
// }
// func projectsCol() *mongo.Collection {
// 	return db.GetCollection("projects")
// }

// getUserIDFromCtx extracts the user ID from Fiber context and returns it as primitive.ObjectID.
func getUserIDFromCtx(c *fiber.Ctx) (primitive.ObjectID, error) {
	uidRaw := c.Locals("user_id")
	uidStr, ok := uidRaw.(string)
	if !ok || uidStr == "" {
		return primitive.NilObjectID, errors.New("unauthorized")
	}
	userID, err := primitive.ObjectIDFromHex(uidStr)
	if err != nil {
		return primitive.NilObjectID, errors.New("unauthorized")
	}
	return userID, nil
}

// validatePriority ensures the numeric priority maps to the enum
func validatePriority(p int) (models.Priority, error) {
	switch p {
	case int(models.PriorityLow):
		return models.PriorityLow, nil
	case int(models.PriorityMedium):
		return models.PriorityMedium, nil
	case int(models.PriorityHigh):
		return models.PriorityHigh, nil
	case 0:
		// default to medium if not set
		return models.PriorityMedium, nil
	default:
		return 0, errors.New("invalid priority")
	}
}


// resolveProject: given an optional projectId string, return a valid project ObjectID.
// If projectId is empty, return primitive.NilObjectID to indicate "inbox" (no actual Project document).
// Verifies that the project belongs to the user when provided.
// func resolveProject(ctx context.Context, userID primitive.ObjectID, projectId string) (primitive.ObjectID, error) {
// 	col := db.ProjectsCol()

// 	// If no projectId provided, treat as Inbox (logical only — don't create a Project doc).
// 	if strings.TrimSpace(projectId) == "" {
// 		return primitive.NilObjectID, nil // NIL indicates "inbox"
// 	}





// CreateTask creates a task with title, description, dueDate, priority and project.
// - If projectId omitted, uses (or creates) the user's Inbox project.
func CreateTask(c *fiber.Ctx) error {
    uidRaw := c.Locals("user_id")
    uidStr, ok := uidRaw.(string)
    if !ok || uidStr == "" {
        return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
    }
    userID, err := primitive.ObjectIDFromHex(uidStr)
    if err != nil {
        return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
    }

    var dto CreateTaskDTO
    if err := c.BodyParser(&dto); err != nil {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid body"})
    }

    title := strings.TrimSpace(dto.Title)
    if title == "" {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "title is required"})
    }

    // validate priority
    priorityVal, err := validatePriority(dto.Priority)
    if err != nil {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid priority; allowed: 1 (Low), 2 (Medium), 3 (High)"})
    }

    // parse due date
    var dueDatePtr *time.Time
    if s := strings.TrimSpace(dto.DueDate); s != "" {
        parsed, err := time.Parse(time.RFC3339, s)
        if err != nil {
            return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid dueDate: expected RFC3339 (e.g. 2025-08-01T15:04:05Z)"})
        }
        t := parsed.UTC()
        dueDatePtr = &t
    }

    ctx, cancel := context.WithTimeout(context.Background(), dbOpTimeout)
    defer cancel()

    now := time.Now().UTC()
    var task models.Task

    if strings.TrimSpace(dto.ProjectID) == "" {
        // No project provided → resolve Inbox
        inboxID, err := GetInboxProjectID(ctx, userID)
        if err != nil {
            return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "could not resolve inbox"})
        }

        task = models.Task{
            ID:          primitive.NewObjectID(),
            UserID:      userID,
            ProjectID:   inboxID,   // still stored as project
            InboxID:     &inboxID,  // explicit marker
            Title:       title,
            Description: strings.TrimSpace(dto.Description),
            DueDate:     dueDatePtr,
            Priority:    priorityVal,
            Completed:   false,
            CreatedAt:   now,
            UpdatedAt:   now,
        }
    } else {
        // Project provided → validate and use
        projectID, err := primitive.ObjectIDFromHex(dto.ProjectID)
        if err != nil {
            return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid projectId"})
        }

        var proj models.Project
        if err := db.ProjectsCol().FindOne(ctx, bson.M{"_id": projectID, "userId": userID}).Decode(&proj); err != nil {
            if err == mongo.ErrNoDocuments {
                return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "project not found"})
            }
            return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to verify project"})
        }

        task = models.Task{
            ID:          primitive.NewObjectID(),
            UserID:      userID,
            ProjectID:   projectID,
            InboxID:     nil, // not an inbox task
            Title:       title,
            Description: strings.TrimSpace(dto.Description),
            DueDate:     dueDatePtr,
            Priority:    priorityVal,
            Completed:   false,
            CreatedAt:   now,
            UpdatedAt:   now,
        }
    }

    if _, err := db.TasksCol().InsertOne(ctx, task); err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to create task"})
    }
    return c.Status(fiber.StatusCreated).JSON(TaskResponse{Data: task})
}


// ListQuery holds query parameters for paginated task listing.
type ListQuery struct {
	Page     int
	PageSize int
	Completed *bool
	Search   string
	SortBy   string
}

// parseListQuery parses query parameters from the Fiber context for task listing.
func parseListQuery(c *fiber.Ctx) ListQuery {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	if page < 1 {
		page = 1
	}
	pageSize, _ := strconv.Atoi(c.Query("pageSize", "20"))
	if pageSize < 1 {
		pageSize = 20
	}
	var completed *bool
	if v := c.Query("completed"); v != "" {
		val := v == "true" || v == "1"
		completed = &val
	}
	search := c.Query("search", "")
	sortBy := c.Query("sortBy", "-createdAt")
	return ListQuery{
		Page:     page,
		PageSize: pageSize,
		Completed: completed,
		Search:   search,
		SortBy:   sortBy,
	}
}

// buildFilter constructs a MongoDB filter for listing tasks based on user ID and query parameters.
func buildFilter(uid primitive.ObjectID, q ListQuery, projectID string, inboxOnly bool) bson.M {
    filter := bson.M{
        "userId": uid,
    }

     // if inboxOnly flag, filter by inboxId
    if inboxOnly {
        ctx, cancel := context.WithTimeout(context.Background(), dbOpTimeout)
        defer cancel()

        inboxID, err := GetInboxProjectID(ctx, uid)
        if err == nil {
            filter["inboxId"] = inboxID
        }
    } else if strings.TrimSpace(projectID) != "" {
        // filter by projectId if provided
        if pid, err := primitive.ObjectIDFromHex(projectID); err == nil {
            filter["projectId"] = pid
        }
    }

    if q.Completed != nil {
        filter["completed"] = *q.Completed
    }
    if q.Search != "" {
        filter["$or"] = []bson.M{
            {"title": bson.M{"$regex": q.Search, "$options": "i"}},
            {"description": bson.M{"$regex": q.Search, "$options": "i"}},
        }
    }
    return filter
}


// GetTasks returns a paginated list of tasks for the authenticated user.
// supports ?page=&pageSize=&completed=&search=&sortBy=
func GetTasks(c *fiber.Ctx) error {
    uid, err := getUserIDFromCtx(c)
    if err != nil {
        return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
    }
    q := parseListQuery(c)
    projectID := c.Query("projectId", "")
	inboxOnly := c.Query("inbox") == "true"

	if inboxOnly && projectID != "" {
    return c.Status(fiber.StatusBadRequest).
        JSON(fiber.Map{"error": "cannot filter by both inbox and projectId"})
}

    filter := buildFilter(uid, q, projectID, inboxOnly)

    ctx, cancel := context.WithTimeout(context.Background(), dbOpTimeout)
    defer cancel()

    col := db.TasksCol()

    total, err := col.CountDocuments(ctx, filter)
    if err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to count tasks"})
    }

    findOpts := options.Find()
    if q.SortBy != "" {
        order := 1
        sortField := q.SortBy
        if strings.HasPrefix(q.SortBy, "-") {
            order = -1
            sortField = strings.TrimPrefix(q.SortBy, "-")
        }
        findOpts.SetSort(bson.D{{Key: sortField, Value: order}})
    }
    skip := int64((q.Page - 1) * q.PageSize)
    limit := int64(q.PageSize)
    findOpts.SetSkip(skip)
    findOpts.SetLimit(limit)

    cursor, err := col.Find(ctx, filter, findOpts)
    if err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to fetch tasks"})
    }
    defer cursor.Close(ctx)

    var tasks []models.Task
    if err := cursor.All(ctx, &tasks); err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to decode tasks"})
    }

    meta := PaginationMeta{
        Page:     q.Page,
        PageSize: q.PageSize,
        Total:    total,
    }
    return c.JSON(TasksListResponse{Data: tasks, Meta: meta})
}



// GetTask returns one task by id for the authenticated user.
func GetTask(c *fiber.Ctx) error {
	type TaskResponse struct {
    Data *models.Task `json:"data"`
}
	uid, err := getUserIDFromCtx(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
	}

	idParam := c.Params("id")
	objID, err := primitive.ObjectIDFromHex(idParam)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid task id"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), dbOpTimeout)
	defer cancel()
	col := db.TasksCol()

	var task models.Task
	err = col.FindOne(ctx, bson.M{"_id": objID, "userId": uid}).Decode(&task)
	if err != nil {
		// differentiate not found vs other errors
		if err == mongo.ErrNoDocuments {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "task not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to fetch task"})
	}

	return c.JSON(TaskResponse{Data: &task})
}

// UpdateTask updates a task fields (title/description/completed) for the authenticated user.
func UpdateTask(c *fiber.Ctx) error {
	type UpdateTaskDTO struct {
    Title       *string `json:"title,omitempty"`
    Description *string `json:"description,omitempty"`
    Completed   *bool   `json:"completed,omitempty"`
    DueDate     *time.Time          `json:"dueDate,omitempty"`
	Priority    *models.Priority    `json:"priority,omitempty"`
	ProjectID   *primitive.ObjectID `json:"projectId,omitempty"`
}

type TaskResponse struct {
    Data *models.Task `json:"data"`
}


	uid, err := getUserIDFromCtx(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
	}

	idParam := c.Params("id")
	objID, err := primitive.ObjectIDFromHex(idParam)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid task id"})
	}

	var dto UpdateTaskDTO
	if err := c.BodyParser(&dto); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid body"})
	}

	// build update doc only with provided fields
	set := bson.M{"updatedAt": time.Now().UTC()}
	if dto.Title != nil {
		title := strings.TrimSpace(*dto.Title)
		if title == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "title cannot be empty"})
		}
		set["title"] = title
	}
	if dto.Description != nil {
		set["description"] = strings.TrimSpace(*dto.Description)
	}
	if dto.Completed != nil {
		set["completed"] = *dto.Completed
	}
	if dto.DueDate != nil {
		set["dueDate"] = dto.DueDate
	}
	if dto.Priority != nil {
		set["priority"] = *dto.Priority
	}
	if dto.ProjectID != nil {
		set["projectId"] = dto.ProjectID
	}


	// if no fields to update
	if len(set) == 1 { // only updatedAt present
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "no update fields provided"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), dbOpTimeout)
	defer cancel()
	col := db.TasksCol()

	res, err := col.UpdateOne(ctx, bson.M{"_id": objID, "userId": uid}, bson.M{"$set": set})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to update task"})
	}
	if res.MatchedCount == 0 {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "task not found"})
	}

	// return updated resource (fetch fresh)
	var updated models.Task
	if err := col.FindOne(ctx, bson.M{"_id": objID, "userId": uid}).Decode(&updated); err != nil {
		// shouldn't usually happen; return generic message
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to fetch updated task"})
	}

	return c.JSON(TaskResponse{Data: &updated})
}

// DeleteTask removes a task for the authenticated user.
func DeleteTask(c *fiber.Ctx) error {
	uid, err := getUserIDFromCtx(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
	}

	idParam := c.Params("id")
	objID, err := primitive.ObjectIDFromHex(idParam)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid task id"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), dbOpTimeout)
	defer cancel()
	col := db.TasksCol()

	res, err := col.DeleteOne(ctx, bson.M{"_id": objID, "userId": uid})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to delete task"})
	}
	if res.DeletedCount == 0 {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "task not found"})
	}

	return c.SendStatus(fiber.StatusNoContent) // 204 No Content on successful delete
}
