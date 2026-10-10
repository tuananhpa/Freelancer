import { STORAGE_KEYS } from '@/config/constants';
import { createSeedDb } from './seed';

let cache = null;

export function loadDb() {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.mockDb);
    cache = raw ? JSON.parse(raw) : createSeedDb();
  } catch {
    cache = createSeedDb();
  }
  return cache;
}

export function saveDb() {
  try {
    localStorage.setItem(STORAGE_KEYS.mockDb, JSON.stringify(cache));
  } catch {
    /* hết dung lượng localStorage (ảnh base64 lớn) — bỏ qua ở chế độ mock */
  }
}

export function resetDb() {
  cache = createSeedDb();
  saveDb();
}

export const uid = (prefix = 'id') => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
