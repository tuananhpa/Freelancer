import { ApiError } from '@/services/http/ApiError';
import { uid } from './db';

export const now = () => new Date().toISOString();
export const notFound = (what = 'Không tìm thấy dữ liệu') => { throw new ApiError(what, 404); };
export const badRequest = (msg) => { throw new ApiError(msg, 400); };

export const summary = (p) => ({
  id: p.id, slug: p.slug, qrCode: p.qrCode, name: p.name, tagline: p.tagline, category: p.category,
  coverUrl: p.coverUrl, certifications: p.certifications, status: p.status,
  duration: p.hero?.duration, heroLoopUrl: p.hero?.loopUrl, posterUrl: p.hero?.posterUrl, batchCode: p.batchCode, updatedAt: p.updatedAt,
});

export const slugify = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const randomCode = () => Math.random().toString(36).slice(2, 9).toUpperCase();

export function findProductBySlug(db, slug) {
  return db.products.find((p) => p.slug === slug) || notFound('Không tìm thấy sản phẩm');
}

export function recordScan(db, product, source) {
  db.scans.push({
    id: uid('scan'), productId: product.id, source, at: now(),
    // Backend thật lấy vị trí theo IP; mock dùng múi giờ trình duyệt
    location: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Không rõ',
    device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
  });
}

export function botReply(product, text) {
  const t = text.toLowerCase();
  const hit = (product?.faqs || []).find((f) => f.question.toLowerCase().split(/\s+/)
    .filter((w) => w.length > 2).some((w) => t.includes(w)));
  if (hit) return hit.answer;
  if (/giá|bao nhiêu/.test(t)) return 'Nhà vườn sẽ báo giá theo lô và quy cách. Bạn để lại số điện thoại nhé!';
  if (/zalo|liên hệ|số điện thoại/.test(t)) return 'Bạn có thể bấm nút Nhắn Zalo trực tiếp nhà vườn ngay trên trang này.';
  return 'Cảm ơn bạn! Tin nhắn đã được chuyển tới nhà vườn, chúng tôi sẽ phản hồi sớm.';
}
