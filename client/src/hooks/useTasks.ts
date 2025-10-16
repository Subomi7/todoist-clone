// src/hooks/useTasks.ts
import { useQuery } from '@tanstack/react-query';
import { getTasks } from '@/api/task';
import type { Task } from '@/types/task';

export function useTasks(
  projectId?: string,
  completed?: boolean,
  inboxOnly: boolean = false
) {
  return useQuery<Task[]>({
    // stable key; use null for missing values so keys match invalidations
    queryKey: [
      'tasks',
      projectId ?? null,
      completed ?? null,
      inboxOnly ?? null,
    ],
    queryFn: async () => {
      const res = await getTasks(projectId, completed, inboxOnly);
      // getTasks returns { tasks, meta }
      return (res.tasks ?? []) as Task[];
    },
    staleTime: 5_000, // optional: small optimization
  });
}

// import { useQuery } from '@tanstack/react-query';
// import { getTasks } from '@/api/task';
// import type { Task } from '@/types/task';

// export function useTasks(projectId?: string | null, completed?: boolean) {
//   const key = ['tasks', projectId ?? null, completed ?? null];
//   return useQuery({
//     queryKey: key,
//     queryFn: async () => {
//       const res = await getTasks(projectId ?? , completed);
//       return (res.tasks ?? []) as Task[];
//     },
//     enabled: true
//     // enabled: you can add condition if needed
//   });
// }
