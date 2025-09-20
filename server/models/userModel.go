package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
	ID       primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Email       string             `json:"email" bson:"email"`
	PasswordHash string             `json:"passwordHash" bson:"password_hash"`
	CreatedAt   time.Time         `json:"createdAt" bson:"created_at"`
}
