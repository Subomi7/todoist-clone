// src/hooks/useUpdateTask.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTask, type ApiResponse } from '@/api/task';
import type { Task } from '@/types/task';

type UpdateArgs = {
  id: string;
  patch: Partial<{
    title: string;
    description: string;
    completed: boolean;
    projectId: string;
    priority?: number;
    dueDate?: string;
  }>;
};

export function useUpdateTask() {
  const qc = useQueryClient();

  return useMutation<ApiResponse<{ task: Task }>, Error, UpdateArgs>({
    mutationFn: ({ id, patch }) => updateTask(id, patch),
    onSuccess: () => {
      // refetch task lists
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}