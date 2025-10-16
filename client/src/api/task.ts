// src/api/task.ts
import type { TaskPayload, Task } from '@/types/task';

export type ApiResponse<T = unknown> = {
  ok: boolean;
  data?: T;
  message?: string;
  status?: number;
};

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/';

export async function createTask(
  payload: TaskPayload
): Promise<ApiResponse<{ task: Task }>> {
  const token = localStorage.getItem('auth_token');

  if (!token) {
    return { ok: false, message: 'Not authenticated. Please log in first.' };
  }

  const body = {
    ...payload,
    priority: payload.priority ?? 2,
  };

  try {
    const res = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        ok: false,
        message: json?.error ?? json?.message ?? 'Failed to create task',
      };
    }

    // assume backend returns created task under { data: <task> } OR { task: <task> }
    const returnedTask: Task | undefined =
      (json && (json.data ?? json.task)) ?? json;

    return { ok: true, data: { task: returnedTask as Task } };
  } catch (err) {
    console.error('createTask error:', err);
    return { ok: false, message: 'Network error. Please try again.' };
  }
}

// src/api/task.ts
export async function getTasks(
  projectId?: string,
  completed?: boolean,
  inboxOnly?: boolean
) {
  const token = localStorage.getItem('auth_token');
  if (!token) throw new Error('Not authenticated');

  const url = new URL(`${API_URL}/tasks`);

  // ✅ explicit logic — inbox beats projectId
  if (inboxOnly) {
    url.searchParams.set('inbox', 'true');
  } else if (projectId) {
    url.searchParams.set('projectId', projectId);
  }

  if (completed !== undefined) {
    url.searchParams.set('completed', String(completed));
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(json?.error ?? json?.message ?? 'Failed to fetch tasks');
  }

  // normalize backend 'id' => _id
  const items = (json?.data ?? []) as any[];
  const tasks = items.map((t) => ({
    ...t,
    _id: t.id ?? t._id,
    projectId: t.projectId === '000000000000000000000000' ? null : t.projectId,
  }));

  return {
    tasks,
    meta: json?.meta,
  };
}

export async function updateTask(
  id: string,
  patch: Partial<{
    title: string;
    description: string;
    completed: boolean;
    projectId: string; // <-- just string, no null
    priority?: number;
    dueDate?: string;
  }>
): Promise<ApiResponse<{ task: Task }>> {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    return { ok: false, message: 'Not authenticated', status: 401 };
  }

  try {
    const res = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(patch),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        ok: false,
        message: json?.error ?? json?.message ?? 'Failed to update task',
        status: res.status,
      };
    }

    const returned = json?.data ?? json;
    return {
      ok: true,
      data: { task: { ...returned, _id: returned.id ?? returned._id } },
    };
  } catch (err) {
    console.error('updateTask error:', err);
    return { ok: false, message: 'Network error', status: 0 };
  }
}

export async function deleteTask(id: string) {
  const token = localStorage.getItem('auth_token');
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${API_URL}/tasks/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error || 'Failed to delete task');
  }
  return true;
}
