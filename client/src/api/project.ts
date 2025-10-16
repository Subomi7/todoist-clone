// src/api/project.ts
import type { Project } from '@/types/project';

export type ApiResponse<T = unknown> = {
  ok: boolean;
  status: number;
  data?: T | undefined;
  message?: string;
};

type ProjectApiShape =
  | { data: Project[]; meta?: unknown }
  | { Data: Project[]; Meta?: unknown }
  | { projects: Project[] }
  | Project[]
  | { message?: string; error?: string };

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api';

// src/api/project.ts
export async function createProject(payload: {
  name: string;
  description?: string;
  isSystem?: boolean;
}): Promise<ApiResponse<Project>> {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    return { ok: false, status: 401, message: 'Not authenticated' };
  }

  try {
    const res = await fetch(`${BASE}/projects`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => null);
    return {
      ok: res.ok,
      status: res.status,
      data: json?.data ?? json,
      message: json?.message ?? undefined,
    };
  } catch (err) {
    return { ok: false, status: 0, message: 'Network error' };
  }
}

export async function getProjects(): Promise<ApiResponse<Project[]>> {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    return { ok: false, status: 401, message: 'Not authenticated' };
  }

  try {
    const res = await fetch(`${BASE}/projects`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      // credentials: "include", // enable if you rely on cookies
    });

    const json = await res.json().catch(() => null);

    // Normalize possible server shapes:
    // - { data: [projects], meta: ... }
    // - { Data: [projects], Meta: ... }
    // - [projects]
    let projects: Project[] | undefined;

    if (json) {
      const parsed = json as ProjectApiShape;
      if (Array.isArray((parsed as any).data)) {
        projects = (parsed as { data: Project[] }).data;
      } else if (Array.isArray((parsed as any).Data)) {
        projects = (parsed as { Data: Project[] }).Data;
      } else if (Array.isArray(parsed as Project[])) {
        projects = parsed as Project[];
      } else if (Array.isArray((parsed as any).projects)) {
        projects = (parsed as { projects: Project[] }).projects;
      }
    }

    const message =
      (json && ((json as any).message || (json as any).error)) ?? undefined;

    return {
      ok: res.ok,
      status: res.status,
      data: projects,
      message,
    };
  } catch (err) {
    return { ok: false, status: 0, message: 'Network error' };
  }
}

export async function deleteProject(id: string): Promise<ApiResponse> {
  const token = localStorage.getItem('auth_token');
  if (!token) return { ok: false, status: 401, message: 'Not authenticated' };

  try {
    const res = await fetch(`${BASE}/projects/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, message: json.message ?? 'Done' };
  } catch {
    return { ok: false, status: 0, message: 'Network error' };
  }
}
