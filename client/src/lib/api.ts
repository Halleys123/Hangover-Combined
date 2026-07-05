import { authUser, getToken } from './stores/auth.js';
import { goto } from '$app/navigation';
import { browser } from '$app/environment';

const BASE = browser
  ? (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api')
  : 'http://localhost:3000/api';

async function handle401() {
  authUser.logout();
  await goto('/login');
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string>),
  };

  if (!(init.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...init, headers });

  if (res.status === 401) {
    await handle401();
    throw new Error('Session expired. Please log in again.');
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Request failed');
  return data as T;
}

async function requestBlob(path: string, init: RequestInit = {}): Promise<Blob> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...init, headers });

  if (res.status === 401) {
    await handle401();
    throw new Error('Session expired. Please log in again.');
  }

  if (!res.ok) throw new Error('Failed to fetch file');
  return res.blob();
}

export const api = {
  get: <T>(path: string, options?: RequestInit) => request<T>(path, options),
  post: <T>(path: string, body?: unknown, options?: RequestInit) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body), ...options }),
  put: <T>(path: string, body?: unknown, options?: RequestInit) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body), ...options }),
  patch: <T>(path: string, body?: unknown, options?: RequestInit) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body), ...options }),
  delete: <T>(path: string, options?: RequestInit) =>
    request<T>(path, { method: 'DELETE', ...options }),
  upload: <T>(path: string, form: FormData, options?: RequestInit) =>
    request<T>(path, { method: 'POST', body: form, ...options }),
  blob: (path: string, options?: RequestInit) => requestBlob(path, options),
};
