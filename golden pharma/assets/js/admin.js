/* ==========================================================================
   GOLDEN PHARMA — admin.js
   Hệ thống Quản trị Bán hàng & Nội dung Website Toàn diện
   Tài khoản: Admin | Mật khẩu: admin123@
   ========================================================================== */

const STATE = {
  token: localStorage.getItem('gp_admin_token') || '',
  products: [],
  categories: [],
  animals: [],
  site: {},
  content: {},
  media: [],
  targetImgInput: null,
  gallery: [],
  pickerImages: [],
  pickerSelected: null,
};

// Hàm tiện ích phân giải URL hình ảnh
function resolveImg(path, size = 400) {
  if (!path) return 'assets/brand/logo-mark.png';
  if (path.startsWith('data:') || path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/api/images/') || /\.(webp|png|jpe?g|gif|svg)$/i.test(path)) {
    return path;
  }
  // Ảnh tách nền chỉ có bản 600/1000
  if (path.includes('/cut/') && size < 600) size = 600;
  return `${path}-${size}.webp`;
}

const fmtVND = n => Number(n || 0).toLocaleString('vi-VN') + 'đ';

function showToast(msg) {
  const toast = document.getElementById('adminToast');
  const txt = document.getElementById('toastMsg');
  if (!toast || !txt) return;
  txt.textContent = msg;
  toast.classList.add('is-show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => {
    toast.classList.remove('is-show');
  }, 3200);
}

/* ==========================================================================
   Xác thực & Phiên làm việc (Auth)
   ========================================================================== */
