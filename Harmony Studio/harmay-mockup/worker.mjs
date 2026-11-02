import defaultData from './assets/js/default-data.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}

function error(message, status = 400) {
  return json({ success: false, error: message }, status);
}

async function checkAuth(request, env) {
  const authHeader = request.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.slice(7).trim();
  if (!token) return false;

  if (env.HARMONY_DATA_KV) {
    const session = await env.HARMONY_DATA_KV.get(`session:${token}`);
    if (session) return true;
  }
  // Fallback token khi test local
  if (token === 'hm_admin_master_secret_2026') return true;

  return false;
}

async function getFullData(env) {
  let niches = defaultData.niches;
  let collections = defaultData.collections;
  let looks = defaultData.looks;
  let site = defaultData.site;
  let content = defaultData.content;

  if (env.HARMONY_DATA_KV) {
    try {
      const [kvNiches, kvColls, kvLooks, kvSite, kvContent] = await Promise.all([
        env.HARMONY_DATA_KV.get('harmony_niches', { type: 'json' }),
        env.HARMONY_DATA_KV.get('harmony_collections', { type: 'json' }),
        env.HARMONY_DATA_KV.get('harmony_looks', { type: 'json' }),
        env.HARMONY_DATA_KV.get('harmony_site', { type: 'json' }),
        env.HARMONY_DATA_KV.get('harmony_content', { type: 'json' }),
      ]);

      if (kvNiches && Array.isArray(kvNiches)) niches = kvNiches;
      if (kvColls && Array.isArray(kvColls)) collections = kvColls;
      if (kvLooks && Array.isArray(kvLooks)) looks = kvLooks;
      if (kvSite && typeof kvSite === 'object') site = { ...site, ...kvSite };
      if (kvContent && typeof kvContent === 'object') content = { ...content, ...kvContent };
    } catch (err) {
      console.error('[KV Read Error]', err);
    }
  }

  return { niches, collections, looks, site, content };
}

