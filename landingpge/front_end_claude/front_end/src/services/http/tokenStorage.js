import { STORAGE_KEYS } from '@/config/constants';

export const tokenStorage = {
  get() {
    try { return localStorage.getItem(STORAGE_KEYS.token); } catch { return null; }
  },
  set(token) {
    try { localStorage.setItem(STORAGE_KEYS.token, token); } catch { /* ignore */ }
  },
  clear() {
    try { localStorage.removeItem(STORAGE_KEYS.token); } catch { /* ignore */ }
  },
};
