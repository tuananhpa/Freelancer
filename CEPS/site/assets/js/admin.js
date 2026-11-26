/**
 * CPES Admin Panel JavaScript (Full CMS & Cart/Order Management)
 * Quản trị CRUD toàn bộ sản phẩm s::can & ATi, upload ảnh, quản lý giỏ hàng & báo giá
 */

document.addEventListener('DOMContentLoaded', () => {
  initAdmin();
});

let adminProducts = [];
let adminQuotes = [];
let currentBrandFilter = 'all';
let currentSearchQuery = '';
const CPES_STORAGE_KEY_QUOTES = window.CPES_STORAGE_KEY_QUOTES || 'cpes_quote_requests_v2';

async function initAdmin() {
  const loginSection = document.querySelector('#adminLoginSection');
  const dashboardSection = document.querySelector('#adminDashboardSection');
  if (!loginSection || !dashboardSection) return;

  const authKey = 'cpes_admin_auth';

  const checkAuth = () => {
    return sessionStorage.getItem(authKey) === 'true';
  };

  const updateUI = () => {
    if (checkAuth()) {
      loginSection.style.display = 'none';
      dashboardSection.style.display = 'flex';
      loadDashboardData();
    } else {
      loginSection.style.display = 'grid';
      dashboardSection.style.display = 'none';
    }
  };

  // Login
  document.querySelector('#adminLoginForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const pass = document.querySelector('#adminPasswordInput').value;
    if (pass === 'cpes2026' || pass === 'admin') {
      sessionStorage.setItem(authKey, 'true');
      updateUI();
    } else {
      alert('Mật khẩu không đúng! Vui lòng nhập "cpes2026" hoặc "admin".');
    }
  });

  // Logout
  document.querySelector('#adminLogoutBtn')?.addEventListener('click', () => {
    sessionStorage.removeItem(authKey);
    updateUI();
  });

  // Switch tabs
  const navBtns = document.querySelectorAll('.admin-nav-btn');
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const target = btn.dataset.tab;
      document.querySelectorAll('.admin-tab-pane').forEach(p => p.style.display = 'none');
      const pane = document.querySelector(`#tab-${target}`);
      if (pane) pane.style.display = 'block';
    });
  });

  // Init Product Form Modals
  initProductModalHandlers();
  initOrderHandlers();
  initCompanySettingsHandlers();
  initBackupHandlers();

  updateUI();
}

async function loadDashboardData() {
  adminProducts = await CPES_API.getProducts();
  adminQuotes = CPES_API.getQuotes();

  // Update counts
  updateStatCounters();

  renderProductTable();
  renderQuoteTable();
  loadCompanySettings();
}

function updateStatCounters() {
  document.querySelector('#statProductCount').textContent = adminProducts.length;
  document.querySelector('#statQuoteCount').textContent = adminQuotes.length;

  const scanCount = adminProducts.filter(p => p.brand === 's::can').length;
  const atiCount = adminProducts.filter(p => p.brand === 'ATi').length;

  const cAll = document.querySelector('#countAllProd');
  const cScan = document.querySelector('#countScanProd');
  const cAti = document.querySelector('#countAtiProd');

  if (cAll) cAll.textContent = adminProducts.length;
  if (cScan) cScan.textContent = scanCount;
  if (cAti) cAti.textContent = atiCount;
}

/* =========================================================
   1. QUẢN LÝ SẢN PHẨM (CRUD & UPLOAD ẢNH)
   ========================================================= */