async function initAuth() {
  const loginForm = document.getElementById('loginForm');
  const loginOverlay = document.getElementById('loginOverlay');
  const adminApp = document.getElementById('adminApp');
  const loginAlert = document.getElementById('loginAlert');
  const togglePassBtn = document.getElementById('togglePassBtn');
  const passInput = document.getElementById('loginPass');

  if (togglePassBtn && passInput) {
    togglePassBtn.addEventListener('click', () => {
      passInput.type = passInput.type === 'password' ? 'text' : 'password';
    });
  }

  // Kiểm tra token đã lưu
  if (STATE.token) {
    try {
      const res = await fetch('/api/auth/verify', {
        headers: { 'Authorization': `Bearer ${STATE.token}` }
      });
      if (res.ok) {
        showAdminApp();
        loadAllData();
        return;
      }
    } catch (e) {
      // Nếu là token hợp lệ offline
      if (STATE.token.startsWith('gp_tok_') || STATE.token === 'gp_local_admin_token') {
        showAdminApp();
        loadAllData();
        return;
      }
    }
  }

  // Hiển thị form đăng nhập
  loginOverlay.style.display = 'grid';
  adminApp.style.display = 'none';

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginAlert.style.display = 'none';
    const user = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPass').value.trim();

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        STATE.token = data.token;
        localStorage.setItem('gp_admin_token', STATE.token);
        showAdminApp();
        loadAllData();
        showToast('Đăng nhập thành công! Chào mừng Admin.');
        return;
      } else {
        loginAlert.textContent = data.error || 'Tài khoản hoặc mật khẩu không chính xác!';
        loginAlert.style.display = 'block';
      }
    } catch (err) {
      // Fallback khi chạy static/offline
      if (user.toLowerCase() === 'admin' && pass === 'admin123@') {
        STATE.token = 'gp_local_admin_token';
        localStorage.setItem('gp_admin_token', STATE.token);
        showAdminApp();
        loadAllData();
        showToast('Đăng nhập quản trị thành công!');
        return;
      }
      loginAlert.textContent = 'Mật khẩu không chính xác. Mặc định: tk Admin / mk admin123@';
      loginAlert.style.display = 'block';
    }
  });

  document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    if (confirm('Bạn có chắc chắn muốn đăng xuất khỏi trang quản trị?')) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${STATE.token}` }
        });
      } catch (e) {}
      localStorage.removeItem('gp_admin_token');
      STATE.token = '';
      location.reload();
    }
  });
}

function showAdminApp() {
  document.getElementById('loginOverlay').style.display = 'none';
  document.getElementById('adminApp').style.display = 'flex';
}

/* ==========================================================================
   Tải & Đồng bộ Dữ liệu Toàn cục
   ========================================================================== */
async function loadAllData() {
  try {
    const res = await fetch('/api/data');
    if (res.ok) {
      const data = await res.json();
      STATE.products = data.products || [];
      STATE.categories = data.categories || [];
      STATE.animals = data.animals || [];
      STATE.site = data.site || {};
      STATE.content = data.content || {};
    }
  } catch (e) {
    console.warn('Lấy dữ liệu từ API không thành công, dùng dữ liệu lưu trữ:', e);
  }

  // Tải danh sách ảnh từ API
  try {
    const mRes = await fetch('/api/admin/images', {
      headers: { 'Authorization': `Bearer ${STATE.token}` }
    });
    if (mRes.ok) {
      const mData = await mRes.json();
      STATE.media = mData.images || [];
    }
  } catch (e) {}

  updateDashboardStats();
  renderProductsTable();
  populateCategoryAndAnimalFilters();
  populateContentForm();
  renderMediaGrid();
}

/* ==========================================================================
   Điều hướng Tabs
   ========================================================================== */
function initTabs() {
  const navBtns = document.querySelectorAll('.admin-nav-item');
  const panes = document.querySelectorAll('.admin-tab-pane');
  const pageTitle = document.getElementById('pageTitle');

  const titles = {
    dashboard: 'Tổng quan hệ thống',
    products: 'Quản lý sản phẩm Golden Pharma',
    media: 'Thư viện & Tải lên hình ảnh',
    content: 'Quản lý nội dung & Cấu hình Website',
    settings: 'Cài đặt tài khoản & Sao lưu dữ liệu',
  };

  function switchTab(tabId) {
    navBtns.forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.tab === tabId);
    });
    panes.forEach(pane => {
      pane.style.display = pane.id === `tab-${tabId}` ? 'block' : 'none';
    });
    if (pageTitle && titles[tabId]) {
      pageTitle.textContent = titles[tabId];
    }
  }

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  document.querySelectorAll('[data-goto-tab]').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.gotoTab));
  });

  document.getElementById('topAddProdBtn')?.addEventListener('click', () => {
    switchTab('products');
    openAddProductModal();
  });
}

/* ==========================================================================
   Tab 1: Tổng quan (Dashboard)
   ========================================================================== */
function updateDashboardStats() {
  document.getElementById('statTotalProducts').textContent = STATE.products.length;
  document.getElementById('statTotalCategories').textContent = STATE.categories.length;
  document.getElementById('statTotalMedia').textContent = (STATE.products.length + STATE.media.length) + '+';
  document.getElementById('navProdCount').textContent = STATE.products.length;
  document.getElementById('navMediaCount').textContent = STATE.media.length;
  document.getElementById('prodListBadge').textContent = `${STATE.products.length} sản phẩm`;

  // Render top sản phẩm bán chạy nhất
  const topTable = document.getElementById('dashTopProductsTable');
  if (!topTable) return;

  const sorted = [...STATE.products].sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0)).slice(0, 6);
  topTable.innerHTML = sorted.map(p => {
    const cat = STATE.categories.find(c => c.id === p.category) || { name: 'Chế phẩm' };
    const thumb = resolveImg(p.cut || p.gallery?.[0], 400);
    return `
      <tr>
        <td><img src="${thumb}" class="admin-prod-thumb" alt="${p.shortName}"></td>
        <td><b>${p.code || 'GP-' + p.id}</b></td>
        <td>
          <div style="font-weight:700">${p.shortName || p.name}</div>
          <small style="color:var(--admin-ink-soft)">${p.name}</small>
        </td>
        <td><span class="admin-badge admin-badge--green">${cat.name}</span></td>
        <td><b style="color:var(--admin-emerald)">${fmtVND(p.price)}</b></td>
        <td><b>${p.soldText || p.soldCount || 0}</b></td>
        <td>
          <button type="button" class="admin-btn admin-btn--outline admin-btn--sm" onclick="editProduct('${p.id}')">✏️ Sửa</button>
        </td>
      </tr>
    `;
  }).join('');
}

/* ==========================================================================
   Tab 2: Quản lý Sản phẩm (Products CRUD)
   ========================================================================== */
function populateCategoryAndAnimalFilters() {
  const catFilter = document.getElementById('prodCategoryFilter');
  const animFilter = document.getElementById('prodAnimalFilter');
  const prodCatSelect = document.getElementById('prodCategory');
  const prodAnimalsList = document.getElementById('prodAnimalsList');

  if (catFilter) {
    catFilter.innerHTML = '<option value="all">Tất cả danh mục (' + STATE.categories.length + ')</option>' +
      STATE.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  }

  if (animFilter) {
    animFilter.innerHTML = '<option value="all">Tất cả nhóm vật nuôi</option>' +
      STATE.animals.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
  }

  if (prodCatSelect) {
    prodCatSelect.innerHTML = STATE.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  }

  if (prodAnimalsList) {
    prodAnimalsList.innerHTML = STATE.animals.filter(a => a.id !== 'all').map(a => `
      <label style="display:inline-flex;align-items:center;gap:6px;cursor:pointer;font-size:13.5px">
        <input type="checkbox" name="prodAnimalCheck" value="${a.id}">
        <span>${a.name}</span>
      </label>
    `).join('');
  }
}

function renderProductsTable() {
  const tbody = document.getElementById('prodTableBody');
  if (!tbody) return;

  const search = (document.getElementById('prodSearchInput')?.value || '').toLowerCase().trim();
  const cat = document.getElementById('prodCategoryFilter')?.value || 'all';
  const anim = document.getElementById('prodAnimalFilter')?.value || 'all';

  const filtered = STATE.products.filter(p => {
    if (search) {
      const matchName = (p.name || '').toLowerCase().includes(search);
      const matchShort = (p.shortName || '').toLowerCase().includes(search);
      const matchCode = (p.code || '').toLowerCase().includes(search);
      if (!matchName && !matchShort && !matchCode) return false;
    }
    if (cat !== 'all' && p.category !== cat) return false;
    if (anim !== 'all' && !(p.animals || []).includes(anim)) return false;
    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center;padding:36px;color:var(--admin-ink-soft)">
          Không tìm thấy sản phẩm nào phù hợp điều kiện lọc.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(p => {
    const catObj = STATE.categories.find(c => c.id === p.category) || { name: 'Chưa phân loại' };
    const thumb = resolveImg(p.cut || p.gallery?.[0], 400);
    return `
      <tr>
        <td>
          <img src="${thumb}" class="admin-prod-thumb" alt="${p.shortName}">
        </td>
        <td><b style="font-family:monospace">${p.code || 'GP-' + p.id}</b></td>
        <td>
          <div style="font-weight:700;color:var(--admin-forest)">${p.shortName || p.name}</div>
          <div style="font-size:12px;color:var(--admin-ink-soft);max-width:320px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.name}</div>
        </td>
        <td><span class="admin-badge admin-badge--green">${catObj.name}</span></td>
        <td>
          <b style="color:var(--admin-emerald)">${fmtVND(p.price)}</b>
          ${p.originalPrice > p.price ? `<div style="font-size:11px;text-decoration:line-through;color:var(--admin-ink-muted)">${fmtVND(p.originalPrice)}</div>` : ''}
        </td>
        <td><b>${p.soldText || p.soldCount || 0}</b></td>
        <td><span style="color:#D98A00;font-weight:700">★ ${p.rating || 5.0}</span></td>
        <td style="text-align:right">
          <div class="admin-action-btns" style="justify-content:flex-end">
            <a href="chi-tiet-san-pham.html?id=${p.id}" target="_blank" class="admin-icon-btn" title="Xem trên website">👁️</a>
            <button type="button" class="admin-icon-btn" onclick="duplicateProduct('${p.id}')" title="Nhân bản">📋</button>
            <button type="button" class="admin-icon-btn" onclick="editProduct('${p.id}')" title="Chỉnh sửa">✏️</button>
            <button type="button" class="admin-icon-btn admin-icon-btn--danger" onclick="deleteProduct('${p.id}')" title="Xóa">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Lắng nghe tìm kiếm và bộ lọc
