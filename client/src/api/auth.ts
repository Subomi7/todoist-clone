// src/api/auth.ts
export interface AuthResult {
  ok: boolean;
  status: number;
  data?: unknown;
  message?: string;
  errors?: unknown;
  token?: string;
}

const BASE = "http://127.0.0.1:8080/api/auth";

async function handleResponse(res: Response): Promise<AuthResult> {
  const result: AuthResult = { ok: res.ok, status: res.status };
  try {
    const json = await res.json();
    result.data = json;
    // common shapes
    if (json.token) result.token = json.token;
    if (json.message) result.message = json.message;
    if (json.errors) result.errors = json.errors;
  } catch {
    result.message = "Invalid server response";
  }
  return result;
}

export async function loginApi(email: string, password: string): Promise<AuthResult> {
  try {
    const res = await fetch(`${BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // include if your server sets cookies; remove if not needed
      body: JSON.stringify({ email, password }),
    });
    return await handleResponse(res);
  } catch (err: unknown) {
    if (err instanceof Error) {
      return { ok: false, status: 0, message: err.message || "Network error" };
    }
    return { ok: false, status: 0, message: "Unknown error" };
  }
}

export async function registerApi(email: string, password: string): Promise<AuthResult> {
  try {
    const res = await fetch(`${BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    return await handleResponse(res);
  } catch (err: unknown) {
    return { ok: false, status: 0, message: (err as Error).message || "Network error" };
  }
}
