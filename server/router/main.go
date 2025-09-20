package router

import (
	"github.com/Subomi7/todoist-clone/server/handlers"
	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App) {
	api := app.Group("/api")

	auth := api.Group("/auth")
	auth.Post("/register", handlers.Register)
	auth.Post("/login", handlers.Login)

	taskGroup := api.Group("/tasks", handlers.JWTMiddleware())
	taskGroup.Post("/", handlers.CreateTask)
	taskGroup.Get("/", handlers.GetTasks)
	taskGroup.Get("/:id", handlers.GetTask)
	taskGroup.Put("/:id", handlers.UpdateTask)
	taskGroup.Delete("/:id", handlers.DeleteTask)

	projects := api.Group("/projects", handlers.JWTMiddleware())
	projects.Post("/", handlers.CreateProject)
	projects.Get("/", handlers.GetProjects)
	projects.Get("/:id", handlers.GetProject)
	projects.Put("/:id", handlers.UpdateProject)
	projects.Delete("/:id", handlers.DeleteProject)

	projectTasks := projects.Group("/:id/tasks")
projectTasks.Get("/", handlers.GetProjects)

}
