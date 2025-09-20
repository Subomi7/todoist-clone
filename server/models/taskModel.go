package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)


type Priority int

const (
	PriorityLow Priority = iota + 1
	PriorityMedium
	PriorityHigh
)

type Task struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID      primitive.ObjectID `bson:"userId" json:"userId"`
	ProjectID   primitive.ObjectID `bson:"projectId" json:"projectId"`
	Title       string             `bson:"title" json:"title"`
	Description string             `bson:"description,omitempty" json:"description,omitempty"`
	DueDate     *time.Time         `bson:"dueDate,omitempty" json:"dueDate,omitempty"` // optional
	Priority    Priority           `bson:"priority" json:"priority"`
	Completed   bool               `bson:"completed" json:"completed"`
	CreatedAt   time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt   time.Time          `bson:"updatedAt" json:"updatedAt"`
}