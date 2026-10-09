import { http } from '@/services/http/client';

/** Các hành động của khách — KHÔNG cần đăng nhập. */
export const engagementService = {
  listReviews: (slug) => http.get(`/products/${encodeURIComponent(slug)}/reviews`),
  createReview: (slug, payload) => http.post(`/products/${encodeURIComponent(slug)}/reviews`, payload),
  createOrder: (payload) => http.post('/orders', payload),
  createLead: (payload) => http.post('/leads', payload),
};
