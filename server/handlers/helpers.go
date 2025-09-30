package handlers

import (
	"context"
	"log"
	"time"

	"github.com/Subomi7/todoist-clone/server/db"
	"github.com/Subomi7/todoist-clone/server/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func GetInboxProjectID(ctx context.Context, userID primitive.ObjectID) (primitive.ObjectID, error) {
    col := db.ProjectsCol()

    var proj models.Project
    err := col.FindOne(ctx, bson.M{
        "userId": userID,
        "name":    "Inbox",
    }).Decode(&proj)

    if err == mongo.ErrNoDocuments {
        now := time.Now().UTC()
        proj = models.Project{
            ID:        primitive.NewObjectID(),
            UserID:    userID,
            Name:      "Inbox",
            CreatedAt: now,
            UpdatedAt: now,
        }
        _, err := col.InsertOne(ctx, proj)
        if err != nil {
            log.Printf("[GetInboxProjectID] failed to create Inbox project for user %s: %v", userID.Hex(), err)
            return primitive.NilObjectID, err
        }
        log.Printf("[GetInboxProjectID] created Inbox project for user %s with ID %s", userID.Hex(), proj.ID.Hex())
        return proj.ID, nil
    } else if err != nil {
        log.Printf("[GetInboxProjectID] failed to query Inbox for user %s: %v", userID.Hex(), err)
        return primitive.NilObjectID, err
    }
        log.Printf("[GetInboxProjectID] found existing Inbox project for user %s with ID %s", userID.Hex(), proj.ID.Hex())
    return proj.ID, nil
}
