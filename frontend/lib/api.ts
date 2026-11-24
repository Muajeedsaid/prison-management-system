import { User } from './types';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

const KEYS = { access: 'pms.access', refresh: 'pms.refresh', user: 'pms.user' };

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/**
 * Token storage. NOTE FOR PRODUCTION: localStorage is simple and fine for a coursework system,
 * but a real deployment should keep tokens in httpOnly cookies so scripts cannot read them.
 */
export const session = {
  get access() {
    return typeof window === 'undefined' ? null : localStorage.getItem(KEYS.access);
  },
  get refresh() {
    return typeof window === 'undefined' ? null : localStorage.getItem(KEYS.refresh);
  },
  get user(): User | null {
    if (typeof window === 'undefined') return null;
    try {
      return JSON.parse(localStorage.getItem(KEYS.user) ?? 'null');
    } catch {
      return null;
    }
  },
  save(access: string, refresh: string, user: User) {
    localStorage.setItem(KEYS.access, access);
    localStorage.setItem(KEYS.refresh, refresh);
    localStorage.setItem(KEYS.user, JSON.stringify(user));
  },
  clear() {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  },
};

async function refreshTokens(): Promise<boolean> {
  const refreshToken = session.refresh;
  if (!refreshToken) return false;
  const res = await fetch(`${BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) return false;
  const data = await res.json();
  session.save(data.accessToken, data.refreshToken, data.user);
  return true;
}

async function request<T>(method: string, path: string, body?: unknown, retry = true): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (session.access) headers.Authorization = `Bearer ${session.access}`;

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check that the API is running.');
  }

  // Access token expired: get a new one with the refresh token, then repeat the request once.
  if (res.status === 401 && retry && path !== '/auth/login' && (await refreshTokens())) {
    return request<T>(method, path, body, false);
  }
  if (res.status === 401 && path !== '/auth/login') {
    session.clear();
    if (typeof window !== 'undefined') window.location.href = '/login';
  }
  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = Array.isArray(data?.message) ? data.message.join('. ') : (data?.message ?? 'Request failed');
    throw new ApiError(res.status, message);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body ?? {}),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  del: <T>(path: string) => request<T>('DELETE', path),
};

/** Build "?a=1&b=2" and skip empty values. */
export function qs(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
}