document.getElementById('prodSearchInput')?.addEventListener('input', renderProductsTable);
document.getElementById('prodCategoryFilter')?.addEventListener('change', renderProductsTable);
document.getElementById('prodAnimalFilter')?.addEventListener('change', renderProductsTable);
document.getElementById('resetFilterBtn')?.addEventListener('click', () => {
  document.getElementById('prodSearchInput').value = '';
  document.getElementById('prodCategoryFilter').value = 'all';
  document.getElementById('prodAnimalFilter').value = 'all';
  renderProductsTable();
});

/* ==========================================================================
   Modal Thêm / Sửa Sản Phẩm
   ========================================================================== */
function openAddProductModal() {
  document.getElementById('productModalTitle').textContent = 'Thêm sản phẩm mới';
  document.getElementById('prodEditId').value = '';
  document.getElementById('productForm').reset();
  
  // Tự sinh mã sản phẩm tiếp theo
  const maxNum = STATE.products.reduce((max, p) => {
    const n = parseInt(p.id, 10);
    return isNaN(n) ? max : Math.max(max, n);
  }, 0);
  const nextId = String(maxNum + 1).padStart(2, '0');
  document.getElementById('prodCode').value = `GP-${nextId}`;
  document.getElementById('prodAccent').value = '#0E6B3A';
  document.getElementById('prodAccentHex').textContent = '#0E6B3A';
  document.getElementById('prodRating').value = '5.0';
  document.getElementById('prodSoldCount').value = '0';
  document.getElementById('prodCutPreview').src = 'assets/brand/logo-mark.png';

  renderHighlightsList([]);
  renderVariationsList([{ label: '1kg', price: 0, sku: `GP-${nextId}`, weight_g: '1000' }]);
  renderGalleryList([]);

  document.getElementById('productModal').classList.add('is-open');
}

window.closeProductModal = function() {
  document.getElementById('productModal').classList.remove('is-open');
};

window.editProduct = function(id) {
  const p = STATE.products.find(item => String(item.id) === String(id));
  if (!p) return;

  document.getElementById('productModalTitle').textContent = `Chỉnh sửa: ${p.shortName || p.name}`;
  document.getElementById('prodEditId').value = p.id;
  document.getElementById('prodCode').value = p.code || `GP-${p.id}`;
  document.getElementById('prodCategory').value = p.category || STATE.categories[0]?.id;
  document.getElementById('prodName').value = p.name || '';
  document.getElementById('prodShortName').value = p.shortName || '';
  document.getElementById('prodPrice').value = p.price || 0;
  document.getElementById('prodOriginalPrice').value = p.originalPrice || p.price || 0;
  document.getElementById('prodSoldCount').value = p.soldCount || 0;
  document.getElementById('prodRating').value = p.rating || 5.0;
  document.getElementById('prodAccent').value = p.accent || '#0E6B3A';
  document.getElementById('prodAccentHex').textContent = p.accent || '#0E6B3A';
  document.getElementById('prodCutImg').value = p.cut || '';
  document.getElementById('prodCutPreview').src = resolveImg(p.cut, 400);
  document.getElementById('prodDescHtml').value = p.descriptionHtml || '';

  // Checkboxes vật nuôi
  const animalChecks = document.querySelectorAll('input[name="prodAnimalCheck"]');
  animalChecks.forEach(cb => {
    cb.checked = (p.animals || []).includes(cb.value);
  });

  renderHighlightsList(p.highlights || []);
  renderVariationsList(p.variations || [{ label: '1kg', price: p.price, sku: p.code, weight_g: '1000' }]);
  renderGalleryList(p.gallery || []);

  document.getElementById('productModal').classList.add('is-open');
};

window.duplicateProduct = function(id) {
  const p = STATE.products.find(item => String(item.id) === String(id));
  if (!p) return;

  const clone = JSON.parse(JSON.stringify(p));
  const maxNum = STATE.products.reduce((max, prod) => {
    const n = parseInt(prod.id, 10);
    return isNaN(n) ? max : Math.max(max, n);
  }, 0);
  clone.id = String(maxNum + 1).padStart(2, '0');
  clone.code = `GP-${clone.id}`;
  clone.shortName = `${p.shortName} (Bản sao)`;
  clone.name = `${p.name} (Bản sao)`;

  STATE.products.unshift(clone);
  saveProductsToServer();
  renderProductsTable();
  updateDashboardStats();
  showToast(`Đã nhân bản sản phẩm: ${clone.shortName}`);
};

window.deleteProduct = async function(id) {
  const p = STATE.products.find(item => String(item.id) === String(id));
  if (!p) return;
  if (!confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${p.shortName || p.name}" (Mã: ${p.code})? Hành động này không thể hoàn tác.`)) {
    return;
  }

  STATE.products = STATE.products.filter(item => String(item.id) !== String(id));

  try {
    await fetch(`/api/admin/products/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${STATE.token}` }
    });
  } catch (e) {
    console.warn('Lỗi khi xóa qua API:', e);
  }

  renderProductsTable();
  updateDashboardStats();
  showToast(`Đã xóa sản phẩm: ${p.shortName}`);
};

