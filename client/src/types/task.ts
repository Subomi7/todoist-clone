export type TaskPayload = {
  title: string;
  description?: string;
  dueDate?: string;
  projectId?: string;
  priority?: 1 | 2 | 3;
  [key: string]: unknown;
};

// src/types/task.ts
export interface Task {
  _id: string;
  id?: string;  
  title: string;
  description?: string;
  priority: 1 | 2 | 3;
  dueDate?: string | null;
  completed: boolean;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}


