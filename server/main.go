package main

import (
	"github.com/Subomi7/todoist-clone/server/app"
)

func main() {
	
	err := app.SetupAndRunApp()
	if err != nil {
		panic(err)
	}
}
