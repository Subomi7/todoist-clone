// src/hooks/useInboxProjectId.ts
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProjects } from "@/api/project";
import { getTasks } from "@/api/task";
import type { Project } from "@/types/project";
import type { Task } from "@/types/task";

/**
 * Returns an object with:
 *  - inboxId: string | undefined
 *  - projects: Project[]
 *  - isLoading, isError, error
 *  - rawProjects, rawTasks (raw API responses) for debugging
 *
 * Fallback behaviour:
 *  - if projects list contains an Inbox (by name) or isSystem project — use it
 *  - else if projects empty, derive the most common projectId from tasks (non-completed)
 */
export function useInboxProjectId() {
  const {
    data: projectsResp,
    isLoading: projectsLoading,
    isError: projectsError,
    error: projectsFetchError,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: () => getProjects(),
  });

  const {
    data: tasksResp,
    isLoading: tasksLoading,
    isError: tasksError,
    error: tasksFetchError,
  } = useQuery({
    queryKey: ["tasks", undefined, false],
    queryFn: () => getTasks(undefined, false),
  });

  // Normalize projects array once (memoized)
  const projects = useMemo<Project[]>(() => {
    return (projectsResp?.data ?? []) as Project[];
  }, [projectsResp]);

  // Normalize tasks array once (memoized)
  const tasks = useMemo<Task[]>(() => {
    // getTasks returns { tasks, meta } shape in our client
    return (tasksResp?.tasks ?? []) as Task[];
  }, [tasksResp]);

  // Compute inboxId using the stable memoized `projects` and `tasks`
  const inboxId = useMemo<string | undefined>(() => {
    // Prefer explicit Inbox from projects (by name or isSystem flag)
    if (projects && projects.length > 0) {
      const byName = projects.find((p) => String(p.name ?? "").toLowerCase() === "inbox");
      const bySystem = projects.find((p: any) => Boolean((p as any).isSystem));
      const chosen = byName ?? bySystem;
      if (chosen) {
        return (chosen as any)._id ?? (chosen as any).id ?? undefined;
      }
    }

    // Fallback: derive most-common projectId from the user's tasks (ignore null)
    if (tasks && tasks.length > 0) {
      const freq: Record<string, number> = {};
      for (const t of tasks) {
        if (t.projectId) {
          freq[t.projectId] = (freq[t.projectId] || 0) + 1;
        }
      }
      const entries = Object.entries(freq);
      if (entries.length > 0) {
        entries.sort((a, b) => b[1] - a[1]);
        return entries[0][0];
      }

      // If there are tasks with a null/empty project, we could optionally return undefined
      // so UI can treat them as "no project" group. For now, return undefined.
    }

    return undefined;
  }, [projects, tasks]);

  return {
    inboxId,
    projects,
    isLoading: projectsLoading || tasksLoading,
    isError: projectsError || tasksError,
    error: projectsFetchError ?? tasksFetchError,
    rawProjects: projectsResp,
    rawTasks: tasksResp,
  };
}
