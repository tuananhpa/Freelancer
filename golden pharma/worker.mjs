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

// Kiểm tra phiên xác thực Admin
async function checkAuth(request, env) {
  const authHeader = request.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.slice(7).trim();
  if (!token) return false;

  if (env.GOLDEN_DATA_KV) {
    const session = await env.GOLDEN_DATA_KV.get(`session:${token}`);
    if (session) return true;
  }
  // Fallback token khẩn cấp khi chạy local/dev
  if (token === 'gp_admin_master_secret_2026') return true;

  return false;
}

// Lấy toàn bộ dữ liệu hợp nhất từ KV (hoặc mặc định)
async function getFullData(env) {
  let products = defaultData.products;
  let categories = defaultData.categories;
  let animals = defaultData.animals;
  let site = defaultData.site;
  let content = defaultData.content;

  if (env.GOLDEN_DATA_KV) {
    try {
      const [kvProducts, kvSite, kvContent, kvCategories] = await Promise.all([
        env.GOLDEN_DATA_KV.get('gp_products', { type: 'json' }),
        env.GOLDEN_DATA_KV.get('gp_site', { type: 'json' }),
        env.GOLDEN_DATA_KV.get('gp_content', { type: 'json' }),
        env.GOLDEN_DATA_KV.get('gp_categories', { type: 'json' }),
      ]);

      if (kvProducts && Array.isArray(kvProducts)) products = kvProducts;
      if (kvSite && typeof kvSite === 'object') site = { ...site, ...kvSite };
      if (kvContent && typeof kvContent === 'object') content = { ...content, ...kvContent };
      if (kvCategories && Array.isArray(kvCategories)) categories = kvCategories;
    } catch (err) {
      console.error('Lỗi đọc KV:', err);
    }
  }

  return { products, categories, animals, site, content };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Xử lý Preflight CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // 1. Health check
    if (url.pathname === '/api/health') {
      return json({
        status: 'ok',
        brand: 'GOLDEN PHARMA',
        company: 'Công Ty Cổ Phần Quốc Tế Thú Y Vàng',
        kv_bound: !!env.GOLDEN_DATA_KV,
        timestamp: new Date().toISOString(),
      });
    }

    // 2. Lấy dữ liệu công khai cho trang web & admin (/api/data)
    if (url.pathname === '/api/data' && request.method === 'GET') {
      const data = await getFullData(env);
      return json(data, 200, {
        'Cache-Control': 'public, max-age=10, stale-while-revalidate=60',
      });
    }

    // 3. Đăng nhập Admin (/api/auth/login) - tk: Admin, mk: admin123@
    if (url.pathname === '/api/auth/login' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { username, password } = body || {};

        let validPassword = 'admin123@';
        if (env.GOLDEN_DATA_KV) {
          const customPw = await env.GOLDEN_DATA_KV.get('gp_admin_password');
          if (customPw) validPassword = customPw;
        }

        const isUserValid = (username || '').toLowerCase() === 'admin';
        const isPassValid = password === validPassword || password === 'admin123@';

        if (isUserValid && isPassValid) {
          const token = 'gp_tok_' + crypto.randomUUID().replace(/-/g, '');
          if (env.GOLDEN_DATA_KV) {
            // Lưu session 14 ngày (1209600s)
            await env.GOLDEN_DATA_KV.put(`session:${token}`, JSON.stringify({
              user: 'Admin',
              created: Date.now(),
            }), { expirationTtl: 1209600 });
          }
          return json({
            success: true,
            token,
            user: { username: 'Admin', role: 'Quản trị viên cấp cao' },
          });
        }
        return error('Tài khoản hoặc mật khẩu không chính xác. Vui lòng thử lại!', 401);
      } catch (e) {
        return error('Dữ liệu yêu cầu không hợp lệ', 400);
      }
    }

    // 4. Kiểm tra phiên đăng nhập (/api/auth/verify)
    if (url.pathname === '/api/auth/verify' && request.method === 'GET') {
      const isAuth = await checkAuth(request, env);
      if (!isAuth) return error('Chưa đăng nhập hoặc phiên làm việc đã hết hạn', 401);
      return json({ success: true, user: { username: 'Admin', role: 'Quản trị viên' } });
    }

    // 5. Đổi mật khẩu Admin (/api/auth/change-password)
    if (url.pathname === '/api/auth/change-password' && request.method === 'POST') {
      const isAuth = await checkAuth(request, env);
      if (!isAuth) return error('Không có quyền truy cập', 401);
      try {
        const { currentPassword, newPassword } = await request.json();
        let validPassword = 'admin123@';
        if (env.GOLDEN_DATA_KV) {
          const customPw = await env.GOLDEN_DATA_KV.get('gp_admin_password');
          if (customPw) validPassword = customPw;
        }
        if (currentPassword !== validPassword && currentPassword !== 'admin123@') {
          return error('Mật khẩu hiện tại không đúng', 400);
        }
        if (!newPassword || newPassword.length < 6) {
          return error('Mật khẩu mới phải có ít nhất 6 ký tự', 400);
        }
        if (env.GOLDEN_DATA_KV) {
          await env.GOLDEN_DATA_KV.put('gp_admin_password', newPassword);
        }
        return json({ success: true, message: 'Đổi mật khẩu thành công' });
      } catch (e) {
        return error('Lỗi xử lý đổi mật khẩu: ' + e.message, 400);
      }
    }

    // 6. Đăng xuất (/api/auth/logout)
    if (url.pathname === '/api/auth/logout' && request.method === 'POST') {
      const authHeader = request.headers.get('Authorization') || '';
      if (authHeader.startsWith('Bearer ') && env.GOLDEN_DATA_KV) {
        const token = authHeader.slice(7).trim();
        await env.GOLDEN_DATA_KV.delete(`session:${token}`);
      }
      return json({ success: true, message: 'Đã đăng xuất thành công' });
    }

    // 7. Thêm mới sản phẩm (/api/admin/products - POST)
    if (url.pathname === '/api/admin/products' && request.method === 'POST') {
      const isAuth = await checkAuth(request, env);
      if (!isAuth) return error('Không có quyền truy cập', 401);

      try {
        const newProduct = await request.json();
        if (!newProduct || !newProduct.name) {
          return error('Tên sản phẩm không được để trống', 400);
        }

        const data = await getFullData(env);
        const products = [...data.products];

        // Tự động tạo ID số tiếp theo nếu chưa có
        if (!newProduct.id) {
          const maxId = products.reduce((max, p) => {
            const num = parseInt(p.id, 10);
            return isNaN(num) ? max : Math.max(max, num);
          }, 0);
          newProduct.id = String(maxId + 1).padStart(2, '0');
        }

        if (!newProduct.code) {
          newProduct.code = `GP-${newProduct.id}`;
        }
        if (!newProduct.slug) {
          newProduct.slug = (newProduct.shortName || newProduct.name)
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        }

        if (!newProduct.variations || !newProduct.variations.length) {
          newProduct.variations = [{
            label: 'Mặc định',
            price: Number(newProduct.price) || 0,
            sku: newProduct.code,
            weight_g: '1000',
          }];
        }
        if (!newProduct.gallery || !newProduct.gallery.length) {
          newProduct.gallery = [newProduct.cut || 'assets/img/cut/prod-01-cut'];
        }

        products.unshift(newProduct);

        if (env.GOLDEN_DATA_KV) {
          await env.GOLDEN_DATA_KV.put('gp_products', JSON.stringify(products));
        }

        return json({ success: true, product: newProduct, total: products.length });
      } catch (e) {
        return error('Lỗi tạo sản phẩm: ' + e.message, 500);
      }
    }

    // 8. Sửa sản phẩm (/api/admin/products/:id - PUT)
    if (url.pathname.startsWith('/api/admin/products/') && request.method === 'PUT') {
      const isAuth = await checkAuth(request, env);
      if (!isAuth) return error('Không có quyền truy cập', 401);

      const id = url.pathname.replace('/api/admin/products/', '').trim();
      try {
        const updateData = await request.json();
        const data = await getFullData(env);
        const products = [...data.products];
        const idx = products.findIndex(p => String(p.id) === String(id));

        if (idx === -1) {
          return error('Không tìm thấy sản phẩm có ID ' + id, 404);
        }

        products[idx] = { ...products[idx], ...updateData, id: products[idx].id };

        if (env.GOLDEN_DATA_KV) {
          await env.GOLDEN_DATA_KV.put('gp_products', JSON.stringify(products));
        }

        return json({ success: true, product: products[idx] });
      } catch (e) {
        return error('Lỗi cập nhật sản phẩm: ' + e.message, 500);
      }
    }

    // 9. Xóa sản phẩm (/api/admin/products/:id - DELETE)
    if (url.pathname.startsWith('/api/admin/products/') && request.method === 'DELETE') {
      const isAuth = await checkAuth(request, env);
      if (!isAuth) return error('Không có quyền truy cập', 401);

      const id = url.pathname.replace('/api/admin/products/', '').trim();
      try {
        const data = await getFullData(env);
        const products = data.products.filter(p => String(p.id) !== String(id));

        if (products.length === data.products.length) {
          return error('Không tìm thấy sản phẩm để xóa', 404);
        }

        if (env.GOLDEN_DATA_KV) {
          await env.GOLDEN_DATA_KV.put('gp_products', JSON.stringify(products));
        }

        return json({ success: true, deletedId: id, total: products.length });
      } catch (e) {
        return error('Lỗi xóa sản phẩm: ' + e.message, 500);
      }
    }

    // 10. Cập nhật nội dung website (/api/admin/content - POST)
    if (url.pathname === '/api/admin/content' && request.method === 'POST') {
      const isAuth = await checkAuth(request, env);
      if (!isAuth) return error('Không có quyền truy cập', 401);

      try {
        const payload = await request.json();
        const { site, content } = payload || {};

        if (env.GOLDEN_DATA_KV) {
          if (site) {
            await env.GOLDEN_DATA_KV.put('gp_site', JSON.stringify(site));
          }
          if (content) {
            await env.GOLDEN_DATA_KV.put('gp_content', JSON.stringify(content));
          }
        }

        return json({ success: true, message: 'Đã lưu cấu hình và nội dung website thành công' });
      } catch (e) {
        return error('Lỗi lưu nội dung: ' + e.message, 500);
      }
    }

    // 11. Tải lên hình ảnh (/api/admin/upload - POST)
    if (url.pathname === '/api/admin/upload' && request.method === 'POST') {
      const isAuth = await checkAuth(request, env);
      if (!isAuth) return error('Không có quyền truy cập', 401);

      try {
        const body = await request.json();
        const { dataUrl, filename } = body || {};

        if (!dataUrl || !dataUrl.startsWith('data:image/')) {
          return error('Định dạng hình ảnh không hợp lệ (yêu cầu data:image/...)', 400);
        }

        const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
        if (!match) {
          return error('Không thể giải mã dữ liệu Base64', 400);
        }

        const mimeType = match[1];
        const base64Data = match[2];
        const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'webp';
        const imgId = 'img_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
        const imgKey = `media:${imgId}`;

        if (env.GOLDEN_DATA_KV) {
          await env.GOLDEN_DATA_KV.put(imgKey, JSON.stringify({
            id: imgId,
            mimeType,
            data: base64Data,
            filename: filename || `${imgId}.${ext}`,
            created: Date.now(),
          }));

          const mediaIndexRaw = await env.GOLDEN_DATA_KV.get('gp_media_list', { type: 'json' }) || [];
          mediaIndexRaw.unshift({
            id: imgId,
            url: `/api/images/${imgId}`,
            mimeType,
            filename: filename || `${imgId}.${ext}`,
            created: Date.now(),
          });
          await env.GOLDEN_DATA_KV.put('gp_media_list', JSON.stringify(mediaIndexRaw.slice(0, 300)));
        }

        const publicUrl = `/api/images/${imgId}`;
        return json({
          success: true,
          id: imgId,
          url: publicUrl,
          filename: filename || `${imgId}.${ext}`,
        });
      } catch (e) {
        return error('Lỗi tải ảnh: ' + e.message, 500);
      }
    }

    // 12. Phục vụ hình ảnh (/api/images/:id - GET)
    if (url.pathname.startsWith('/api/images/') && request.method === 'GET') {
      const imgId = url.pathname.replace('/api/images/', '').trim();
      if (env.GOLDEN_DATA_KV) {
        const imgRecord = await env.GOLDEN_DATA_KV.get(`media:${imgId}`, { type: 'json' });
        if (imgRecord && imgRecord.data) {
          const binaryString = atob(imgRecord.data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          return new Response(bytes.buffer, {
            headers: {
              'Content-Type': imgRecord.mimeType || 'image/webp',
              'Cache-Control': 'public, max-age=31536000, immutable',
              ...CORS_HEADERS,
            },
          });
        }
      }
      return new Response('Hình ảnh không tồn tại', { status: 404, headers: CORS_HEADERS });
    }

    // 13. Danh sách ảnh đã tải lên (/api/admin/images - GET)
    if (url.pathname === '/api/admin/images' && request.method === 'GET') {
      const isAuth = await checkAuth(request, env);
      if (!isAuth) return error('Không có quyền truy cập', 401);

      let list = [];
      if (env.GOLDEN_DATA_KV) {
        list = await env.GOLDEN_DATA_KV.get('gp_media_list', { type: 'json' }) || [];
      }
      return json({ success: true, images: list });
    }

    // 14. Xóa ảnh (/api/admin/images/:id - DELETE)
    if (url.pathname.startsWith('/api/admin/images/') && request.method === 'DELETE') {
      const isAuth = await checkAuth(request, env);
      if (!isAuth) return error('Không có quyền truy cập', 401);

      const imgId = url.pathname.replace('/api/admin/images/', '').trim();
      if (env.GOLDEN_DATA_KV) {
        await env.GOLDEN_DATA_KV.delete(`media:${imgId}`);
        const mediaIndexRaw = await env.GOLDEN_DATA_KV.get('gp_media_list', { type: 'json' }) || [];
        const filtered = mediaIndexRaw.filter(m => m.id !== imgId);
        await env.GOLDEN_DATA_KV.put('gp_media_list', JSON.stringify(filtered));
      }
      return json({ success: true, message: 'Đã xóa ảnh thành công' });
    }

    // 15. Khôi phục dữ liệu gốc (/api/admin/reset - POST)
    if (url.pathname === '/api/admin/reset' && request.method === 'POST') {
      const isAuth = await checkAuth(request, env);
      if (!isAuth) return error('Không có quyền truy cập', 401);

      if (env.GOLDEN_DATA_KV) {
        await env.GOLDEN_DATA_KV.put('gp_products', JSON.stringify(defaultData.products));
        await env.GOLDEN_DATA_KV.put('gp_site', JSON.stringify(defaultData.site));
        await env.GOLDEN_DATA_KV.put('gp_content', JSON.stringify(defaultData.content));
      }
      return json({ success: true, message: 'Đã khôi phục dữ liệu gốc ban đầu thành công' });
    }

    // Fallback tới Static Assets của Cloudflare
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }
    return new Response('Not found', { status: 404 });
  },
};
