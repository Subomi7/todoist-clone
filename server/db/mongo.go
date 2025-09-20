package db

import (
    "context"
    "fmt"
    "log"
    "os"
    "time"

    "go.mongodb.org/mongo-driver/bson"
    "go.mongodb.org/mongo-driver/mongo"
    "go.mongodb.org/mongo-driver/mongo/options"
)

var mongoClient *mongo.Client
var dbName string

func GetCollection(name string) *mongo.Collection {
    return mongoClient.Database(dbName).Collection(name)
}

func StartMongoDB() error {
    uri := os.Getenv("MONGODB_URI")
    if uri == "" {
        return fmt.Errorf("MONGODB_URI not set")
    }

    dbName = os.Getenv("DATABASE")
    if dbName == "" {
        return fmt.Errorf("DATABASE not set")
    }

    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    var err error
    mongoClient, err = mongo.Connect(ctx, options.Client().ApplyURI(uri))
    if err != nil {
        return fmt.Errorf("failed to connect to MongoDB: %w", err)
    }

    if err = mongoClient.Ping(ctx, nil); err != nil {
        return fmt.Errorf("failed to ping MongoDB: %w", err)
    }

    log.Println("Connected to MongoDB successfully")

    // Create indexes with error checking
    users := GetCollection("users")
    _, err = users.Indexes().CreateOne(ctx, mongo.IndexModel{
        Keys:    bson.D{{Key: "email", Value: 1}},
        Options: options.Index().SetUnique(true),
    })
    if err != nil {
        return fmt.Errorf("failed to create users email index: %w", err)
    }

    refreshIndex := GetCollection("refresh_tokens")
    _, err = refreshIndex.Indexes().CreateOne(ctx, mongo.IndexModel{
        Keys:    bson.D{{Key: "token_hash", Value: 1}},
        Options: options.Index().SetUnique(true),
    })
    if err != nil {
        return fmt.Errorf("failed to create refresh_tokens token_hash index: %w", err)
    }

    // Optional: TTL index for refresh tokens
    _, err = refreshIndex.Indexes().CreateOne(ctx, mongo.IndexModel{
        Keys:    bson.D{{Key: "expires_at", Value: 1}},
        Options: options.Index().SetExpireAfterSeconds(0),
    })
    if err != nil {
        log.Printf("Warning: failed to create TTL index: %v", err)
    }

    // New: Unique index on projects for userId and name
    projects := GetCollection("projects")
    _, err = projects.Indexes().CreateOne(ctx, mongo.IndexModel{
        Keys:    bson.D{{Key: "userId", Value: 1}, {Key: "name", Value: 1}},
        Options: options.Index().SetUnique(true),
    })
    if err != nil {
        return fmt.Errorf("failed to create projects unique index on userId and name: %w", err)
    }

    // New: Indexes on tasks for userId and projectId
    tasks := GetCollection("tasks")
    // Index on userId for fast user-specific queries
    _, err = tasks.Indexes().CreateOne(ctx, mongo.IndexModel{
        Keys: bson.D{{Key: "userId", Value: 1}},
    })
    if err != nil {
        return fmt.Errorf("failed to create tasks index on userId: %w", err)
    }
    // Index on projectId for fast project-specific queries (if applicable)
    _, err = tasks.Indexes().CreateOne(ctx, mongo.IndexModel{
        Keys: bson.D{{Key: "projectId", Value: 1}},
    })
    if err != nil {
        return fmt.Errorf("failed to create tasks index on projectId: %w", err)
    }
    // Optional: Compound index if queries often filter on both
    _, err = tasks.Indexes().CreateOne(ctx, mongo.IndexModel{
        Keys: bson.D{{Key: "userId", Value: 1}, {Key: "projectId", Value: 1}},
    })
    if err != nil {
        log.Printf("Warning: failed to create compound index on tasks userId and projectId: %v", err)
    }

    return nil
}

func CloseMongoDB() {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    if err := mongoClient.Disconnect(ctx); err != nil {
        log.Printf("Failed to disconnect from MongoDB: %v", err)
    }
}