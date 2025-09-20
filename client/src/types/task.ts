export type TaskPayload = {
  title: string;
  description?: string;
  dueDate?: string;
  projectId?: string;
  priority?: 1 | 2 | 3;
  [key: string]: unknown;
};