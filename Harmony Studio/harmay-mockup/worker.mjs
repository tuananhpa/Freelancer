async function cloudinarySignature(params, secret) {
  const str = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join('&') + secret;
  const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      return Response.json({
        status: 'ok',
        brand: 'HARMONY.STUDIO',
        cloudinary: env.CLOUDINARY_CLOUD_NAME || 'dlw6jmsyf'
      });
    }

    if (url.pathname === '/api/media/upload' && request.method === 'POST') {
      try {
        const form = await request.formData();
        const file = form.get('file');
        if (!file || typeof file === 'string') {
          return Response.json({ error: 'Vui lòng chọn tệp để tải lên.' }, { status: 400 });
        }
        const cloud = env.CLOUDINARY_CLOUD_NAME || 'dlw6jmsyf';
        const key = env.CLOUDINARY_API_KEY;
        const secret = env.CLOUDINARY_API_SECRET;
        if (!cloud || !key || !secret) {
          return Response.json({ error: 'Chưa cấu hình Cloudinary.' }, { status: 500 });
        }
        const folder = 'harmony-studio/uploads';
        const timestamp = String(Math.floor(Date.now() / 1000));
        const params = { folder, timestamp };
        const signature = await cloudinarySignature(params, secret);

        const fd = new FormData();
        fd.append('file', file);
        fd.append('folder', folder);
        fd.append('timestamp', timestamp);
        fd.append('api_key', key);
        fd.append('signature', signature);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloud)}/auto/upload`, {
          method: 'POST',
          body: fd
        });
        const data = await res.json();
        if (!res.ok || !data.secure_url) {
          return Response.json({ error: data?.error?.message || 'Upload thất bại' }, { status: 400 });
        }
        return Response.json({ url: data.secure_url, public_id: data.public_id, resource_type: data.resource_type });
      } catch (err) {
        return Response.json({ error: err instanceof Error ? err.message : 'Lỗi máy chủ' }, { status: 500 });
      }
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }
    return new Response('Not found', { status: 404 });
  }
};