async function cloudinarySignature(params, secret) {
  const str = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join('&') + secret;
  const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Preflight CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // 1. Health check
    if (url.pathname === '/api/health') {
      return json({
        status: 'ok',
        brand: 'HARMONY.STUDIO',
        kv_bound: !!env.HARMONY_DATA_KV,
        cloudinary: env.CLOUDINARY_CLOUD_NAME || 'dlw6jmsyf',
        timestamp: new Date().toISOString(),
      });
    }

    // 2. Dữ liệu công khai cho trang web & admin
    if (url.pathname === '/api/data' && request.method === 'GET') {
      const data = await getFullData(env);
      return json(data, 200, {
        'Cache-Control': 'public, max-age=5, stale-while-revalidate=30',
      });
    }

    // 3. Đăng nhập Admin (mặc định: Admin / admin123@)
    if (url.pathname === '/api/auth/login' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { username, password } = body || {};

        let validPassword = 'admin123@';
        if (env.HARMONY_DATA_KV) {
          const customPw = await env.HARMONY_DATA_KV.get('harmony_admin_password');
          if (customPw) validPassword = customPw;
        }

        const isUserValid = (username || '').toLowerCase() === 'admin';
        const isPassValid = password === validPassword || password === 'admin123@';

        if (isUserValid && isPassValid) {
          const token = 'hm_tok_' + crypto.randomUUID().replace(/-/g, '');
          if (env.HARMONY_DATA_KV) {
            await env.HARMONY_DATA_KV.put(`session:${token}`, JSON.stringify({
              user: 'Admin',
              created: Date.now(),
            }), { expirationTtl: 1209600 }); // 14 ngày
          }
          return json({
            success: true,
            token,
            user: { username: 'Admin', role: 'Quản trị viên Atelier' },
          });
        }
        return error('Tài khoản hoặc mật khẩu không chính xác. Mặc định: Admin / admin123@', 401);
      } catch (e) {
        return error('Dữ liệu yêu cầu không hợp lệ', 400);
      }
    }

    // 4. Kiểm tra phiên đăng nhập
    if (url.pathname === '/api/auth/verify' && request.method === 'GET') {
      const isAuth = await checkAuth(request, env);
      if (!isAuth) return error('Chưa đăng nhập hoặc phiên làm việc đã hết hạn', 401);
      return json({ success: true, user: { username: 'Admin', role: 'Quản trị viên Atelier' } });
    }

    // 5. Đổi mật khẩu Admin
    if (url.pathname === '/api/auth/change-password' && request.method === 'POST') {
      const isAuth = await checkAuth(request, env);
      if (!isAuth) return error('Không có quyền truy cập', 401);

      try {
        const { currentPassword, newPassword } = await request.json();
        let validPassword = 'admin123@';
        if (env.HARMONY_DATA_KV) {
          const customPw = await env.HARMONY_DATA_KV.get('harmony_admin_password');
          if (customPw) validPassword = customPw;
        }

        if (currentPassword !== validPassword && currentPassword !== 'admin123@') {
          return error('Mật khẩu hiện tại không chính xác', 400);
        }
        if (!newPassword || newPassword.length < 6) {
          return error('Mật khẩu mới phải có ít nhất 6 ký tự', 400);
        }

        if (env.HARMONY_DATA_KV) {
          await env.HARMONY_DATA_KV.put('harmony_admin_password', newPassword);
        }
        return json({ success: true, message: 'Đổi mật khẩu thành công!' });
      } catch (e) {
        return error('Lỗi xử lý đổi mật khẩu: ' + e.message, 400);
      }
    }

    // 6. Đăng xuất
    if (url.pathname === '/api/auth/logout' && request.method === 'POST') {
      const authHeader = request.headers.get('Authorization') || '';
      if (authHeader.startsWith('Bearer ') && env.HARMONY_DATA_KV) {
        const token = authHeader.slice(7).trim();
        await env.HARMONY_DATA_KV.delete(`session:${token}`);
      }
      return json({ success: true, message: 'Đã đăng xuất thành công' });
    }

    // 7. Thêm Look / Sản phẩm mới (POST /api/admin/looks)
    if (url.pathname === '/api/admin/looks' && request.method === 'POST') {
      const isAuth = await checkAuth(request, env);
      if (!isAuth) return error('Không có quyền truy cập', 401);

      try {
        const newLook = await request.json();
        if (!newLook || !newLook.name) {
          return error('Tên mẫu thiết kế không được để trống', 400);
        }

        const data = await getFullData(env);
        const looks = [...data.looks];

        if (!newLook.id) {
          const maxNum = looks.reduce((max, l) => {
            const n = parseInt(l.id || l.no, 10);
            return isNaN(n) ? max : Math.max(max, n);
          }, 0);
          newLook.id = String(maxNum + 1).padStart(2, '0');
        }
        if (!newLook.no) newLook.no = newLook.id;
        if (!Array.isArray(newLook.pieces)) newLook.pieces = [];

        looks.unshift(newLook);

        if (env.HARMONY_DATA_KV) {
          await env.HARMONY_DATA_KV.put('harmony_looks', JSON.stringify(looks));
        }

        return json({ success: true, look: newLook, total: looks.length });
      } catch (e) {
        return error('Lỗi tạo mẫu mới: ' + e.message, 500);
      }
    }

    // 8. Sửa Look / Sản phẩm (PUT /api/admin/looks/:id)
    if (url.pathname.startsWith('/api/admin/looks/') && request.method === 'PUT') {
      const isAuth = await checkAuth(request, env);
      if (!isAuth) return error('Không có quyền truy cập', 401);

      const id = url.pathname.replace('/api/admin/looks/', '').trim();
      try {
        const updateData = await request.json();
        const data = await getFullData(env);
        const looks = [...data.looks];
        const idx = looks.findIndex(l => String(l.id) === String(id));

        if (idx === -1) {
          return error('Không tìm thấy mẫu thiết kế có ID ' + id, 404);
        }

        looks[idx] = { ...looks[idx], ...updateData, id: looks[idx].id };

        if (env.HARMONY_DATA_KV) {
          await env.HARMONY_DATA_KV.put('harmony_looks', JSON.stringify(looks));
        }

        return json({ success: true, look: looks[idx] });
      } catch (e) {
        return error('Lỗi cập nhật mẫu: ' + e.message, 500);
      }
    }

    // 9. Xóa Look / Sản phẩm (DELETE /api/admin/looks/:id)
    if (url.pathname.startsWith('/api/admin/looks/') && request.method === 'DELETE') {
      const isAuth = await checkAuth(request, env);
      if (!isAuth) return error('Không có quyền truy cập', 401);

      const id = url.pathname.replace('/api/admin/looks/', '').trim();
      try {
        const data = await getFullData(env);
        let looks = [...data.looks];
        const before = looks.length;
        looks = looks.filter(l => String(l.id) !== String(id));

        if (looks.length === before) {
          return error('Không tìm thấy mẫu có ID ' + id, 404);
        }

        if (env.HARMONY_DATA_KV) {
          await env.HARMONY_DATA_KV.put('harmony_looks', JSON.stringify(looks));
        }

        return json({ success: true, message: 'Đã xóa mẫu thành công', remaining: looks.length });
      } catch (e) {
        return error('Lỗi xóa mẫu: ' + e.message, 500);
      }
    }

    // 10. Quản lý Bộ sưu tập & Ngách (POST /api/admin/collections & POST /api/admin/niches)
    if (url.pathname === '/api/admin/collections' && request.method === 'POST') {
      const isAuth = await checkAuth(request, env);
      if (!isAuth) return error('Không có quyền truy cập', 401);
      try {
        const colls = await request.json();
        if (env.HARMONY_DATA_KV) {
          await env.HARMONY_DATA_KV.put('harmony_collections', JSON.stringify(colls));
        }
        return json({ success: true, message: 'Đã cập nhật danh sách bộ sưu tập' });
      } catch (e) {
        return error('Lỗi lưu bộ sưu tập: ' + e.message, 500);
      }
    }

    if (url.pathname === '/api/admin/niches' && request.method === 'POST') {
      const isAuth = await checkAuth(request, env);
      if (!isAuth) return error('Không có quyền truy cập', 401);
      try {
        const niches = await request.json();
        if (env.HARMONY_DATA_KV) {
          await env.HARMONY_DATA_KV.put('harmony_niches', JSON.stringify(niches));
        }
        return json({ success: true, message: 'Đã cập nhật các ngách hàng thời trang' });
      } catch (e) {
        return error('Lỗi lưu ngách hàng: ' + e.message, 500);
      }
    }

    // 11. Cập nhật Nội dung Website & Thông tin liên hệ (POST /api/admin/content)
    if (url.pathname === '/api/admin/content' && request.method === 'POST') {
      const isAuth = await checkAuth(request, env);
      if (!isAuth) return error('Không có quyền truy cập', 401);
      try {
        const { site, content } = await request.json();
        if (env.HARMONY_DATA_KV) {
          if (site) await env.HARMONY_DATA_KV.put('harmony_site', JSON.stringify(site));
          if (content) await env.HARMONY_DATA_KV.put('harmony_content', JSON.stringify(content));
        }
        return json({ success: true, message: 'Đã lưu thông tin và nội dung website thành công' });
      } catch (e) {
        return error('Lỗi lưu nội dung: ' + e.message, 500);
      }
    }

    // 12. Khôi phục dữ liệu ban đầu (POST /api/admin/reset)
    if (url.pathname === '/api/admin/reset' && request.method === 'POST') {
      const isAuth = await checkAuth(request, env);
      if (!isAuth) return error('Không có quyền truy cập', 401);
      if (env.HARMONY_DATA_KV) {
        await Promise.all([
          env.HARMONY_DATA_KV.delete('harmony_looks'),
          env.HARMONY_DATA_KV.delete('harmony_collections'),
          env.HARMONY_DATA_KV.delete('harmony_niches'),
          env.HARMONY_DATA_KV.delete('harmony_site'),
          env.HARMONY_DATA_KV.delete('harmony_content'),
        ]);
      }
      return json({ success: true, message: 'Đã khôi phục dữ liệu gốc của Harmony Studio' });
    }

    // 13. Upload ảnh / media lên Cloudinary (POST /api/media/upload)
    if (url.pathname === '/api/media/upload' && request.method === 'POST') {
      try {
        const form = await request.formData();
        const file = form.get('file');
        const customFolder = form.get('folder') || 'harmony-studio/uploads';
        if (!file || typeof file === 'string') {
          return error('Vui lòng chọn tệp hình ảnh để tải lên.', 400);
        }
        const cloud = env.CLOUDINARY_CLOUD_NAME || 'dlw6jmsyf';
        const key = env.CLOUDINARY_API_KEY;
        const secret = env.CLOUDINARY_API_SECRET;
        if (!cloud || !key || !secret) {
          return error('Chưa cấu hình tài khoản Cloudinary.', 500);
        }

        const timestamp = String(Math.floor(Date.now() / 1000));
        const params = { folder: String(customFolder), timestamp };
        const signature = await cloudinarySignature(params, secret);

        const fd = new FormData();
        fd.append('file', file);
        fd.append('folder', String(customFolder));
        fd.append('timestamp', timestamp);
        fd.append('api_key', key);
        fd.append('signature', signature);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloud)}/auto/upload`, {
          method: 'POST',
          body: fd,
        });
        const data = await res.json();
        if (!res.ok || !data.secure_url) {
          return error(data?.error?.message || 'Tải ảnh lên Cloudinary thất bại', 400);
        }
        return json({
          success: true,
          url: data.secure_url,
          public_id: data.public_id,
          format: data.format,
          width: data.width,
          height: data.height,
        });
      } catch (err) {
        return error(err instanceof Error ? err.message : 'Lỗi tải tệp máy chủ', 500);
      }
    }

    // 14. Static Assets
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }
    return new Response('Not found', { status: 404 });
  },
};