function renderProductTable() {
  const tbody = document.querySelector('#adminProductTbody');
  if (!tbody) return;

  const q = currentSearchQuery.toLowerCase().trim();
  const filtered = adminProducts.filter(p => {
    if (currentBrandFilter !== 'all' && p.brand !== currentBrandFilter) return false;
    if (q) {
      const txt = `${p.name} ${p.name_vi} ${p.parameters || ''} ${p.category || ''}`.toLowerCase();
      if (!txt.includes(q)) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--muted); padding: 30px;">Không tìm thấy sản phẩm nào phù hợp.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map((p, idx) => {
    const brandClass = p.brand === 'ATi' ? 'background:#fef3c7; color:#92400e;' : 'background:#dbeafe; color:#1e40af;';
    const imgSrc = p.local_image || p.image_url || 'assets/img/brand/logo-cpes-doc.webp';

    return `
      <tr>
        <td>${idx + 1}</td>
        <td>
          <img src="${imgSrc}" alt="${p.name}" style="width: 48px; height: 48px; object-fit: contain; background: #fff; border-radius: 6px; border: 1px solid var(--line);">
        </td>
        <td>
          <strong>${p.name}</strong><br>
          <span style="font-size: 0.82rem; color: var(--muted);">${p.name_vi || ''}</span>
        </td>
        <td>
          <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.76rem; font-weight: 700; ${brandClass}">
            ${p.brand || 'Khác'}
          </span>
        </td>
        <td style="font-size: 0.85rem;">${p.category || '—'}</td>
        <td style="max-width: 220px; font-size: 0.82rem; color: var(--ink-2);">${p.parameters || '—'}</td>
        <td style="text-align: center;">
          <div style="display: flex; gap: 6px; justify-content: center;">
            <button type="button" class="btn btn-sm btn-ghost btn-edit-prod" data-id="${p.id}" title="Chỉnh sửa">
              <i class="fas fa-edit"></i> Sửa
            </button>
            <button type="button" class="btn btn-sm btn-ghost btn-del-prod" data-id="${p.id}" style="color: #c0392b; border-color: #fadbd8;" title="Xóa">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Event Edit
  tbody.querySelectorAll('.btn-edit-prod').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const prod = adminProducts.find(x => String(x.id) === String(id));
      if (prod) openEditProductModal(prod);
    });
  });

  // Event Delete
  tbody.querySelectorAll('.btn-del-prod').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const prod = adminProducts.find(x => String(x.id) === String(id));
      if (!prod) return;
      if (confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${prod.name}" không? Thao tác này sẽ cập nhật ngay vào cơ sở dữ liệu.`)) {
        adminProducts = adminProducts.filter(x => String(x.id) !== String(id));
        CPES_API.saveProducts(adminProducts);
        updateStatCounters();
        renderProductTable();
      }
    });
  });
}

