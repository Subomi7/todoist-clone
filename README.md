🗂️ Todoist-Style Task Manager (Full Stack)

A modern, responsive task management dashboard inspired by Todoist, built with a powerful Go + Fiber backend and a sleek React + TypeScript + Shadcn UI frontend.
It provides project-based organization, intuitive CRUD operations, and a mobile-friendly dashboard experience.

🏗️ Tech Stack
Frontend

⚛️ React 18 + Vite + TypeScript

🎨 Tailwind CSS + Shadcn/UI (Radix primitives + custom components)

🧭 React Router DOM

🔄 TanStack Query (React Query)

💡 Lucide React + React-Icons

🧩 Context API for sidebar and global state management

Backend

🦦 Go 1.22 + Fiber v2

🗃️ MongoDB (official Go driver)

🔐 Middleware – CORS, Logger, Error Handling

📁 Modular architecture (handlers, models, router, database, config)

🌟 Features
🖥️ Frontend

Responsive sidebar with smooth open/close transitions

Task and project CRUD modals with Zod + React Hook Form validation

Toast-style success/error feedback

Auto-collapsing sidebar on mobile

Consistent design system with Shadcn UI

⚙️ Backend

RESTful API endpoints for:

/api/projects – Create, Read, Update, Delete projects

/api/tasks – Full CRUD for tasks

/api/auth – Signup / Login / Token validation

JSON payload validation and structured responses

Environment-based configuration via .env

Graceful MongoDB connection handling

🧱 Project Structure:
.
├── client/ # React Frontend
│ ├── src/
│ │ ├── components/
│ │ ├── pages/
│ │ ├── hooks/
│ │ ├── layout/
│ │ └── main.tsx
│ ├── public/
│ ├── vite.config.ts
│ └── package.json
│
├── server/ # Go Backend
│ ├── app/
│ │ └── setup.go
│ ├── config/
│ │ ├── env.go
│ │ └── swagger.go
│ ├── database/
│ │ └── mongo.go
│ ├── handlers/
│ ├── models/
│ ├── router/
│ │ └── router.go
│ ├── main.go
│ └── go.mod
│
└── README.md

⚙️ Setup & Installation
1️⃣ Clone Repository:
git clone https://github.com/Subomi7/todoist-clone.git
cd todoist-clone

2️⃣ Backend Setup
cd server
cp .env.example .env
go mod tidy
go run main.go

Example .env
PORT=8080
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/todoist
DB_NAME=todoist_db

3️⃣ Frontend Setup

cd client
npm install
npm run dev

🔗 Connecting Frontend and Backend

Inside the client, configure API base URL in an .env file:
VITE_API_URL=http://localhost:8080/api

The frontend uses this URL to fetch and mutate tasks/projects via React Query.

📱 Responsive Behavior

Desktop: Sidebar expands/collapses smoothly with content sliding.

Mobile: Sidebar overlays content; toggled with the custom hamburger icon.

📖 Usage

Sign up or log in to access your dashboard.

Create projects and add tasks via the modal interface.

Manage your workflow with real-time updates and validation feedback.

🤝 Contributing

Contributions, issues, and feature requests are welcome.
Fork the repo and submit a pull request with clear commits.