// Highlights list builder
function renderHighlightsList(list) {
  const box = document.getElementById('prodHighlightsList');
  if (!box) return;
  box.innerHTML = list.map((h, i) => `
    <div class="admin-tag-row">
      <input type="text" class="admin-input prod-highlight-item" value="${h.replace(/"/g, '&quot;')}" placeholder="Đặc điểm nổi bật (vd: Khử mùi nhanh...)">
      <button type="button" class="admin-icon-btn admin-icon-btn--danger" onclick="this.parentElement.remove()" title="Xóa dòng">✕</button>
    </div>
  `).join('');
}

document.getElementById('addHighlightRowBtn')?.addEventListener('click', () => {
  const box = document.getElementById('prodHighlightsList');
  const div = document.createElement('div');
  div.className = 'admin-tag-row';
  div.innerHTML = `
    <input type="text" class="admin-input prod-highlight-item" placeholder="Đặc điểm nổi bật...">
    <button type="button" class="admin-icon-btn admin-icon-btn--danger" onclick="this.parentElement.remove()" title="Xóa dòng">✕</button>
  `;
  box.appendChild(div);
});

// Variations list builder
function renderVariationsList(vars) {
  const box = document.getElementById('prodVariationsList');
  if (!box) return;
  box.innerHTML = vars.map((v, i) => `
    <div class="admin-tag-row" style="background:#fff;padding:8px;border-radius:10px;border:1px solid var(--admin-line);display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr 36px;gap:8px">
      <input type="text" class="admin-input var-label" value="${v.label || ''}" placeholder="Quy cách (1kg, 5kg...)">
      <input type="number" class="admin-input var-price" value="${v.price || 0}" placeholder="Giá bán VND">
      <input type="text" class="admin-input var-sku" value="${v.sku || ''}" placeholder="Mã SKU">
      <input type="text" class="admin-input var-weight" value="${v.weight_g || '1000'}" placeholder="Khối lượng (gam)">
      <button type="button" class="admin-icon-btn admin-icon-btn--danger" onclick="this.parentElement.remove()" title="Xóa">✕</button>
    </div>
  `).join('');
}

document.getElementById('addVariationRowBtn')?.addEventListener('click', () => {
  const box = document.getElementById('prodVariationsList');
  const div = document.createElement('div');
  div.className = 'admin-tag-row';
  div.style.cssText = 'background:#fff;padding:8px;border-radius:10px;border:1px solid var(--admin-line);display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr 36px;gap:8px';
  div.innerHTML = `
    <input type="text" class="admin-input var-label" placeholder="Quy cách (5kg...)">
    <input type="number" class="admin-input var-price" placeholder="Giá bán VND">
    <input type="text" class="admin-input var-sku" placeholder="Mã SKU">
    <input type="text" class="admin-input var-weight" placeholder="Khối lượng (gam)" value="5000">
    <button type="button" class="admin-icon-btn admin-icon-btn--danger" onclick="this.parentElement.remove()" title="Xóa">✕</button>
  `;
  box.appendChild(div);
});

// Bộ ảnh chi tiết: lưới thumbnail, thứ tự trong STATE.gallery (ảnh đầu = ảnh bìa)
function renderGalleryList(gallery) {
  if (gallery) STATE.gallery = [...gallery];
  const box = document.getElementById('prodGalleryList');
  if (!box) return;
  const g = STATE.gallery;
  document.getElementById('prodGalleryCount').textContent = `(${g.length} ảnh)`;
  box.innerHTML = g.map((src, i) => `
    <div class="prod-gallery-tile">
      <img src="${resolveImg(src, 400)}" alt="Ảnh ${i + 1}" loading="lazy">
      ${i === 0 ? '<span class="prod-gallery-cover">Ảnh bìa</span>' : `<span class="prod-gallery-num">${i + 1}</span>`}
      <div class="prod-gallery-tools">
        <button type="button" onclick="moveGalleryImg(${i}, -1)" ${i === 0 ? 'disabled' : ''} title="Lên trước" aria-label="Lên trước">◀</button>
        <button type="button" onclick="moveGalleryImg(${i}, -${i})" ${i === 0 ? 'disabled' : ''} title="Đặt làm ảnh bìa" aria-label="Đặt làm ảnh bìa">★</button>
        <button type="button" onclick="moveGalleryImg(${i}, 1)" ${i === g.length - 1 ? 'disabled' : ''} title="Ra sau" aria-label="Ra sau">▶</button>
        <button type="button" class="is-danger" onclick="removeGalleryImg(${i})" title="Bỏ khỏi bộ ảnh" aria-label="Bỏ ảnh">✕</button>
      </div>
    </div>
  `).join('') + `
    <button type="button" class="prod-gallery-add" onclick="pickImageFor('gallery')"><b>＋</b>Chọn từ thư viện</button>
    <label class="prod-gallery-add" for="prodDirectUploadInput"><b>⬆</b>Tải ảnh từ máy</label>
  `;
}

window.moveGalleryImg = function(i, delta) {
  const [img] = STATE.gallery.splice(i, 1);
  STATE.gallery.splice(i + delta, 0, img);
  renderGalleryList();
};

window.removeGalleryImg = function(i) {
  STATE.gallery.splice(i, 1);
  renderGalleryList();
};

async function addGalleryFiles(files) {
  const imgs = Array.from(files).filter(f => f.type.startsWith('image/'));
  if (!imgs.length) return;
  showToast(`Đang tải lên ${imgs.length} ảnh...`);
  for (const file of imgs) {
    const url = await uploadImageFile(file);
    if (url) STATE.gallery.push(url);
  }
  renderGalleryList();
  renderMediaGrid();
  updateDashboardStats();
  showToast(`Đã thêm ${imgs.length} ảnh vào bộ ảnh sản phẩm!`);
}

