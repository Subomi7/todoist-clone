import { useMutation } from "@tanstack/react-query";
import { createTask } from "@/api/task";
import type { TaskPayload } from "@/types/task";

export function useCreateTask() {
  return useMutation({
    mutationFn: (payload: TaskPayload) => createTask(payload),
  });
}
