import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteTask } from "@/api/task";

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