// Kéo thả ảnh từ máy vào lưới
const galleryDrop = document.getElementById('prodGalleryList');
galleryDrop?.addEventListener('dragover', e => { e.preventDefault(); galleryDrop.classList.add('is-dragover'); });
galleryDrop?.addEventListener('dragleave', () => galleryDrop.classList.remove('is-dragover'));
galleryDrop?.addEventListener('drop', e => {
  e.preventDefault();
  galleryDrop.classList.remove('is-dragover');
  addGalleryFiles(e.dataTransfer.files);
});

// Preview ảnh khi đổi link hoặc màu sắc
document.getElementById('prodCutImg')?.addEventListener('input', e => {
  document.getElementById('prodCutPreview').src = resolveImg(e.target.value, 400);
});
document.getElementById('prodAccent')?.addEventListener('input', e => {
  document.getElementById('prodAccentHex').textContent = e.target.value;
});

// Tải ảnh trực tiếp trong modal sản phẩm
document.getElementById('prodDirectUploadInput')?.addEventListener('change', async (e) => {
  await addGalleryFiles(e.target.files);
  e.target.value = '';
});

document.getElementById('prodCutUploadInput')?.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const url = await uploadImageFile(file);
  const input = document.getElementById('prodCutImg');
  input.value = url;
  input.dispatchEvent(new Event('input'));
  e.target.value = '';
  renderMediaGrid();
  showToast('Đã tải lên ảnh tách nền!');
});

// Submit Form Sản Phẩm (Thêm / Sửa)
document.getElementById('productForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const editId = document.getElementById('prodEditId').value.trim();

  // Thu thập dữ liệu
  const highlights = Array.from(document.querySelectorAll('.prod-highlight-item'))
    .map(input => input.value.trim())
    .filter(Boolean);

  const variations = Array.from(document.querySelectorAll('#prodVariationsList .admin-tag-row')).map(row => {
    return {
      label: row.querySelector('.var-label').value.trim() || 'Mặc định',
      price: Number(row.querySelector('.var-price').value) || 0,
      sku: row.querySelector('.var-sku').value.trim(),
      weight_g: row.querySelector('.var-weight').value.trim() || '1000',
    };
  });

  const gallery = [...STATE.gallery];
  if (!gallery.length) {
    alert('Vui lòng thêm ít nhất 1 ảnh vào bộ ảnh chi tiết của sản phẩm.');
    return;
  }

  const checkedAnimals = Array.from(document.querySelectorAll('input[name="prodAnimalCheck"]:checked'))
    .map(cb => cb.value);

  const prodData = {
    code: document.getElementById('prodCode').value.trim(),
    name: document.getElementById('prodName').value.trim(),
    shortName: document.getElementById('prodShortName').value.trim(),
    category: document.getElementById('prodCategory').value,
    animals: checkedAnimals.length ? checkedAnimals : ['gia-cam', 'heo'],
    price: Number(document.getElementById('prodPrice').value) || 0,
    originalPrice: Number(document.getElementById('prodOriginalPrice').value) || 0,
    soldCount: Number(document.getElementById('prodSoldCount').value) || 0,
    soldText: (Number(document.getElementById('prodSoldCount').value) > 1000)
      ? (Number(document.getElementById('prodSoldCount').value) / 1000).toFixed(1) + 'K'
      : String(document.getElementById('prodSoldCount').value || '0'),
    rating: Number(document.getElementById('prodRating').value) || 5.0,
    accent: document.getElementById('prodAccent').value || '#0E6B3A',
    cut: document.getElementById('prodCutImg').value.trim() || (gallery[0] || ''),
    gallery,
    highlights: highlights.length ? highlights : ['Chế phẩm chuẩn GMP-WHO Golden Pharma'],
    variations: variations.length ? variations : [{ label: '1kg', price: Number(document.getElementById('prodPrice').value) || 0, sku: document.getElementById('prodCode').value.trim(), weight_g: '1000' }],
    descriptionHtml: document.getElementById('prodDescHtml').value.trim(),
  };

  if (editId) {
    // Sửa sản phẩm
    const idx = STATE.products.findIndex(p => String(p.id) === String(editId));
    if (idx !== -1) {
      STATE.products[idx] = { ...STATE.products[idx], ...prodData };
      try {
        await fetch(`/api/admin/products/${editId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${STATE.token}`,
          },
          body: JSON.stringify(STATE.products[idx])
        });
      } catch (e) {}
      showToast(`Đã cập nhật sản phẩm: ${prodData.shortName}`);
    }
  } else {
    // Thêm mới
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${STATE.token}`,
        },
        body: JSON.stringify(prodData)
      });
      const data = await res.json();
      if (res.ok && data.product) {
        STATE.products.unshift(data.product);
      } else {
        STATE.products.unshift(prodData);
      }
    } catch (e) {
      STATE.products.unshift(prodData);
    }
    showToast(`Đã thêm sản phẩm mới: ${prodData.shortName}`);
  }

  saveProductsToServer();
  closeProductModal();
  renderProductsTable();
  updateDashboardStats();
});

async function saveProductsToServer() {
  localStorage.setItem('gp_custom_products', JSON.stringify(STATE.products));
}

document.getElementById('openAddProdModalBtn')?.addEventListener('click', openAddProductModal);

/* ==========================================================================
   Tab 3: Quản lý Hình ảnh (Media Upload & Delete)
   ========================================================================== */
function initMediaUpload() {
  const dropzone = document.getElementById('mediaDropzone');
  const fileInput = document.getElementById('mediaFileInput');

  if (!dropzone || !fileInput) return;

  ['dragenter', 'dragover'].forEach(event => {
    dropzone.addEventListener(event, (e) => {
      e.preventDefault();
      dropzone.classList.add('is-dragover');
    });
  });

  ['dragleave', 'drop'].forEach(event => {
    dropzone.addEventListener(event, (e) => {
      e.preventDefault();
      dropzone.classList.remove('is-dragover');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length) handleFiles(files);
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) handleFiles(e.target.files);
  });

  async function handleFiles(files) {
    let successCount = 0;
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      const url = await uploadImageFile(file);
      if (url) successCount++;
    }
    if (successCount > 0) {
      showToast(`Đã tải lên thành công ${successCount} hình ảnh!`);
      renderMediaGrid();
      updateDashboardStats();
    }
  }
}

async function uploadImageFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const originalDataUrl = e.target.result;
      
      // Tối ưu hóa kích thước bằng canvas nếu ảnh lớn > 1200px
      const optimizedDataUrl = await resizeImageIfNeeded(originalDataUrl);

      try {
        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${STATE.token}`,
          },
          body: JSON.stringify({
            dataUrl: optimizedDataUrl,
            filename: file.name
          })
        });
        const data = await res.json();
        if (res.ok && data.url) {
          STATE.media.unshift({
            id: data.id,
            url: data.url,
            filename: file.name,
            created: Date.now()
          });
          resolve(data.url);
          return;
        }
      } catch (err) {
        console.warn('Tải ảnh qua API thất bại, lưu vào danh sách nội bộ:', err);
      }

      // Fallback lưu trực tiếp
      const fallbackId = 'img_' + Date.now();
      STATE.media.unshift({
        id: fallbackId,
        url: optimizedDataUrl,
        filename: file.name,
        created: Date.now()
      });
      resolve(optimizedDataUrl);
    };
    reader.readAsDataURL(file);
  });
}

