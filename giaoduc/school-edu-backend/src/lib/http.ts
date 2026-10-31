import type { Context } from 'hono';
import type { AppEnv } from '../types';
import { javaNow } from './time';

/** Lỗi nghiệp vụ trả về client dạng Java ApiResponse { status, errorCode, message } */
export class ApiError extends Error {
  constructor(public status: number, public errorCode: string, message: string) { super(message); }
}
export const bad = (message: string, code = 'INVALID_INPUT') => new ApiError(400, code, message);
export const notFound = (message = 'Không tìm thấy tài nguyên yêu cầu.') => new ApiError(404, 'RESOURCE_NOT_FOUND', message);
export const forbidden = (message = 'Bạn không có quyền thực hiện hành động này.') => new ApiError(403, 'FORBIDDEN', message);
export const unauthorized = () => new ApiError(401, 'UNAUTHORIZED', 'Bạn chưa đăng nhập hoặc token đã hết hạn.');

export const errorBody = (status: number, errorCode: string, message: string) => ({ status, message, errorCode, timestamp: javaNow() });

/** ApiResponse.success(data) của Java */
export const ok = (c: Context<AppEnv>, data: unknown, message = 'Success') => c.json({ status: 200, message, data, timestamp: javaNow() });

/** Trả thẳng DTO như các controller Java dùng ResponseEntity<Dto> */
export const raw = (c: Context<AppEnv>, data: unknown, status = 200) => c.json(data as object, status as 200);

export function pageParams(c: Context<AppEnv>, defSize = 20, maxSize = 1000) {
  const page = Math.max(0, Number.parseInt(c.req.query('page') ?? '0', 10) || 0);
  const size = Math.min(maxSize, Math.max(1, Number.parseInt(c.req.query('size') ?? String(defSize), 10) || defSize));
  return { page, size, offset: page * size };
}

/** Page<T> kiểu Spring Data */
export function springPage<T>(content: T[], total: number, page: number, size: number) {
  const totalPages = size ? Math.ceil(total / size) : 0;
  return {
    content, totalElements: total, totalPages, number: page, size, numberOfElements: content.length,
    first: page === 0, last: page >= totalPages - 1, empty: content.length === 0,
    pageable: { pageNumber: page, pageSize: size, offset: page * size, paged: true, unpaged: false },
  };
}

/** Sắp xếp theo `sort=field,dir` nhưng chỉ cho cột trong allowlist (không bind được tên cột) */
export function orderBy(c: Context<AppEnv>, allowed: Record<string, string>, fallback: string) {
  const [field, dir] = (c.req.query('sort') || '').split(',');
  const col = allowed[field];
  return col ? `${col} ${dir?.toLowerCase() === 'asc' ? 'ASC' : 'DESC'}` : fallback;
}

export async function body<T = Record<string, any>>(c: Context<AppEnv>): Promise<T> {
  const text = await c.req.text();
  if (!text) return {} as T;
  if (text.length > 2_000_000) throw bad('Dữ liệu gửi lên quá lớn.');
  try {
    const v = JSON.parse(text);
    return (v ?? {}) as T;
  } catch {
    throw bad('Dữ liệu JSON không hợp lệ.');
  }
}

export const str = (v: unknown, field: string, max = 255, required = true): string | null => {
  if (v == null || v === '') { if (required) throw bad(`${field} không được để trống.`); return null; }
  const s = String(v).trim();
  if (required && !s) throw bad(`${field} không được để trống.`);
  if (s.length > max) throw bad(`${field} tối đa ${max} ký tự.`);
  return s;
};
export const num = (v: unknown, field: string, min = -Infinity, max = Infinity): number | null => {
  if (v == null || v === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < min || n > max) throw bad(`${field} không hợp lệ.`);
  return n;
};
export const oneOf = <T extends string>(v: unknown, field: string, allowed: readonly T[]): T => {
  if (!allowed.includes(v as T)) throw bad(`${field} không hợp lệ.`);
  return v as T;
};
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const USERNAME_RE = /^[A-Za-z0-9._-]{3,32}$/;
export const bool = (v: unknown) => (v ? 1 : 0);
export const uuid = () => crypto.randomUUID();
