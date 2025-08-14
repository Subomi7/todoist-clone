package app

import (
	"os"

	"github.com/Subomi7/todoist-clone/server/config"
	"github.com/Subomi7/todoist-clone/server/db"
	"github.com/gofiber/fiber/v2"
)

func SetupAndRunApp() error {
	// Load environment variables
	err := config.LoadENV()
	if err != nil {
		return err
	}

	app := fiber.New()

	// start database
	err = db.StartMongoDB()
	if err != nil {
		return err
	}

	// defer closing database
	defer db.CloseMongoDB()
	

	port := os.Getenv("PORT")
	app.Listen(":" + port)

	return nil
}