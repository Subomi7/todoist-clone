package app

import (
	"os"

	"github.com/Subomi7/todoist-clone/server/database"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
)


func SetupAndRunApp() {
	// Initialize the Fiber app
	app := fiber.New()

	app.Use(recover.New())
	app.Use(logger.New())

	// Set up the database connection
	err := database.StartMongoDB()
	if err != nil {
		panic(err)
	}

	// get the port and start
	port := os.Getenv("PORT")
	app.Listen(":" + port)

	return nil
}
