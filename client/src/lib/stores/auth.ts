import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

const stored = browser ? localStorage.getItem('auth_user') : null;
const initial: AuthUser | null = stored
  ? (JSON.parse(stored) as AuthUser)
  : null;

const { subscribe, set } = writable<AuthUser | null>(initial);

export const authUser = {
  subscribe,
  login(user: AuthUser, token: string) {
    if (browser) {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));
    }
    set(user);
  },
  logout() {
    if (browser) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
    set(null);
  },
};

export function getToken(): string | null {
  return browser ? (localStorage.getItem('auth_token') ?? null) : null;
}
