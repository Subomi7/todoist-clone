// src/api/auth.ts
export interface AuthResult {
  ok: boolean;
  status: number;
  data?: unknown;
  message?: string;
  errors?: unknown;
  token?: string;
}

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/';

async function handleResponse(res: Response): Promise<AuthResult> {
  const result: AuthResult = { ok: res.ok, status: res.status };

  try {
    const json = await res.json();
    result.data = json;

    // Normalize token locations into result.token
    if (json && typeof json === 'object') {
      const j = json as Record<string, unknown>;

      // top-level token fields
      if (typeof j['token'] === 'string' && j['token'].length) {
        result.token = j['token'] as string;
      } else if (
        typeof j['access_token'] === 'string' &&
        j['access_token'].length
      ) {
        result.token = j['access_token'] as string;
      } else if (
        typeof j['accessToken'] === 'string' &&
        j['accessToken'].length
      ) {
        result.token = j['accessToken'] as string;
      } else if (
        typeof j['AccessToken'] === 'string' &&
        j['AccessToken'].length
      ) {
        result.token = j['AccessToken'] as string;
      }

      // nested shapes: { data: { token: "..." } } or { data: { access_token: "..." } }
      const nested = j['data'];
      if (!result.token && nested && typeof nested === 'object') {
        const n = nested as Record<string, unknown>;
        if (typeof n['token'] === 'string' && n['token'].length)
          result.token = n['token'] as string;
        else if (
          typeof n['access_token'] === 'string' &&
          n['access_token'].length
        )
          result.token = n['access_token'] as string;
        else if (
          typeof n['accessToken'] === 'string' &&
          n['accessToken'].length
        )
          result.token = n['accessToken'] as string;
      }

      // message / errors normalization
      if (typeof j['message'] === 'string')
        result.message = j['message'] as string;
      if (typeof j['errors'] !== 'undefined') result.errors = j['errors'];
      // some handlers return `error` instead of message
      if (!result.message && typeof j['error'] === 'string')
        result.message = j['error'] as string;
    }
  } catch (err) {
    // Non-JSON response or parse error
    result.message = 'Invalid server response';
  }

  return result;
}

export async function loginApi(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    return await handleResponse(res);
  } catch (err: unknown) {
    if (err instanceof Error) {
      return { ok: false, status: 0, message: err.message || 'Network error' };
    }
    return { ok: false, status: 0, message: 'Unknown error' };
  }
}

export async function registerApi(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    const res = await fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    return await handleResponse(res);
  } catch (err: unknown) {
    if (err instanceof Error) {
      return { ok: false, status: 0, message: err.message || 'Network error' };
    }
    return { ok: false, status: 0, message: 'Unknown error' };
  }
}

// // src/api/auth.ts
// export interface AuthResult {
//   ok: boolean;
//   status: number;
//   data?: unknown;
//   message?: string;
//   errors?: unknown;
//   token?: string;
// }

// const BASE = "http://127.0.0.1:8080/api/auth";

// async function handleResponse(res: Response): Promise<AuthResult> {
//   const result: AuthResult = { ok: res.ok, status: res.status };
//   try {
//     const json = await res.json();
//     result.data = json;
//     // existing shapes
//     // the backend might return token in different fields:
//     // - token
//     // - access_token (snake_case)
//     // - accessToken / AccessToken (camel / Pascal)
//     if (json && typeof json === 'object') {
//       // try common token locations
//       // eslint-disable-next-line @typescript-eslint/no-explicit-any
//       const j: any = json;
//       if (j.token) result.token = j.token;
//       else if (j.access_token) result.token = j.access_token;
//       else if (j.accessToken) result.token = j.accessToken;
//       else if (j.AccessToken) result.token = j.AccessToken;
//       // keep message/errors detection for convenience
//       if (j.message) result.message = j.message;
//       if (j.errors) result.errors = j.errors;
//     }
//   } catch {
//     result.message = "Invalid server response";
//   }
//   return result;
// }

// export async function loginApi(email: string, password: string): Promise<AuthResult> {
//   try {
//     const res = await fetch(`${BASE}/login`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       credentials: "include", // include if your server sets cookies; remove if not needed
//       body: JSON.stringify({ email, password }),
//     });
//     return await handleResponse(res);
//   } catch (err: unknown) {
//     if (err instanceof Error) {
//       return { ok: false, status: 0, message: err.message || "Network error" };
//     }
//     return { ok: false, status: 0, message: "Unknown error" };
//   }
// }

// export async function registerApi(email: string, password: string): Promise<AuthResult> {
//   try {
//     const res = await fetch(`${BASE}/register`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       credentials: "include",
//       body: JSON.stringify({ email, password }),
//     });
//     return await handleResponse(res);
//   } catch (err: unknown) {
//     return { ok: false, status: 0, message: (err as Error).message || "Network error" };
//   }
// }
