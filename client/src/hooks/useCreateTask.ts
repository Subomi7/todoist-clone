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
      // variables is the TaskPayload we sent. Use its projectId if present.
      const pid = (variables && (variables.projectId as string | undefined)) ?? null;

      // Invalidate project-scoped key
      qc.invalidateQueries({ queryKey: ["tasks", pid, false] }); // inbox / project list (not completed)
      // Also invalidate top-level tasks list (no project)
      qc.invalidateQueries({ queryKey: ["tasks", null, false] });
      // optionally invalidate any top-level tasks keys that might be used elsewhere:
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

