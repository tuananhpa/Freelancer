/**
 * Cấu hình lớp dữ liệu. Giao diện KHÔNG gọi fetch/IndexedDB trực tiếp, chỉ gọi api.js.
 *  mode 'mock' : dữ liệu khởi tạo từ data/seed.json, thay đổi lưu trong IndexedDB của trình duyệt (chỉ máy đó thấy)
 *  mode 'live' : gọi REST API thật ở apiBase (hợp đồng trong PLAN.md)
 */
export const CONFIG = {
  mode: 'mock',
  apiBase: '/api',
  seedUrl: 'data/seed.json',
  storeKey: 'xaydung-abc-v2',                     // đổi khi đổi cấu trúc seed
  mockAdmin: { username: 'admin', password: 'demo2026' }, // CHỈ cho mock; backend thật phải thay bằng xác thực thật
  uploadMaxWidth: 1600,                           // nén ảnh phía trình duyệt trước khi lưu/gửi
  inbox: ['leads', 'applications'],               // dữ liệu khách gửi lên: không qua bước nháp/xuất bản
};
