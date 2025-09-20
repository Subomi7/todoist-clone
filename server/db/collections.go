package db

import (
	"go.mongodb.org/mongo-driver/mongo"
)

func ProjectsCol() *mongo.Collection {
	return GetCollection("projects")
}

// helper to get tasks collection
func TasksCol() *mongo.Collection {
	return GetCollection("tasks")
}
