import { ApiError } from '@/services/http/ApiError';
import { uid } from './db';
import { now, notFound, badRequest, summary, findProductBySlug, recordScan, botReply } from './helpers';

const MOCK_EMAIL = import.meta.env.VITE_MOCK_ADMIN_EMAIL || 'admin@hytales.vn';
const MOCK_PASSWORD = import.meta.env.VITE_MOCK_ADMIN_PASSWORD || 'hytale-demo';
export const MOCK_TOKEN = 'mock-admin-token';
const ADMIN_USER = { id: 'u-admin', email: MOCK_EMAIL, name: 'Quản trị HYTale', role: 'admin' };

export function requireAdmin(token) {
  if (token !== MOCK_TOKEN) throw new ApiError('Phiên đăng nhập đã hết hạn', 401);
}

/** [METHOD, pattern, handler({ db, params, body, query, token })] */
export const publicRoutes = [
  ['GET', '/products', ({ db }) => db.products.filter((p) => p.status === 'published').map(summary)],
  ['GET', '/products/:slug', ({ db, params }) => {
    const p = findProductBySlug(db, params.slug);
    if (p.status !== 'published') notFound('Sản phẩm chưa được công bố');
    return p;
  }],
  ['POST', '/products/:slug/views', ({ db, params, body }) => {
    recordScan(db, findProductBySlug(db, params.slug), body?.source || 'direct');
    return { ok: true };
  }],
  ['GET', '/qr/:code', ({ db, params }) => {
    const p = db.products.find((x) => x.qrCode === params.code) || notFound('Mã QR không hợp lệ');
    recordScan(db, p, 'qr');
    return { slug: p.qr?.targetSlug || p.slug };
  }],
  ['GET', '/products/:slug/reviews', ({ db, params }) => {
    const p = findProductBySlug(db, params.slug);
    return db.reviews.filter((r) => r.productId === p.id && r.status === 'approved')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }],
  ['POST', '/products/:slug/reviews', ({ db, params, body }) => {
    const p = findProductBySlug(db, params.slug);
    if (!body?.name?.trim()) badRequest('Vui lòng nhập tên');
    if (!(body.rating >= 1 && body.rating <= 5)) badRequest('Vui lòng chấm sao');
    const review = {
      id: uid('rv'), productId: p.id, productName: p.name, name: body.name.trim(), rating: body.rating,
      comment: body.comment?.trim() || '', photos: (body.photos || []).slice(0, 3), status: 'pending', createdAt: now(),
    };
    db.reviews.push(review);
    return review;
  }],
  ['POST', '/orders', ({ db, body }) => {
    if (!body?.name?.trim() || !body?.phone?.trim()) badRequest('Vui lòng nhập tên và số điện thoại');
    const p = findProductBySlug(db, body.productSlug);
    const order = { id: uid('od'), code: `HY${Date.now().toString().slice(-6)}`, productId: p.id, productName: p.name, ...body, status: 'new', createdAt: now() };
    db.orders.push(order);
    return { id: order.id, code: order.code };
  }],
  ['POST', '/leads', ({ db, body }) => {
    if (!body?.name?.trim() || !body?.phone?.trim()) badRequest('Vui lòng nhập tên và số điện thoại');
    const lead = { id: uid('ld'), ...body, createdAt: now() };
    db.leads.push(lead);
    return { id: lead.id };
  }],
  ['POST', '/chat/sessions', ({ db, body }) => {
    const p = body?.productSlug ? db.products.find((x) => x.slug === body.productSlug) : null;
    const greeting = p ? `Xin chào! Mình là trợ lý HYTale của ${p.name}. Bạn cần hỏi gì?` : 'Xin chào! Mình là trợ lý HYTale. Bạn cần hỏi gì?';
    const thread = {
      id: uid('ch'), productId: p?.id || null, productName: p?.name || 'Trang chủ', customerName: body?.name || 'Khách',
      unread: 0, updatedAt: now(), messages: [{ id: uid('m'), from: 'bot', text: greeting, at: now() }],
    };
    db.chatThreads.push(thread);
    return { sessionId: thread.id, messages: thread.messages, quickReplies: (p?.faqs || []).map((f) => f.question) };
  }],
  ['GET', '/chat/sessions/:id/messages', ({ db, params }) => {
    const th = db.chatThreads.find((t) => t.id === params.id) || notFound();
    return th.messages;
  }],
  ['POST', '/chat/sessions/:id/messages', ({ db, params, body }) => {
    const th = db.chatThreads.find((t) => t.id === params.id) || notFound();
    const text = String(body?.text || '').trim();
    if (!text) badRequest('Tin nhắn trống');
    const product = db.products.find((p) => p.id === th.productId);
    th.messages.push({ id: uid('m'), from: 'customer', text, at: now() });
    th.messages.push({ id: uid('m'), from: 'bot', text: botReply(product, text), at: now() });
    th.unread += 1;
    th.updatedAt = now();
    return th.messages;
  }],
  ['POST', '/auth/login', ({ body }) => {
    if (body?.email?.trim().toLowerCase() !== MOCK_EMAIL || body?.password !== MOCK_PASSWORD) {
      throw new ApiError('Email hoặc mật khẩu không đúng', 401);
    }
    return { token: MOCK_TOKEN, user: ADMIN_USER };
  }],
  ['GET', '/auth/me', ({ token }) => { requireAdmin(token); return ADMIN_USER; }],
  ['POST', '/auth/logout', () => ({ ok: true })],
];
