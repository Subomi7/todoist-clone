import { z } from "zod"

export const taskSchema = z.object({
  title: z
    .string()
    .min(1, "Task title is required")
    .max(150, "Title is too long"),

  description: z
    .string()
    .min(1, "Task description is required")
    .max(1000, "Description is too long"),

  dueDate: z
    .date()
    .optional(),

  projectId: z
    .string()
    .optional(),

  priority: z
    .number()
    .min(1)
    .max(3)
    .default(2),
})
