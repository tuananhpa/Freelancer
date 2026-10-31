export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      return Response.json({
        status: 'ok',
        brand: 'BM Global Spirits',
        catalog: {
          products: 615,
          brands: 171,
          countries: 26,
        },
      });
    }

    if (url.pathname === '/api/inquiries' && request.method === 'POST') {
      try {
        const body = await request.json().catch(() => ({}));
        const name = String(body.name || '').trim();
        const phone = String(body.phone || '').trim();
        if (!name || !phone) {
          return Response.json(
            { ok: false, error: 'Vui lòng nhập tên và số điện thoại.' },
            { status: 400 }
          );
        }
        return Response.json({
          ok: true,
          id: 'BM-' + Date.now().toString(36).toUpperCase(),
          receivedAt: new Date().toISOString(),
          inquiry: {
            name,
            phone,
            email: String(body.email || '').trim(),
            who: String(body.who || 'ca-nhan').trim(),
            want: String(body.want || '').trim(),
            msg: String(body.msg || '').trim(),
            page: String(body.page || '').trim(),
          },
        });
      } catch (err) {
        return Response.json(
          { ok: false, error: 'Không thể xử lý yêu cầu lúc này.' },
          { status: 500 }
        );
      }
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not found', { status: 404 });
  },
};