function initProductModalHandlers() {
  const modal = document.querySelector('#adminProductModal');
  const addBtn = document.querySelector('#btnOpenAddProductModal');
  const closeBtn = document.querySelector('#btnCloseProductModal');
  const cancelBtn = document.querySelector('#btnCancelProductModal');
  const fileInput = document.querySelector('#prodFormFileInput');
  const previewBox = document.querySelector('#imgUploadPreview');
  const imageInput = document.querySelector('#prodFormImage');
  const form = document.querySelector('#adminProductForm');

  // Open Add modal
  addBtn?.addEventListener('click', () => {
    form.reset();
    document.querySelector('#prodFormId').value = '';
    document.querySelector('#adminModalTitle').textContent = 'Thêm Sản Phẩm Mới';
    previewBox.innerHTML = '<span style="font-size:0.72rem; color:var(--muted); text-align:center;">Chưa chọn ảnh</span>';
    modal.classList.add('is-open');
  });

  const closeModal = () => modal.classList.remove('is-open');
  closeBtn?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);

  // File upload preview using FileReader
  fileInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target.result;
        imageInput.value = base64;
        previewBox.innerHTML = `<img src="${base64}" alt="Preview">`;
      };
      reader.readAsDataURL(file);
    }
  });

  // Image URL input preview
  imageInput?.addEventListener('input', () => {
    const val = imageInput.value.trim();
    if (val) {
      previewBox.innerHTML = `<img src="${val}" alt="Preview" onerror="this.src='assets/img/brand/logo-cpes-doc.webp'">`;
    }
  });

  // Save / Update form
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const idVal = document.querySelector('#prodFormId').value;
    const name = document.querySelector('#prodFormName').value.trim();
    const name_vi = document.querySelector('#prodFormNameVi').value.trim();
    const brand = document.querySelector('#prodFormBrand').value;
    const category = document.querySelector('#prodFormCategory').value;
    const parameters = document.querySelector('#prodFormParameters').value.trim();
    const description_vi = document.querySelector('#prodFormDescVi').value.trim();
    const local_image = imageInput.value.trim() || 'assets/img/brand/logo-cpes-doc.webp';

    if (idVal) {
      // Edit
      const idx = adminProducts.findIndex(x => String(x.id) === String(idVal));
      if (idx !== -1) {
        adminProducts[idx] = {
          ...adminProducts[idx],
          name,
          name_vi,
          brand,
          category,
          parameters,
          description_vi,
          local_image,
          image_url: local_image
        };
        alert(`Đã cập nhật sản phẩm "${name}" thành công!`);
      }
    } else {
      // Add new
      const newId = Date.now();
      const newProd = {
        id: newId,
        name,
        name_vi,
        brand,
        category,
        category_slug: category.toLowerCase().includes('quang') ? 'spectrometer' : 'sensor',
        parameters,
        description_vi,
        highlights_vi: [parameters, 'Sản phẩm chính hãng cung cấp bởi CPES'],
        markets_vi: ['Nước cấp sinh hoạt', 'Xử lý nước thải', 'Công nghiệp'],
        local_image,
        image_url: local_image,
        original_url: '#'
      };
      adminProducts.unshift(newProd);
      alert(`Đã thêm sản phẩm "${name}" thành công!`);
    }

    CPES_API.saveProducts(adminProducts);
    closeModal();
    updateStatCounters();
    renderProductTable();
  });

  // Search & Brand Filter
  document.querySelector('#adminProductSearch')?.addEventListener('input', (e) => {
    currentSearchQuery = e.target.value;
    renderProductTable();
  });

  document.querySelectorAll('.admin-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.admin-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentBrandFilter = btn.dataset.brand;
      renderProductTable();
    });
  });
}

function openEditProductModal(prod) {
  const modal = document.querySelector('#adminProductModal');
  const previewBox = document.querySelector('#imgUploadPreview');
  const imageInput = document.querySelector('#prodFormImage');

  document.querySelector('#prodFormId').value = prod.id;
  document.querySelector('#adminModalTitle').textContent = `Chỉnh Sửa Sản Phẩm: ${prod.name}`;
  document.querySelector('#prodFormName').value = prod.name;
  document.querySelector('#prodFormNameVi').value = prod.name_vi || '';
  document.querySelector('#prodFormBrand').value = prod.brand || 's::can';
  document.querySelector('#prodFormCategory').value = prod.category || 'Đầu dò quang phổ';
  document.querySelector('#prodFormParameters').value = prod.parameters || '';
  document.querySelector('#prodFormDescVi').value = prod.description_vi || '';

  const imgSrc = prod.local_image || prod.image_url || '';
  imageInput.value = imgSrc;
  if (imgSrc) {
    previewBox.innerHTML = `<img src="${imgSrc}" alt="Preview">`;
  } else {
    previewBox.innerHTML = '<span style="font-size:0.72rem; color:var(--muted); text-align:center;">Chưa có ảnh</span>';
  }

  modal.classList.add('is-open');
}

/* =========================================================
   2. QUẢN LÝ GIỎ HÀNG & YÊU CẦU BÁO GIÁ (ORDERS & CART)
   ========================================================= */
