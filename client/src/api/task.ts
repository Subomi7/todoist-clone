import type { TaskPayload } from '@/types/task';

export type ApiResponse<T = unknown> = {
  ok: boolean
  data?: T
  message?: string
}

export async function createTask(payload: TaskPayload): Promise<ApiResponse> {
  const token = localStorage.getItem("auth_token")

  if (!token) {
    return {
      ok: false,
      message: "Not authenticated. Please log in first.",
    }
  }

  const body = {
    ...payload,
    priority: payload.priority ?? 2,
  };

  try {
    const response = await fetch("http://localhost:8080/api/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        ok: false,
        message: data?.message || "Failed to create task",
      }
    }

    return {
      ok: true,
      data,
    }
  } catch (error) {
    console.error("Error creating task:", error)
    return {
      ok: false,
      message: "Network error. Please try again.",
    }
  }
}
