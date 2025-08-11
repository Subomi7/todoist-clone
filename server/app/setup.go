package app

import (
	"github.com/gofiber/fiber/v2"
)


func SetupAndRunApp() {
	// Initialize the Fiber app
	app := fiber.New()

	// attach middlewares
	app.Use(recover.New())
	app.Use(logger.New)
}