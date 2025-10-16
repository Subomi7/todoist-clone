// src/hooks/useCreateTask.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTask } from "@/api/task";
import type { TaskPayload } from "@/types/task";
import type { Task } from "@/types/task";
import type { ApiResponse } from "@/api/task";

export function useCreateTask() {
  const qc = useQueryClient();

  return useMutation<ApiResponse<{ task: Task }>, Error, TaskPayload>({
    mutationFn: (payload: TaskPayload) => createTask(payload),
    onSuccess: (_res, variables) => {
      // variables is the TaskPayload we sent
      const pid = (variables && (variables.projectId as string | undefined)) ?? null;

      // If projectId is missing → inbox task
      const inboxOnly = pid ? null : true;

      // Invalidate the exact task list that useTasks would query
      qc.invalidateQueries({
        queryKey: ["tasks", pid, false, inboxOnly],
      });

      // Also invalidate the generic "all tasks" cache if you ever query it
      qc.invalidateQueries({
        queryKey: ["tasks"],
      });
    },
  });
}
