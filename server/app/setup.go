package app

import (
	"os"

	"github.com/Subomi7/todoist-clone/server/config"
	"github.com/Subomi7/todoist-clone/server/db"
	"github.com/Subomi7/todoist-clone/server/router"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

func SetupAndRunApp() error {
	// Load environment variables
	err := config.LoadENV()
	if err != nil {
		return err
	}

	app := fiber.New()

		// attach middleware
	app.Use(recover.New())
	app.Use(logger.New(logger.Config{
		Format: "[${ip}]:${port} ${status} - ${method} ${path} ${latency}\n",
	}))
	app.Use(cors.New(cors.Config{
		AllowOrigins: "http://localhost:5173",
		 AllowHeaders:     "Origin, Content-Type, Accept",
        AllowMethods:     "GET, POST, PUT, DELETE, OPTIONS",
        AllowCredentials: true,
	}))


	// start database
	err = db.StartMongoDB()
	if err != nil {
		return err
	}

	// defer closing database
	defer db.CloseMongoDB()

	router.SetupRoutes(app)

	port := os.Getenv("PORT")
	app.Listen(":" + port)

	return nil
}