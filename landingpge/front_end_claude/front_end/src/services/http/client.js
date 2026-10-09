/**
 * HTTP client dùng chung cho mọi service.
 *  - VITE_USE_MOCK=true  -> chuyển request sang mock adapter (localStorage)
 *  - VITE_USE_MOCK=false -> fetch tới VITE_API_BASE_URL, kèm Bearer token admin
 * Service chỉ gọi http.get/post/put/patch/delete với path REST, nên khi có backend
 * thật chỉ cần đổi biến môi trường, không phải sửa component.
 */
import { env } from '@/config/env';
import { ApiError } from './ApiError';
import { tokenStorage } from './tokenStorage';

let mockAdapterPromise = null;
const loadMock = () => {
  mockAdapterPromise ??= import('@/services/mock/adapter').then((m) => m.mockAdapter);
  return mockAdapterPromise;
};

const listeners = new Set();
/** Đăng ký callback khi API trả 401 (để AuthContext tự đăng xuất). */
export const onUnauthorized = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

function buildUrl(path, query) {
  const url = `${env.apiBaseUrl}${path}`;
  if (!query) return url;
  const qs = new URLSearchParams(
    Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  ).toString();
  return qs ? `${url}?${qs}` : url;
}

async function request(method, path, { body, query, auth = false } = {}) {
  const token = tokenStorage.get();

  if (env.useMock) {
    const adapter = await loadMock();
    try {
      return await adapter({ method, path, body, query, token });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) listeners.forEach((fn) => fn());
      throw err;
    }
  }

  const headers = { Accept: 'application/json' };
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json';
  if (token && (auth || path.startsWith('/admin'))) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Không kết nối được máy chủ. Vui lòng thử lại.', 0);
  }

  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401) listeners.forEach((fn) => fn());
    throw new ApiError(data?.message || `Lỗi ${res.status}`, res.status, data);
  }
  // Quy ước backend: { data: ... } hoặc trả thẳng object
  return data && Object.prototype.hasOwnProperty.call(data, 'data') ? data.data : data;
}

export const http = {
  get: (path, opts) => request('GET', path, opts),
  post: (path, body, opts) => request('POST', path, { ...opts, body }),
  put: (path, body, opts) => request('PUT', path, { ...opts, body }),
  patch: (path, body, opts) => request('PATCH', path, { ...opts, body }),
  delete: (path, opts) => request('DELETE', path, opts),
};
