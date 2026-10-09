import { http } from '@/services/http/client';

/** Mọi endpoint /admin/* tự gắn Bearer token (xem http/client.js). */
export const adminService = {
  // Sản phẩm / lô hàng (Dynamic CMS)
  listProducts: () => http.get('/admin/products'),
  getProduct: (id) => http.get(`/admin/products/${id}`),
  createProduct: (data) => http.post('/admin/products', data),
  updateProduct: (id, data) => http.put(`/admin/products/${id}`, data),
  deleteProduct: (id) => http.delete(`/admin/products/${id}`),

  // QR động
  updateQr: (id, qr) => http.put(`/admin/products/${id}/qr`, qr),

  // Thống kê
  analytics: (params) => http.get('/admin/analytics/summary', { query: params }),

  // Đơn hàng, đánh giá, khách hàng B2B
  listOrders: () => http.get('/admin/orders'),
  updateOrder: (id, data) => http.patch(`/admin/orders/${id}`, data),
  listReviews: () => http.get('/admin/reviews'),
  updateReview: (id, data) => http.patch(`/admin/reviews/${id}`, data),
  listLeads: () => http.get('/admin/leads'),

  // Hộp thư chat
  listThreads: () => http.get('/admin/chat/threads'),
  getThread: (id) => http.get(`/admin/chat/threads/${id}`),
  reply: (id, text) => http.post(`/admin/chat/threads/${id}/messages`, { text }),
};
