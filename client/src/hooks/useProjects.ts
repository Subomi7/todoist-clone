// src/hooks/useProjects.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjects, createProject } from '@/api/project';
import type { Project as ProjectType } from '@/types/project';

export function useProjects() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  const projects = (data?.data ?? []) as ProjectType[];

  const inboxProject =
    projects.find((p) => String(p.name ?? '').toLowerCase() === 'inbox') ??
    projects.find((p) => Boolean((p as any).isSystem));
  const inboxId = inboxProject
    ? ((inboxProject as any)._id ?? (inboxProject as any).id)
    : undefined;

  // --- NEW mutation for creating projects ---
  const createProjectMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  return {
    projects,
    inboxId,
    isLoading,
    isError,
    error,
    createProjectMutation,
  };
}
