import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    // Unwrap ApiResponse<T> transparently so frontend components don't break
    if (response.data && response.data.status === 200 && 'data' in response.data) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const isLoginUrl = error.config?.url?.includes('/auth/login');
    const isOnLoginPage = window.location.pathname === '/login';

    if (status === 401 && !isLoginUrl) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login?expired=true';
      // Do NOT dispatch toast — the redirect itself is the feedback
      return Promise.reject(error);
    }

    // "Da tham gia khoa hoc roi" (400 tren enroll) khong phai loi that - CourseDetail
    // tu xu ly bang cach dieu huong thang vao hoc, khong can toast nao ca. Neu khong
    // chan o day, interceptor toan cuc nay se tu bat va hien toast du component da
    // nuot loi, gay hien tuong 2 toast chong nhau tren cung 1 hanh dong.
    const isEnrollAlreadyJoined = status === 400 && /\/courses\/.+\/enroll$/.test(error.config?.url || '');

    // Dispatch global api-error toast ONLY if not on login page
    // (login page handles its own errors inline)
    if (!isOnLoginPage && !isEnrollAlreadyJoined && error.response?.data?.errorCode) {
      const { message } = error.response.data;
      // Skip internal Hibernate / entity-missing noise (e.g. deleted exam questions)
      const msg = typeof message === 'string' ? message : '';
      if (/Unable to find |EntityNotFound|was deleted/i.test(msg)) {
        console.warn('Suppressed api-error toast:', msg);
        return Promise.reject(error);
      }
      window.dispatchEvent(new CustomEvent('api-error', { detail: message }));
    }

    return Promise.reject(error);
  }
);

export function getApiErrorMessage(error: any, fallback: string = 'Đã có lỗi xảy ra'): string {
  if (!axios.isAxiosError(error)) return fallback;
  if (!error.response) {
    return 'Không kết nối được server. Hãy kiểm tra backend đang chạy (port 8080) và thử lại.';
  }
  return error.response.data?.message || fallback;
}

export interface PageResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalPages: number;
  totalElements: number;
  last: boolean;
  size: number;
  number: number;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

export const uploadFile = async (file: File): Promise<{fileUrl: string, fileName: string}> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/v1/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data; // Already unwrapped by interceptor
};

export default api;
