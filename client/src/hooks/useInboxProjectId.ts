// src/hooks/useInboxProjectId.ts
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProjects } from '@/api/project';
import { getTasks } from '@/api/task';
import type { Project } from '@/types/project';
import type { Task } from '@/types/task';

/**
 * Returns:
 *  - inboxId: string | undefined
 *  - projects: Project[]
 *  - isLoading, isError, error
 *  - rawProjects, rawInboxTasks (debug)
 *
 * Flow:
 *  - Prefer explicit Inbox project (by name or system flag).
 *  - If missing, fallback to derive inboxId from tasks fetched via ?inbox=true.
 */
export function useInboxProjectId() {
  const {
    data: projectsResp,
    isLoading: projectsLoading,
    isError: projectsError,
    error: projectsFetchError,
  } = useQuery({
    queryKey: ['projects'],
    queryFn: () => getProjects(),
  });

  // Fetch only inbox tasks (leverages backend inbox=true filter)
  const {
    data: inboxTasksResp,
    isLoading: inboxLoading,
    isError: inboxError,
    error: inboxFetchError,
  } = useQuery({
    queryKey: ['tasks', null, null, true],
    queryFn: () =>
      getTasks(undefined, undefined /* completed */, true /* inboxOnly */),
  });

  // Normalize projects
  const projects = useMemo<Project[]>(() => {
    return (projectsResp?.data ?? []) as Project[];
  }, [projectsResp]);

  // Normalize inbox tasks
  const inboxTasks = useMemo<Task[]>(() => {
    return (inboxTasksResp?.tasks ?? []) as Task[];
  }, [inboxTasksResp]);

  // Compute inboxId
  const inboxId = useMemo<string | undefined>(() => {
    // Prefer explicit Inbox project
    if (projects && projects.length > 0) {
      const byName = projects.find(
        (p) => String(p.name ?? '').toLowerCase() === 'inbox'
      );
      const bySystem = projects.find((p: any) => Boolean((p as any).isSystem));
      const chosen = byName ?? bySystem;
      if (chosen) {
        return (chosen as any)._id ?? (chosen as any).id ?? undefined;
      }
    }

    // Fallback: derive from inbox tasks if present
    if (inboxTasks && inboxTasks.length > 0) {
      const freq: Record<string, number> = {};
      for (const t of inboxTasks) {
        if (t.projectId) {
          freq[t.projectId] = (freq[t.projectId] || 0) + 1;
        }
      }
      return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0];
    }

    return undefined;
  }, [projects, inboxTasks]);

  return {
    inboxId,
    projects,
    isLoading: projectsLoading || inboxLoading,
    isError: projectsError || inboxError,
    error: projectsFetchError ?? inboxFetchError,
    rawProjects: projectsResp,
    rawInboxTasks: inboxTasksResp,
  };
}