function resizeImageIfNeeded(dataUrl, maxDim = 1200) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width <= maxDim && height <= maxDim) {
        resolve(dataUrl);
        return;
      }
      if (width > height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/webp', 0.88));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function renderMediaGrid() {
  const grid = document.getElementById('mediaGrid');
  const countTxt = document.getElementById('mediaCountText');
  if (!grid) return;

  countTxt.textContent = STATE.media.length;

  if (STATE.media.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--admin-ink-soft);background:#fff;border-radius:14px;border:1px dashed var(--admin-line)">
        Chưa có hình ảnh nào được tải lên. Hãy kéo thả ảnh hoặc bấm nút "Chọn ảnh từ máy tính" ở trên!
      </div>
    `;
    return;
  }

  grid.innerHTML = STATE.media.map(m => `
    <div class="admin-media-item">
      <img src="${m.url}" alt="${m.filename}">
      <div class="admin-media-meta">
        <div class="admin-media-name" title="${m.filename}">${m.filename}</div>
        <div class="admin-media-actions">
          <button type="button" class="admin-btn admin-btn--outline admin-btn--sm" style="flex:1;padding:4px" onclick="copyToClipboard('${m.url}')" title="Sao chép link">📋 Link</button>
          <button type="button" class="admin-btn admin-btn--danger admin-btn--sm" style="padding:4px 8px" onclick="deleteMedia('${m.id}')" title="Xóa ảnh">🗑️</button>
        </div>
      </div>
    </div>
  `).join('');
}

window.deleteMedia = async function(id) {
  if (!confirm('Bạn có chắc chắn muốn xóa ảnh này khỏi thư viện?')) return;
  STATE.media = STATE.media.filter(m => m.id !== id);
  try {
    await fetch(`/api/admin/images/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${STATE.token}` }
    });
  } catch (e) {}
  renderMediaGrid();
  updateDashboardStats();
  showToast('Đã xóa hình ảnh thành công');
};

window.copyToClipboard = function(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Đã sao chép link ảnh vào bộ nhớ tạm!');
  }).catch(() => {
    prompt('Link ảnh:', text);
  });
};

/* ==========================================================================
   Modal Chọn Ảnh từ Thư Viện (Image Picker)
   ========================================================================== */
// 'gallery' = chọn nhiều ảnh thêm vào bộ ảnh; còn lại = chọn 1 ảnh cho ô input
window.pickImageFor = function(inputElOrId) {
  const multi = inputElOrId === 'gallery';
  STATE.targetImgInput = multi ? null : (typeof inputElOrId === 'string' ? document.getElementById(inputElOrId) : inputElOrId);
  STATE.pickerSelected = multi ? new Set() : null;

  // shortcut: ảnh studio đoán theo mẫu prod-XX-1/-2, ảnh không tồn tại sẽ tự ẩn (onerror)
  const builtIn = Array.from({ length: 30 }, (_, i) => {
    const num = String(i + 1).padStart(2, '0');
    return [
      { url: `assets/img/cut/prod-${num}-cut`, name: `SP ${num} · Tách nền 3D` },
      { url: `assets/img/studio/prod-${num}-1`, name: `SP ${num} · Studio 1` },
      { url: `assets/img/studio/prod-${num}-2`, name: `SP ${num} · Studio 2` },
    ];
  }).flat();

  // Ảnh của sản phẩm đang sửa lên đầu
  const editId = document.getElementById('prodEditId').value;
  const own = editId ? `prod-${editId}-` : null;
  const all = [
    ...STATE.media.map(m => ({ url: m.url, name: m.filename || 'Ảnh tải lên' })),
    ...builtIn,
  ];
  STATE.pickerImages = own ? [...all.filter(m => m.url.includes(own)), ...all.filter(m => !m.url.includes(own))] : all;

  const inGallery = new Set(STATE.gallery);
  document.getElementById('pickerMediaGrid').innerHTML = STATE.pickerImages.map((img, i) => `
    <div class="admin-media-item picker-item ${multi && inGallery.has(img.url) ? 'is-used' : ''}" data-name="${img.name.toLowerCase()}" onclick="selectPickedImage(${i}, this)">
      <img src="${resolveImg(img.url, 400)}" alt="${img.name}" loading="lazy" onerror="this.closest('.picker-item').remove()">
      <div class="admin-media-meta">
        <div class="admin-media-name">${own && img.url.includes(own) ? '★ ' : ''}${img.name}</div>
      </div>
    </div>
  `).join('');

  document.getElementById('pickerSearch').value = '';
  document.getElementById('pickerFoot').hidden = !multi;
  updatePickerBtn();
  document.getElementById('imagePickerModal').classList.add('is-open');
};

function updatePickerBtn() {
  const n = STATE.pickerSelected?.size || 0;
  const btn = document.getElementById('pickerAddBtn');
  btn.textContent = n ? `Thêm ${n} ảnh đã chọn` : 'Chọn ảnh để thêm';
  btn.disabled = !n;
}

document.getElementById('pickerSearch')?.addEventListener('input', e => {
  const q = e.target.value.toLowerCase().trim();
  document.querySelectorAll('#pickerMediaGrid .picker-item').forEach(el => {
    el.hidden = q && !el.dataset.name.includes(q);
  });
});

window.closeImagePicker = function() {
  document.getElementById('imagePickerModal').classList.remove('is-open');
};

window.selectPickedImage = function(i, el) {
  const url = STATE.pickerImages[i]?.url;
  if (!url) return;
  if (STATE.pickerSelected) {
    if (el.classList.contains('is-used')) return showToast('Ảnh này đã có trong bộ ảnh.');
    STATE.pickerSelected.has(url) ? STATE.pickerSelected.delete(url) : STATE.pickerSelected.add(url);
    el.classList.toggle('is-picked', STATE.pickerSelected.has(url));
    updatePickerBtn();
    return;
  }
  if (STATE.targetImgInput) {
    STATE.targetImgInput.value = url;
    STATE.targetImgInput.dispatchEvent(new Event('input'));
  }
  closeImagePicker();
  showToast('Đã chọn hình ảnh!');
};

window.confirmPickedImages = function() {
  const picked = [...(STATE.pickerSelected || [])];
  STATE.gallery.push(...picked);
  renderGalleryList();
  closeImagePicker();
  showToast(`Đã thêm ${picked.length} ảnh vào bộ ảnh sản phẩm!`);
};

/* ==========================================================================
   Tab 4: Quản lý Nội dung Website (Site Content)
   ========================================================================== */
function populateContentForm() {
  const s = STATE.site || {};
  const c = STATE.content || {};

  // Thông tin liên hệ
  setVal('cfg_brand', s.brand || 'GOLDEN PHARMA');
  setVal('cfg_company', s.company || 'Công Ty Cổ Phần Quốc Tế Thú Y Vàng');
  setVal('cfg_phone', s.phone || '0968 486 985');
  setVal('cfg_email', s.email || 'goldenvet10@gmail.com');
  setVal('cfg_tiktok', s.tiktok || 'https://www.tiktok.com/@thuyvanghanoi');
  setVal('cfg_tiktokHandle', s.tiktokHandle || '@thuyvanghanoi');
  setVal('cfg_shopee', s.shopee || 'https://vn.shp.ee/ghozM3PF');
  setVal('cfg_zalo', s.zalo || 'https://zalo.me/0968486985');
  setVal('cfg_address', s.address || 'Tầng 4, lô 30-31 Liền kề 2, khu đô thị Đại Thanh, Xã Đại Thanh, TP Hà Nội');
  setVal('cfg_mapEmbed', s.mapEmbed || 'https://www.google.com/maps?q=Khu+do+thi+Dai+Thanh+Ha+Noi&output=embed');

  // Hero banner & thống kê
  setVal('cfg_heroEyebrow', c.heroEyebrow || 'Công Ty Cổ Phần Quốc Tế Thú Y Vàng · Chuẩn GMP-WHO');
  setVal('cfg_heroTitle', c.heroTitle || 'Dược phẩm & chế phẩm sinh học <em>vì sức khỏe vật nuôi</em>');
  setVal('cfg_heroDesc', c.heroDesc || 'Trọn bộ 30 dòng men vi sinh sống, vitamin khoáng đậm đặc, thảo dược giải độc và kháng sinh đặc trị chính hãng Golden Pharma...');
  setVal('cfg_heroSearchPh', c.heroSearchPh || 'Tìm tên thuốc, công dụng (vd: GP-Guard, hen khẹc, vỗ béo, tiêu chảy)...');
  setVal('cfg_heroM1Value', c.heroM1Value || '68.500+');
  setVal('cfg_heroM1Label', c.heroM1Label || 'Đơn hàng trên TikTok Shop');
  setVal('cfg_heroM2Value', c.heroM2Value || '30 dòng');
  setVal('cfg_heroM2Label', c.heroM2Label || 'Sản phẩm chủ lực chính hãng');
  setVal('cfg_heroM3Value', c.heroM3Value || '4.7 ★');
  setVal('cfg_heroM3Label', c.heroM3Label || 'Đánh giá thực tế từ nhà chăn nuôi');

  // Tiêu đề phân đoạn
  setVal('cfg_secCatTitle', c.secCatTitle || 'Giải pháp theo nhóm công dụng & vật nuôi');
  setVal('cfg_secSpotTitle', c.secSpotTitle || 'Top chế phẩm dẫn đầu doanh số của Golden Pharma');
  setVal('cfg_secBestTitle', c.secBestTitle || 'Danh mục sản phẩm nổi bật');
  setVal('cfg_secTrustTitle', c.secTrustTitle || 'Vì sao trang trại & đại lý chọn Golden Pharma?');
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

document.getElementById('siteContentForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const newSite = {
    ...STATE.site,
    brand: document.getElementById('cfg_brand').value.trim(),
    company: document.getElementById('cfg_company').value.trim(),
    phone: document.getElementById('cfg_phone').value.trim(),
    phoneRaw: document.getElementById('cfg_phone').value.replace(/\D/g, ''),
    phoneHref: `tel:${document.getElementById('cfg_phone').value.replace(/\D/g, '')}`,
    email: document.getElementById('cfg_email').value.trim(),
    tiktok: document.getElementById('cfg_tiktok').value.trim(),
    tiktokHandle: document.getElementById('cfg_tiktokHandle').value.trim(),
    shopee: document.getElementById('cfg_shopee').value.trim(),
    zalo: document.getElementById('cfg_zalo').value.trim(),
    address: document.getElementById('cfg_address').value.trim(),
    mapEmbed: document.getElementById('cfg_mapEmbed').value.trim(),
  };

  const newContent = {
    ...STATE.content,
    heroEyebrow: document.getElementById('cfg_heroEyebrow').value.trim(),
    heroTitle: document.getElementById('cfg_heroTitle').value.trim(),
    heroDesc: document.getElementById('cfg_heroDesc').value.trim(),
    heroSearchPh: document.getElementById('cfg_heroSearchPh').value.trim(),
    heroM1Value: document.getElementById('cfg_heroM1Value').value.trim(),
    heroM1Label: document.getElementById('cfg_heroM1Label').value.trim(),
    heroM2Value: document.getElementById('cfg_heroM2Value').value.trim(),
    heroM2Label: document.getElementById('cfg_heroM2Label').value.trim(),
    heroM3Value: document.getElementById('cfg_heroM3Value').value.trim(),
    heroM3Label: document.getElementById('cfg_heroM3Label').value.trim(),
    secCatTitle: document.getElementById('cfg_secCatTitle').value.trim(),
    secSpotTitle: document.getElementById('cfg_secSpotTitle').value.trim(),
    secBestTitle: document.getElementById('cfg_secBestTitle').value.trim(),
    secTrustTitle: document.getElementById('cfg_secTrustTitle').value.trim(),
  };

  STATE.site = newSite;
  STATE.content = newContent;

  try {
    const res = await fetch('/api/admin/content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${STATE.token}`,
      },
      body: JSON.stringify({ site: newSite, content: newContent })
    });
    if (res.ok) {
      showToast('Đã lưu nội dung website lên hệ thống máy chủ Cloudflare!');
      return;
    }
  } catch (err) {
    console.warn('Lỗi khi gửi nội dung qua API:', err);
  }

  localStorage.setItem('gp_custom_site', JSON.stringify(newSite));
  localStorage.setItem('gp_custom_content', JSON.stringify(newContent));
  showToast('Đã lưu nội dung thành công!');
});

