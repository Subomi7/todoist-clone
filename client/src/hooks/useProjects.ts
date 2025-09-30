// src/hooks/useProjects.ts
import { useQuery } from '@tanstack/react-query';
import { getProjects } from '@/api/project';
import type { Project as ProjectType } from '@/types/project';

type UseProjectsResult = {
  projects: ProjectType[];
  inboxId?: string;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  raw?: unknown;
};

export function useProjects(): UseProjectsResult {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['projects'],
    queryFn: () => getProjects(),
  });

  // Normalize shape -> Project[]
  const projects = (data?.data ?? []) as ProjectType[];

  // find inbox: by name "Inbox" or isSystem flag (case-insensitive)
  const inboxProject =
    projects.find((p) => String(p.name ?? '').toLowerCase() === 'inbox') ??
    projects.find((p) => Boolean((p as any).isSystem));

  // pick id/_id whichever is present
  const inboxId = inboxProject ? ((inboxProject as any)._id ?? (inboxProject as any).id) : undefined;

  return {
    projects,
    inboxId,
    isLoading,
    isError,
    error,
    raw: data,
  };
}
