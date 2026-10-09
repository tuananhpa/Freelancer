// Toàn bộ cấu hình đọc từ biến môi trường Vite (.env)
export const env = {
  useMock: String(import.meta.env.VITE_USE_MOCK ?? 'true') === 'true',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  publicSiteUrl: (import.meta.env.VITE_PUBLIC_SITE_URL || window.location.origin).replace(/\/$/, ''),
  defaultZalo: import.meta.env.VITE_DEFAULT_ZALO || 'https://zalo.me/',
};