function renderQuoteTable() {
  const tbody = document.querySelector('#adminQuoteTbody');
  if (!tbody) return;

  if (adminQuotes.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--muted); padding: 30px;">Chưa có yêu cầu báo giá hoặc đơn hàng nào từ website.</td></tr>`;
    return;
  }

  tbody.innerHTML = adminQuotes.map((q, idx) => {
    const status = q.status || 'new';
    let statusBadge = '<span class="order-status-badge status-new">Mới tiếp nhận</span>';
    if (status === 'processing') statusBadge = '<span class="order-status-badge status-processing">Đang xử lý</span>';
    else if (status === 'quoted') statusBadge = '<span class="order-status-badge status-quoted">Đã báo giá</span>';
    else if (status === 'completed') statusBadge = '<span class="order-status-badge status-completed">Hoàn tất</span>';
    else if (status === 'cancelled') statusBadge = '<span class="order-status-badge status-cancelled">Đã hủy</span>';

    return `
      <tr>
        <td>${idx + 1}</td>
        <td><strong>${q.id || 'REQ-' + (idx+1)}</strong></td>
        <td>
          <strong>${q.product || 'Yêu cầu tư vấn'}</strong>
          ${q.notes ? `<div style="font-size: 0.8rem; color: var(--muted);">${q.notes}</div>` : ''}
        </td>
        <td>
          <strong>${q.name}</strong><br>
          <span style="font-size: 0.82rem; color: var(--muted);">${q.company || 'Cá nhân'}</span>
        </td>
        <td>
          <a href="tel:${q.phone}" style="color: var(--brand); font-weight: 600;">${q.phone}</a><br>
          <span style="font-size: 0.82rem; color: var(--muted);">${q.email}</span>
        </td>
        <td>
          <select class="form-control admin-status-select" data-id="${q.id}" style="font-size: 0.78rem; padding: 4px 8px; height: auto;">
            <option value="new" ${status === 'new' ? 'selected' : ''}>Mới tiếp nhận</option>
            <option value="processing" ${status === 'processing' ? 'selected' : ''}>Đang xử lý</option>
            <option value="quoted" ${status === 'quoted' ? 'selected' : ''}>Đã gửi báo giá</option>
            <option value="completed" ${status === 'completed' ? 'selected' : ''}>Hoàn tất</option>
            <option value="cancelled" ${status === 'cancelled' ? 'selected' : ''}>Hủy bỏ</option>
          </select>
        </td>
        <td style="text-align: center;">
          <div style="display: flex; gap: 6px; justify-content: center;">
            <button type="button" class="btn btn-sm btn-ghost btn-view-quote" data-id="${q.id}" title="Xem chi tiết giỏ hàng">
              <i class="fas fa-eye"></i>
            </button>
            <button type="button" class="btn btn-sm btn-ghost btn-del-quote" data-id="${q.id}" style="color: #c0392b; border-color: #fadbd8;" title="Xóa">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Status Change
  tbody.querySelectorAll('.admin-status-select').forEach(select => {
    select.addEventListener('change', (e) => {
      const id = e.target.dataset.id;
      const quote = adminQuotes.find(x => x.id === id);
      if (quote) {
        quote.status = e.target.value;
        localStorage.setItem(CPES_STORAGE_KEY_QUOTES, JSON.stringify(adminQuotes));
        alert(`Đã cập nhật trạng thái đơn ${id}!`);
      }
    });
  });

  // View Details
  tbody.querySelectorAll('.btn-view-quote').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const quote = adminQuotes.find(x => x.id === id);
      if (quote) openOrderDetailModal(quote);
    });
  });

  // Delete
  tbody.querySelectorAll('.btn-del-quote').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      if (confirm('Bạn có chắc muốn xóa yêu cầu báo giá này không?')) {
        adminQuotes = adminQuotes.filter(x => x.id !== id);
        localStorage.setItem(CPES_STORAGE_KEY_QUOTES, JSON.stringify(adminQuotes));
        updateStatCounters();
        renderQuoteTable();
      }
    });
  });
}

function initOrderHandlers() {
  // Modal order detail close
  const orderModal = document.querySelector('#adminOrderDetailModal');
  document.querySelector('#btnCloseOrderModal')?.addEventListener('click', () => {
    orderModal.classList.remove('is-open');
  });

  // Tạo đơn thủ công
  document.querySelector('#btnCreateManualQuote')?.addEventListener('click', () => {
    const prod = prompt('Nhập tên thiết bị hoặc nhu cầu khách hàng:');
    if (!prod) return;
    const name = prompt('Nhập họ tên khách hàng:');
    if (!name) return;
    const phone = prompt('Nhập số điện thoại:');
    const email = prompt('Nhập email:');
    const company = prompt('Nhập tên đơn vị/công ty:');

    const newQuote = {
      id: 'ORD-' + Date.now().toString(36).toUpperCase(),
      createdAt: new Date().toISOString(),
      product: prod,
      name: name,
      phone: phone || '',
      email: email || '',
      company: company || '',
      status: 'processing',
      notes: 'Đơn tiếp nhận thủ công qua điện thoại'
    };

    adminQuotes.unshift(newQuote);
    localStorage.setItem(CPES_STORAGE_KEY_QUOTES, JSON.stringify(adminQuotes));
    updateStatCounters();
    renderQuoteTable();
    alert('Đã thêm đơn hàng báo giá thành công!');
  });

  // Export CSV
  document.querySelector('#btnExportQuotesCSV')?.addEventListener('click', () => {
    if (adminQuotes.length === 0) {
      alert('Chưa có dữ liệu giỏ hàng để xuất!');
      return;
    }
    let csvContent = 'Mã đơn,Thời gian,Sản phẩm,Khách hàng,Số điện thoại,Email,Công ty,Trạng thái,Ghi chú\n';
    adminQuotes.forEach(q => {
      csvContent += `"${q.id}","${q.createdAt}","${q.product}","${q.name}","${q.phone}","${q.email}","${q.company || ''}","${q.status || 'new'}","${q.notes || ''}"\n`;
    });

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cpes-gio-hang-bao-gia-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  });
}

function openOrderDetailModal(quote) {
  const modal = document.querySelector('#adminOrderDetailModal');
  const box = document.querySelector('#orderModalContent');

  box.innerHTML = `
    <div style="background: var(--bg-alt); padding: 14px 18px; border-radius: 8px; margin-bottom: 16px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
        <span style="font-weight: 700; color: var(--brand-dark);">Mã đơn: ${quote.id}</span>
        <span style="font-size: 0.85rem; color: var(--muted);">${new Date(quote.createdAt).toLocaleString('vi-VN')}</span>
      </div>
      <div style="font-size: 1.1rem; font-weight: 700; color: var(--brand);">${quote.product}</div>
    </div>

    <table style="width: 100%; font-size: 0.92rem; border-collapse: collapse; margin-bottom: 16px;">
      <tr><td style="padding: 6px 0; color: var(--muted); width: 35%;">Người liên hệ:</td><td style="font-weight: 600;">${quote.name}</td></tr>
      <tr><td style="padding: 6px 0; color: var(--muted);">Số điện thoại:</td><td><a href="tel:${quote.phone}" style="color:var(--brand);font-weight:600;">${quote.phone}</a></td></tr>
      <tr><td style="padding: 6px 0; color: var(--muted);">Email:</td><td><a href="mailto:${quote.email}">${quote.email}</a></td></tr>
      <tr><td style="padding: 6px 0; color: var(--muted);">Đơn vị / Doanh nghiệp:</td><td>${quote.company || '—'}</td></tr>
      <tr><td style="padding: 6px 0; color: var(--muted);">Ghi chú kỹ thuật:</td><td style="color:var(--ink-2);">${quote.notes || 'Không có ghi chú thêm'}</td></tr>
    </table>

    <div style="display: flex; justify-content: flex-end; gap: 10px; padding-top: 14px; border-top: 1px solid var(--line);">
      <a href="tel:${quote.phone}" class="btn btn-sm btn-primary"><i class="fas fa-phone-alt"></i> Gọi điện ngay</a>
      <a href="mailto:${quote.email}?subject=CPES Báo giá ${encodeURIComponent(quote.product)}" class="btn btn-sm btn-ghost"><i class="fas fa-envelope"></i> Gửi email báo giá</a>
    </div>
  `;

  modal.classList.add('is-open');
}

/* =========================================================
   3. CẤU HÌNH THÔNG TIN DOANH NGHIỆP
   ========================================================= */
const CPES_SETTINGS_KEY = 'cpes_company_settings';

function loadCompanySettings() {
  const defaultSettings = {
    company_name: 'CÔNG TY TNHH GIẢI PHÁP CPE',
    hotline: '(+84) 942 537 025',
    email: 'Sales@cpes.vn',
    address: '490 Phạm Thái Bường, Tân Phong, Q.7, TP.HCM',
    pillar_c: 'Cam kết chất lượng đỉnh cao từ Châu Âu/Mỹ & Tư vấn chân thành đúng nhu cầu kỹ thuật.',
    pillar_p: 'Đổi mới công nghệ liên tục & Giải pháp tối ưu theo ngân sách và quy mô thực tế.',
    pillar_e: 'Tối ưu hóa chi phí vận hành O&M & Đồng hành chuyển giao, hiệu chuẩn dài lâu.',
    pillar_s: 'Bảo vệ nguồn nước bền vững & Đảm bảo sự hài lòng tuyệt đối của đối tác.'
  };

  const saved = JSON.parse(localStorage.getItem(CPES_SETTINGS_KEY) || JSON.stringify(defaultSettings));

  document.querySelector('#cfgCompanyName').value = saved.company_name;
  document.querySelector('#cfgHotline').value = saved.hotline;
  document.querySelector('#cfgEmail').value = saved.email;
  document.querySelector('#cfgAddress').value = saved.address;
  document.querySelector('#cfgPillarC').value = saved.pillar_c;
  document.querySelector('#cfgPillarP').value = saved.pillar_p;
  document.querySelector('#cfgPillarE').value = saved.pillar_e;
  document.querySelector('#cfgPillarS').value = saved.pillar_s;
}

function initCompanySettingsHandlers() {
  document.querySelector('#adminCompanySettingsForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const settings = {
      company_name: document.querySelector('#cfgCompanyName').value.trim(),
      hotline: document.querySelector('#cfgHotline').value.trim(),
      email: document.querySelector('#cfgEmail').value.trim(),
      address: document.querySelector('#cfgAddress').value.trim(),
      pillar_c: document.querySelector('#cfgPillarC').value.trim(),
      pillar_p: document.querySelector('#cfgPillarP').value.trim(),
      pillar_e: document.querySelector('#cfgPillarE').value.trim(),
      pillar_s: document.querySelector('#cfgPillarS').value.trim()
    };

    localStorage.setItem(CPES_SETTINGS_KEY, JSON.stringify(settings));
    alert('Đã lưu cấu hình thông tin doanh nghiệp thành công! Toàn bộ website sẽ đồng bộ theo thông tin này.');
  });
}

/* =========================================================
   4. SAO LƯU & XUẤT JSON
   ========================================================= */
function initBackupHandlers() {
  // Export products JSON
  document.querySelector('#adminExportJsonBtn')?.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(adminProducts, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products-updated-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
  });

  // Reset to seed
  document.querySelector('#adminResetSeedBtn')?.addEventListener('click', async () => {
    if (confirm('Bạn có chắc chắn muốn đặt lại dữ liệu gốc từ máy chủ không? Mọi sản phẩm hoặc thông tin đã chỉnh sửa trong trình duyệt này sẽ được làm mới.')) {
      await CPES_API.resetToSeed();
      localStorage.removeItem(CPES_SETTINGS_KEY);
      alert('Đã khôi phục dữ liệu gốc thành công!');
      location.reload();
    }
  });
}