/* ==========================================================================
   Tab 5: Cài đặt & Sao lưu
   ========================================================================== */
document.getElementById('changePasswordForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const cur = document.getElementById('pwdCurrent').value.trim();
  const n1 = document.getElementById('pwdNew').value.trim();
  const n2 = document.getElementById('pwdConfirm').value.trim();

  if (n1 !== n2) {
    alert('Mật khẩu mới và mật khẩu xác nhận không trùng khớp!');
    return;
  }

  try {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${STATE.token}`,
      },
      body: JSON.stringify({ currentPassword: cur, newPassword: n1 })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast('Đổi mật khẩu thành công!');
      document.getElementById('changePasswordForm').reset();
    } else {
      alert(data.error || 'Đổi mật khẩu thất bại!');
    }
  } catch (err) {
    alert('Lỗi kết nối khi đổi mật khẩu.');
  }
});

// Xuất file JSON
document.getElementById('exportDataBtn')?.addEventListener('click', () => {
  const exportData = {
    products: STATE.products,
    categories: STATE.categories,
    animals: STATE.animals,
    site: STATE.site,
    content: STATE.content,
    media: STATE.media,
    exportedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `golden-pharma-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  showToast('Đã xuất file dữ liệu sao lưu thành công!');
});

// Nhập file JSON
document.getElementById('importDataInput')?.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (event) => {
    try {
      const imported = JSON.parse(event.target.result);
      if (imported.products && Array.isArray(imported.products)) {
        STATE.products = imported.products;
        if (imported.site) STATE.site = imported.site;
        if (imported.content) STATE.content = imported.content;
        if (imported.categories) STATE.categories = imported.categories;

        // Lưu lên server
        await fetch('/api/admin/content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${STATE.token}`,
          },
          body: JSON.stringify({ site: STATE.site, content: STATE.content })
        });

        renderProductsTable();
        updateDashboardStats();
        populateContentForm();
        showToast('Nhập dữ liệu thành công!');
      } else {
        alert('Tệp JSON không đúng cấu trúc sản phẩm của Golden Pharma!');
      }
    } catch (err) {
      alert('Không thể đọc tệp JSON: ' + err.message);
    }
  };
  reader.readAsText(file);
});

// Khôi phục dữ liệu gốc
document.getElementById('resetDefaultBtn')?.addEventListener('click', async () => {
  if (confirm('CẢNH BÁO: Bạn có chắc chắn muốn khôi phục lại dữ liệu mặc định (30 sản phẩm gốc & nội dung chuẩn)? Toàn bộ sản phẩm tạo thêm sẽ bị xóa.')) {
    try {
      await fetch('/api/admin/reset', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${STATE.token}` }
      });
      showToast('Đã khôi phục dữ liệu gốc ban đầu thành công!');
      setTimeout(() => location.reload(), 800);
    } catch (e) {
      alert('Lỗi khôi phục dữ liệu.');
    }
  }
});

/* ==========================================================================
   Khởi động trang Admin
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initMediaUpload();
  initAuth();
});
