import { http } from '@/services/http/client';

export const productService = {
  listPublished: () => http.get('/products'),
  getBySlug: (slug) => http.get(`/products/${encodeURIComponent(slug)}`),
  trackView: (slug, source = 'direct') => http.post(`/products/${encodeURIComponent(slug)}/views`, { source }),
  resolveQr: (code) => http.get(`/qr/${encodeURIComponent(code)}`),
};
