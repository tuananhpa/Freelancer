import { uid } from './db';
import { now, notFound, badRequest, summary, slugify, randomCode } from './helpers';

function analytics(db, query) {
  const days = Number(query?.days || 30);
  const since = Date.now() - days * 86400000;
  const scans = db.scans.filter((s) => Date.parse(s.at) >= since && (!query?.productId || s.productId === query.productId));
  const byDay = {};
  for (let d = days - 1; d >= 0; d -= 1) byDay[new Date(Date.now() - d * 86400000).toISOString().slice(0, 10)] = 0;
  const byProduct = {};
  const byLocation = {};
  const byHour = Array(24).fill(0);
  scans.forEach((s) => {
    const day = s.at.slice(0, 10);
    if (day in byDay) byDay[day] += 1;
    byProduct[s.productId] = (byProduct[s.productId] || 0) + 1;
    byLocation[s.location] = (byLocation[s.location] || 0) + 1;
    byHour[new Date(s.at).getHours()] += 1;
  });
  const nameOf = (id) => db.products.find((p) => p.id === id)?.name || id;
  return {
    totalScans: scans.length,
    qrScans: scans.filter((s) => s.source === 'qr').length,
    orders: db.orders.filter((o) => Date.parse(o.createdAt) >= since).length,
    pendingReviews: db.reviews.filter((r) => r.status === 'pending').length,
    unreadMessages: db.chatThreads.reduce((n, t) => n + (t.unread || 0), 0),
    byDay: Object.entries(byDay).map(([date, count]) => ({ date, count })),
    byProduct: Object.entries(byProduct).map(([productId, count]) => ({ productId, name: nameOf(productId), count })).sort((a, b) => b.count - a.count),
    byLocation: Object.entries(byLocation).map(([location, count]) => ({ location, count })).sort((a, b) => b.count - a.count),
    byHour,
    recent: scans.slice(-10).reverse().map((s) => ({ ...s, productName: nameOf(s.productId) })),
  };
}

export const adminRoutes = [
  ['GET', '/admin/products', ({ db }) => db.products.map(summary)],
  ['GET', '/admin/products/:id', ({ db, params }) => db.products.find((p) => p.id === params.id) || notFound()],
  ['POST', '/admin/products', ({ db, body }) => {
    if (!body?.name?.trim()) badRequest('Tên sản phẩm là bắt buộc');
    const slug = slugify(body.slug?.trim() || body.name);
    if (db.products.some((p) => p.slug === slug)) badRequest('Đường dẫn (slug) đã tồn tại');
    const product = { ...body, id: uid('p'), slug, qrCode: randomCode(), qr: body.qr || { color: '#17110D', withLogo: true }, updatedAt: now() };
    db.products.push(product);
    return product;
  }],
  ['PUT', '/admin/products/:id', ({ db, params, body }) => {
    const i = db.products.findIndex((p) => p.id === params.id);
    if (i < 0) notFound();
    const slug = slugify(body.slug || db.products[i].slug);
    if (db.products.some((p) => p.slug === slug && p.id !== params.id)) badRequest('Đường dẫn (slug) đã tồn tại');
    // qrCode giữ nguyên khi sửa => tem QR đã in vẫn dùng được (Dynamic QR)
    db.products[i] = { ...db.products[i], ...body, id: params.id, slug, qrCode: db.products[i].qrCode, updatedAt: now() };
    return db.products[i];
  }],
  ['DELETE', '/admin/products/:id', ({ db, params }) => {
    db.products = db.products.filter((p) => p.id !== params.id);
    return null;
  }],
  ['PUT', '/admin/products/:id/qr', ({ db, params, body }) => {
    const p = db.products.find((x) => x.id === params.id) || notFound();
    p.qr = { ...p.qr, ...body };
    p.updatedAt = now();
    return p;
  }],
  ['GET', '/admin/analytics/summary', ({ db, query }) => analytics(db, query)],
  ['GET', '/admin/orders', ({ db }) => [...db.orders].reverse()],
  ['PATCH', '/admin/orders/:id', ({ db, params, body }) => {
    const o = db.orders.find((x) => x.id === params.id) || notFound();
    o.status = body.status;
    return o;
  }],
  ['GET', '/admin/reviews', ({ db }) => [...db.reviews].reverse()],
  ['PATCH', '/admin/reviews/:id', ({ db, params, body }) => {
    const r = db.reviews.find((x) => x.id === params.id) || notFound();
    r.status = body.status;
    return r;
  }],
  ['GET', '/admin/leads', ({ db }) => [...db.leads].reverse()],
  ['GET', '/admin/chat/threads', ({ db }) => [...db.chatThreads]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map(({ messages, ...t }) => ({ ...t, lastMessage: messages[messages.length - 1] }))],
  ['GET', '/admin/chat/threads/:id', ({ db, params }) => {
    const th = db.chatThreads.find((t) => t.id === params.id) || notFound();
    th.unread = 0;
    return th;
  }],
  ['POST', '/admin/chat/threads/:id/messages', ({ db, params, body }) => {
    const th = db.chatThreads.find((t) => t.id === params.id) || notFound();
    const text = String(body?.text || '').trim();
    if (!text) badRequest('Tin nhắn trống');
    th.messages.push({ id: uid('m'), from: 'admin', text, at: now() });
    th.updatedAt = now();
    return th;
  }],
];
