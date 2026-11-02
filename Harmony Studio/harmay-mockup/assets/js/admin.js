/* ==========================================================================
   HARMONY.STUDIO — admin.js
   Hệ thống Quản trị Atelier, Mẫu Lookbook & Studio Tách Nền AI Tự Động
   Tài khoản mặc định: Admin | Mật khẩu: admin123@
   ========================================================================== */

const STATE = {
  token: localStorage.getItem('hm_admin_token') || '',
  looks: [],
  collections: [],
  niches: [],
  site: {},
  content: {},
  currentCutBlob: null,
  currentOriginalFile: null,
  currentCutUrl: '',
  currentPhotoUrl: '',
};

function resolveImg(path, size = 600) {
  if (!path) return 'assets/img/cut/look-00-600.webp';
  if (path.startsWith('data:') || path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:') || /\.(webp|png|jpe?g|gif|svg)$/i.test(path)) {
    return path;
  }
  return `${path}-${size}.webp`;
}

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
   1. XÁC THỰC & ĐĂNG NHẬP (AUTH)
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
      if (STATE.token.startsWith('hm_tok_') || STATE.token === 'hm_local_admin_token') {
        showAdminApp();
        loadAllData();
        return;
      }
    }
  }

  // Chưa đăng nhập -> hiện form
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
        localStorage.setItem('hm_admin_token', STATE.token);
        showAdminApp();
        loadAllData();
        showToast('Đăng nhập thành công! Chào mừng Admin Atelier.');
        return;
      } else {
        loginAlert.textContent = data.error || 'Tài khoản hoặc mật khẩu không chính xác!';
        loginAlert.style.display = 'block';
      }
    } catch (err) {
      if (user.toLowerCase() === 'admin' && pass === 'admin123@') {
        STATE.token = 'hm_local_admin_token';
        localStorage.setItem('hm_admin_token', STATE.token);
        showAdminApp();
        loadAllData();
        showToast('Đăng nhập quản trị thành công (chế độ dự phòng)!');
        return;
      }
      loginAlert.textContent = 'Lỗi kết nối máy chủ xác thực!';
      loginAlert.style.display = 'block';
    }
  });

  // Nút đăng xuất
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      if (!confirm('Bạn có chắc chắn muốn đăng xuất khỏi trang quản trị?')) return;
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${STATE.token}` }
        });
      } catch (e) {}
      localStorage.removeItem('hm_admin_token');
      STATE.token = '';
      location.reload();
    });
  }

  // Đổi mật khẩu
  const changePasswordForm = document.getElementById('changePasswordForm');
  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const currentPassword = document.getElementById('currPass').value;
      const newPassword = document.getElementById('newPass').value;
      const confirmPassword = document.getElementById('confirmPass').value;

      if (newPassword !== confirmPassword) {
        alert('Mật khẩu xác nhận không khớp với mật khẩu mới!');
        return;
      }

      try {
        const res = await fetch('/api/auth/change-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${STATE.token}`
          },
          body: JSON.stringify({ currentPassword, newPassword })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast('Đổi mật khẩu Admin thành công!');
          changePasswordForm.reset();
        } else {
          alert(data.error || 'Đổi mật khẩu thất bại!');
        }
      } catch (err) {
        alert('Lỗi kết nối máy chủ khi đổi mật khẩu!');
      }
    });
  }
}

function showAdminApp() {
  document.getElementById('loginOverlay').style.display = 'none';
  document.getElementById('adminApp').style.display = 'flex';
}

/* ==========================================================================
   2. TẢI VÀ ĐỒNG BỘ DỮ LIỆU
   ========================================================================== */
async function loadAllData() {
  if (window.HARMONY_DATA) {
    STATE.looks = window.HARMONY_DATA.looks || [];
    STATE.collections = window.HARMONY_DATA.collections || [];
    STATE.niches = window.HARMONY_DATA.niches || [];
  }

  if (!STATE.site || !STATE.site.brand) {
    STATE.site = {
      brand: 'HARMONY.STUDIO',
      season: 'Bộ sưu tập Thu Đông',
      phone: '0900 000 000',
      email: 'contact@harmony.studio',
      zalo: 'https://zalo.me',
      messenger: 'https://m.me',
      instagram: 'https://instagram.com',
      facebook: 'https://facebook.com',
      address: 'Studio tại Việt Nam',
      hours: 'Đón khách theo lịch hẹn',
      tagline: 'Thiết kế cho xưởng & may đo theo số đo riêng.'
    };
  }
  if (!STATE.content || !STATE.content.manifesto) {
    STATE.content = {
      manifesto: 'Từ bản rập cho xưởng đến chiếc đầm may đo riêng, Harmony giữ trọn độ đứng của vai, nét chiết ở eo và nhịp rủ của tà vải khi người mặc bước đi.',
      b2bTitle: 'Thuê thiết kế theo mùa cho xưởng',
      b2bDesc: 'Harmony nhận phát triển mẫu lẻ hoặc trọn bộ sưu tập theo ngách hàng của xưởng: đầm công sở, đầm dự tiệc, set phối và áo dài.',
      bespokeTitle: 'Đặt may riêng theo số đo',
      bespokeDesc: 'Chọn bất kỳ mẫu nào trong lookbook hoặc gửi ý tưởng riêng; Harmony dựng rập và căn chỉnh theo đúng số đo cơ thể của bạn.'
    };
  }

  try {
    const res = await fetch('/api/data');
    if (res.ok) {
      const data = await res.json();
      if (data.looks && data.looks.length) STATE.looks = data.looks;
      if (data.collections && data.collections.length) STATE.collections = data.collections;
      if (data.niches && data.niches.length) STATE.niches = data.niches;
      if (data.site) STATE.site = data.site;
      if (data.content) STATE.content = data.content;
    }
  } catch (err) {
    console.warn('Kh?ng t?i ???c API /api/data, d?ng d? li?u kh?i t?o');
  }

  renderDashboard();
  renderLooksTable();
  renderCollectionsAndNiches();
  renderContentForm();
  populateDropdowns();
}

/* ==========================================================================
   3. CHUYỂN TAB ĐIỀU HƯỚNG
   ========================================================================== */
function switchTab(tabId) {
  document.querySelectorAll('.admin-nav-item').forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.tab === tabId);
  });
  document.querySelectorAll('.admin-tab-pane').forEach(pane => {
    pane.classList.toggle('is-active', pane.id === `tab-${tabId}`);
  });

  const titles = {
    'dashboard': 'Tổng quan hệ thống',
    'looks': 'Quản lý Mẫu Thiết Kế (Lookbook)',
    'studio-ai': 'Studio Tách Nền Mẫu AI Tự Động',
    'collections': 'Quản lý Bộ Sưu Tập & Ngách Hàng',
    'content': 'Nội dung Website & Thông tin Liên hệ',
    'settings': 'Cài đặt Bảo mật & Dữ liệu',
  };
  const titleEl = document.getElementById('pageTitle');
  const breadcrumbEl = document.getElementById('pageBreadcrumb');
  if (titleEl) titleEl.textContent = titles[tabId] || 'Quản trị';
  if (breadcrumbEl) breadcrumbEl.textContent = `Harmony Studio / ${titles[tabId] || tabId}`;
}

window.switchTab = switchTab;

document.querySelectorAll('.admin-nav-item').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

/* ==========================================================================
   4. RENDER DASHBOARD
   ========================================================================== */
function renderDashboard() {
  const statLooks = document.getElementById('statTotalLooks');
  const statColls = document.getElementById('statTotalColls');
  const statNiches = document.getElementById('statTotalNiches');
  const navLookCount = document.getElementById('navLookCount');

  if (statLooks) statLooks.textContent = STATE.looks.length;
  if (navLookCount) navLookCount.textContent = STATE.looks.length;
  if (statColls) statColls.textContent = STATE.collections.length;
  if (statNiches) statNiches.textContent = STATE.niches.length;

  // Contact summary list
  const infoList = document.getElementById('dashInfoList');
  if (infoList && STATE.site) {
    infoList.innerHTML = `
      <div style="display:grid;grid-template-columns:auto 1fr;gap:8px 16px;font-size:13.5px">
        <span style="color:var(--admin-ink-soft)">Hotline:</span><b>${STATE.site.phone || '0900 000 000'}</b>
        <span style="color:var(--admin-ink-soft)">Email:</span><b>${STATE.site.email || 'contact@harmony.studio'}</b>
        <span style="color:var(--admin-ink-soft)">Studio:</span><b>${STATE.site.address || 'Studio tại Việt Nam'}</b>
        <span style="color:var(--admin-ink-soft)">Mùa chính:</span><b>${STATE.site.season || 'Bộ sưu tập Thu Đông'}</b>
      </div>
    `;
  }

  // Recent looks in dashboard
  const table = document.getElementById('dashLooksTable');
  if (table) {
    const recents = STATE.looks.slice(0, 6);
    table.innerHTML = recents.map(l => {
      const coll = STATE.collections.find(c => c.id === l.collection);
      const niche = STATE.niches.find(n => n.id === l.niche);
      return `
        <tr>
          <td><img class="admin-thumb admin-thumb--cut" src="${resolveImg(l.cut, 600)}" alt=""></td>
          <td><b>LOOK ${l.no || l.id}</b></td>
          <td><b>${l.name}</b></td>
          <td><span class="admin-badge" style="background:${coll?.tint || '#EBE8E2'};color:${coll?.ink || '#111'}">${coll?.name || l.collection}</span></td>
          <td>${niche?.name || l.niche}</td>
          <td>${l.color || '—'}</td>
          <td>
            <button type="button" class="admin-btn admin-btn--sm admin-btn--secondary" onclick="openEditLookModal('${l.id}')">Sửa</button>
          </td>
        </tr>
      `;
    }).join('');
  }
}

/* ==========================================================================
   5. QUẢN LÝ MẪU (LOOKS MANAGER)
   ========================================================================== */
function renderLooksTable() {
  const tbody = document.getElementById('looksTableBody');
  if (!tbody) return;

  const search = (document.getElementById('lookSearchInput')?.value || '').toLowerCase().trim();
  const filterColl = document.getElementById('filterCollSelect')?.value || '';
  const filterNiche = document.getElementById('filterNicheSelect')?.value || '';

  const filtered = STATE.looks.filter(l => {
    if (filterColl && l.collection !== filterColl) return false;
    if (filterNiche && l.niche !== filterNiche) return false;
    if (search) {
      const q = [l.name, l.no, l.id, l.color, (l.pieces || []).join(' ')].join(' ').toLowerCase();
      if (!q.includes(search)) return false;
    }
    return true;
  });

  tbody.innerHTML = filtered.map(l => {
    const coll = STATE.collections.find(c => c.id === l.collection);
    const niche = STATE.niches.find(n => n.id === l.niche);
    const piecesStr = (l.pieces || []).join(', ');
    return `
      <tr>
        <td><img class="admin-thumb admin-thumb--cut" src="${resolveImg(l.cut, 600)}" alt="Ảnh tách"></td>
        <td><img class="admin-thumb" src="${resolveImg(l.photo || l.cut, 400)}" alt="Ảnh gốc"></td>
        <td><b>LOOK ${l.no || l.id}</b></td>
        <td>
          <div style="font-weight:600">${l.name}</div>
          <div style="font-size:12px;color:var(--admin-ink-muted)">ID: ${l.id}</div>
        </td>
        <td><span class="admin-badge" style="background:${coll?.tint || '#EAE7E0'};color:${coll?.ink || '#111'}">${coll?.name || l.collection}</span></td>
        <td>${niche?.name || l.niche}</td>
        <td>${l.color || '—'}</td>
        <td style="max-width:240px;font-size:12.5px;color:var(--admin-ink-soft)" title="${piecesStr}">
          ${piecesStr.length > 50 ? piecesStr.slice(0, 50) + '...' : piecesStr || '—'}
        </td>
        <td style="text-align:right">
          <div style="display:inline-flex;gap:6px">
            <button type="button" class="admin-btn admin-btn--sm admin-btn--secondary" onclick="openEditLookModal('${l.id}')">Sửa</button>
            <button type="button" class="admin-btn admin-btn--sm admin-btn--danger" onclick="deleteLook('${l.id}')">Xóa</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

document.getElementById('lookSearchInput')?.addEventListener('input', renderLooksTable);
document.getElementById('filterCollSelect')?.addEventListener('change', renderLooksTable);
document.getElementById('filterNicheSelect')?.addEventListener('change', renderLooksTable);

function populateDropdowns() {
  const collSelect = document.getElementById('lookCollection');
  const nicheSelect = document.getElementById('lookNiche');
  const filterColl = document.getElementById('filterCollSelect');
  const filterNiche = document.getElementById('filterNicheSelect');

  if (collSelect) {
    collSelect.innerHTML = STATE.collections.map(c => `<option value="${c.id}">${c.code} — ${c.name}</option>`).join('');
  }
  if (nicheSelect) {
    nicheSelect.innerHTML = STATE.niches.map(n => `<option value="${n.id}">${n.name}</option>`).join('');
  }
  if (filterColl) {
    filterColl.innerHTML = '<option value="">Tất cả Bộ sưu tập</option>' + STATE.collections.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  }
  if (filterNiche) {
    filterNiche.innerHTML = '<option value="">Tất cả Ngách hàng</option>' + STATE.niches.map(n => `<option value="${n.id}">${n.name}</option>`).join('');
  }
}

// Modal Thêm / Sửa Look
function openAddLookModal(prefillCut = '', prefillPhoto = '') {
  document.getElementById('lookModalTitle').textContent = 'Thêm Mẫu Thiết Kế Mới';
  document.getElementById('editLookId').value = '';
  document.getElementById('lookForm').reset();

  const maxNum = STATE.looks.reduce((max, l) => {
    const n = parseInt(l.id || l.no, 10);
    return isNaN(n) ? max : Math.max(max, n);
  }, 0);
  const nextNo = String(maxNum + 1).padStart(2, '0');
  document.getElementById('lookNo').value = nextNo;

  if (prefillCut) document.getElementById('lookCutUrl').value = prefillCut;
  if (prefillPhoto) document.getElementById('lookPhotoUrl').value = prefillPhoto;

  document.getElementById('lookModal').style.display = 'grid';
}

function openEditLookModal(id) {
  const look = STATE.looks.find(l => String(l.id) === String(id));
  if (!look) return;

  document.getElementById('lookModalTitle').textContent = `Chỉnh Sửa LOOK ${look.no || look.id}`;
  document.getElementById('editLookId').value = look.id;
  document.getElementById('lookName').value = look.name || '';
  document.getElementById('lookNo').value = look.no || look.id;
  document.getElementById('lookCollection').value = look.collection || '';
  document.getElementById('lookNiche').value = look.niche || '';
  document.getElementById('lookColor').value = look.color || '';
  document.getElementById('lookCutRatio').value = look.cutRatio || 0.44;
  document.getElementById('lookCutUrl').value = look.cut || '';
  document.getElementById('lookPhotoUrl').value = look.photo || '';
  document.getElementById('lookPieces').value = (look.pieces || []).join('\n');

  document.getElementById('lookModal').style.display = 'grid';
}

function closeLookModal() {
  document.getElementById('lookModal').style.display = 'none';
}

window.openAddLookModal = openAddLookModal;
window.openEditLookModal = openEditLookModal;
window.closeLookModal = closeLookModal;

document.getElementById('topAddLookBtn')?.addEventListener('click', () => openAddLookModal());

// Form submit Thêm/Sửa Look
document.getElementById('lookForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const editId = document.getElementById('editLookId').value;
  const name = document.getElementById('lookName').value.trim();
  const no = document.getElementById('lookNo').value.trim();
  const collection = document.getElementById('lookCollection').value;
  const niche = document.getElementById('lookNiche').value;
  const color = document.getElementById('lookColor').value.trim();
  const cutRatio = parseFloat(document.getElementById('lookCutRatio').value) || 0.44;
  const cut = document.getElementById('lookCutUrl').value.trim();
  const photo = document.getElementById('lookPhotoUrl').value.trim();
  const pieces = document.getElementById('lookPieces').value.split('\n').map(p => p.trim()).filter(Boolean);

  const lookData = {
    id: editId || no,
    no,
    name,
    collection,
    niche,
    color,
    cutRatio,
    cut,
    photo: photo || cut,
    pieces,
  };

  try {
    const url = editId ? `/api/admin/looks/${editId}` : '/api/admin/looks';
    const method = editId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${STATE.token}`,
      },
      body: JSON.stringify(lookData),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      showToast(editId ? 'Cập nhật mẫu thành công!' : 'Thêm mẫu thiết kế mới thành công!');
      closeLookModal();
      await loadAllData();
    } else {
      alert(data.error || 'Thao tác không thành công');
    }
  } catch (err) {
    // Offline / Local fallback
    if (editId) {
      const idx = STATE.looks.findIndex(l => l.id === editId);
      if (idx !== -1) STATE.looks[idx] = { ...STATE.looks[idx], ...lookData };
    } else {
      STATE.looks.unshift(lookData);
    }
    showToast('Đã lưu mẫu vào bộ nhớ!');
    closeLookModal();
    renderDashboard();
    renderLooksTable();
  }
});

// Xóa Look
async function deleteLook(id) {
  const look = STATE.looks.find(l => String(l.id) === String(id));
  if (!confirm(`Bạn có chắc chắn muốn xóa mẫu "LOOK ${look?.no || id} — ${look?.name || ''}"?`)) return;

  try {
    const res = await fetch(`/api/admin/looks/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${STATE.token}` },
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast('Đã xóa mẫu thành công!');
      await loadAllData();
    } else {
      alert(data.error || 'Xóa không thành công');
    }
  } catch (err) {
    STATE.looks = STATE.looks.filter(l => String(l.id) !== String(id));
    showToast('Đã xóa mẫu khỏi danh sách!');
    renderDashboard();
    renderLooksTable();
  }
}

window.deleteLook = deleteLook;

/* ==========================================================================
   6. STUDIO TÁCH NỀN AI TỰ ĐỘNG (AUTOMATED BACKGROUND REMOVAL)
   ========================================================================== */
function initStudioAI() {
  const dropzone = document.getElementById('aiDropzone');
  const fileInput = document.getElementById('aiFileInput');
  const progressBox = document.getElementById('aiProgressBox');
  const progressText = document.getElementById('aiProgressText');
  const progressFill = document.getElementById('aiProgressFill');
  const progressPercent = document.getElementById('aiProgressPercent');
  const previewArea = document.getElementById('aiPreviewArea');
  const origImg = document.getElementById('aiOriginalImg');
  const cutImg = document.getElementById('aiCutImg');
  const cutBox = document.getElementById('aiCutBox');
  const downloadBtn = document.getElementById('aiDownloadBtn');
  const uploadCloudinaryBtn = document.getElementById('aiUploadCloudinaryBtn');
  const createLookBtn = document.getElementById('aiCreateLookBtn');

  // Drag & drop
  ['dragenter', 'dragover'].forEach(ev => {
    dropzone.addEventListener(ev, e => { e.preventDefault(); dropzone.classList.add('is-dragover'); });
  });
  ['dragleave', 'drop'].forEach(ev => {
    dropzone.addEventListener(ev, e => { e.preventDefault(); dropzone.classList.remove('is-dragover'); });
  });
  dropzone.addEventListener('drop', e => {
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageForRemoval(e.dataTransfer.files[0]);
    }
  });
  fileInput.addEventListener('change', e => {
    if (e.target.files && e.target.files[0]) {
      handleImageForRemoval(e.target.files[0]);
    }
  });

  // Switch preview background color
  document.querySelectorAll('.admin-color-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.admin-color-chip').forEach(c => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      const bg = chip.dataset.bg;
      if (bg === 'checkerboard') {
        cutBox.style.background = 'radial-gradient(circle, #DDD 10%, transparent 11%), radial-gradient(circle, #DDD 10%, transparent 11%) #FFF';
        cutBox.style.backgroundSize = '10px 10px';
        cutBox.style.backgroundPosition = '0 0, 5px 5px';
      } else {
        cutBox.style.background = bg;
      }
    });
  });

  async function handleImageForRemoval(file) {
    if (!file || !file.type.startsWith('image/')) {
      alert('Vui lòng chọn tệp hình ảnh (JPG, PNG, WebP)!');
      return;
    }

    STATE.currentOriginalFile = file;
    const origUrl = URL.createObjectURL(file);
    origImg.src = origUrl;

    progressBox.style.display = 'block';
    previewArea.style.display = 'none';
    progressFill.style.width = '15%';
    progressPercent.textContent = '15%';
    progressText.textContent = 'Đang nạp mô hình AI tách nền...';

    try {
      let cutBlob = null;

      // 1. Dùng mô hình WebAssembly client-side (@imgly/background-removal)
      if (window.__imglyRemoveBackground) {
        progressFill.style.width = '45%';
        progressPercent.textContent = '45%';
        progressText.textContent = 'Mô hình AI đang phân tích và bóc tách phom dáng...';

        cutBlob = await window.__imglyRemoveBackground(file, {
          progress: (key, current, total) => {
            if (total > 0) {
              const p = Math.round((current / total) * 100);
              progressFill.style.width = `${Math.max(20, Math.min(95, p))}%`;
              progressPercent.textContent = `${Math.max(20, Math.min(95, p))}%`;
            }
          }
        });
      } else {
        // Fallback: Smart Chroma / Studio Backdrop Removal qua Canvas
        progressFill.style.width = '60%';
        progressPercent.textContent = '60%';
        progressText.textContent = 'Đang xử lý tách phom studio qua Canvas thông minh...';
        cutBlob = await canvasSmartCutout(file);
      }

      progressFill.style.width = '100%';
      progressPercent.textContent = '100%';
      progressText.textContent = 'Tách nền thành công!';

      STATE.currentCutBlob = cutBlob;
      const cutUrl = URL.createObjectURL(cutBlob);
      cutImg.src = cutUrl;

      setTimeout(() => {
        progressBox.style.display = 'none';
        previewArea.style.display = 'block';
        showToast('Đã tách nền người mẫu thành công!');
      }, 500);

    } catch (err) {
      console.error('[AI Cutout Error]', err);
      // Fallback tự động
      try {
        const cutBlob = await canvasSmartCutout(file);
        STATE.currentCutBlob = cutBlob;
        cutImg.src = URL.createObjectURL(cutBlob);
        progressBox.style.display = 'none';
        previewArea.style.display = 'block';
        showToast('Đã tách nền người mẫu thành công (bộ lọc Studio Canvas)!');
      } catch (err2) {
        alert('Không thể tách nền tự động cho ảnh này. Vui lòng thử lại với ảnh rõ nét hơn!');
        progressBox.style.display = 'none';
      }
    }
  }

  // Tải file PNG về máy
  downloadBtn.addEventListener('click', () => {
    if (!STATE.currentCutBlob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(STATE.currentCutBlob);
    a.download = `harmony-cut-${Date.now()}.png`;
    a.click();
    showToast('Đang tải file PNG trong suốt về máy...');
  });

  // Tải lên Cloudinary
  uploadCloudinaryBtn.addEventListener('click', async () => {
    if (!STATE.currentCutBlob) return;
    uploadCloudinaryBtn.disabled = true;
    uploadCloudinaryBtn.textContent = 'Đang tải lên Cloudinary...';

    try {
      const fd = new FormData();
      fd.append('file', STATE.currentCutBlob, `cut-${Date.now()}.png`);
      fd.append('folder', 'harmony-studio/cut');

      const res = await fetch('/api/media/upload', {
        method: 'POST',
        body: fd
      });
      const data = await res.json();
      if (res.ok && data.url) {
        STATE.currentCutUrl = data.url;
        showToast('Đã tải ảnh tách nền lên Cloudinary thành công!');
        uploadCloudinaryBtn.textContent = '✓ Đã tải lên Cloudinary';
      } else {
        alert(data.error || 'Upload Cloudinary thất bại!');
        uploadCloudinaryBtn.textContent = '☁ Tải lên Cloudinary';
      }
    } catch (err) {
      alert('Lỗi kết nối khi tải lên Cloudinary!');
      uploadCloudinaryBtn.textContent = '☁ Tải lên Cloudinary';
    } finally {
      uploadCloudinaryBtn.disabled = false;
    }
  });

  // Tạo Look mới với ảnh vừa tách
  createLookBtn.addEventListener('click', async () => {
    let cutUrl = STATE.currentCutUrl;

    // Nếu chưa upload lên Cloudinary, tự động upload trước
    if (!cutUrl && STATE.currentCutBlob) {
      createLookBtn.disabled = true;
      createLookBtn.textContent = 'Đang tải lên Cloudinary...';
      try {
        const fd = new FormData();
        fd.append('file', STATE.currentCutBlob, `cut-${Date.now()}.png`);
        fd.append('folder', 'harmony-studio/cut');
        const res = await fetch('/api/media/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (data && data.url) cutUrl = data.url;
      } catch (e) {}
      createLookBtn.disabled = false;
      createLookBtn.textContent = '✨ Tạo Look mới với ảnh này ngay →';
    }

    switchTab('looks');
    openAddLookModal(cutUrl || '', '');
  });
}

// Fallback Canvas Studio Cutout khi WebAssembly không khởi động được
function canvasSmartCutout(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      // Lấy màu mẫu từ 4 góc ảnh làm màu phông nền
      const cornerR = (data[0] + data[(canvas.width - 1) * 4]) / 2;
      const cornerG = (data[1] + data[(canvas.width - 1) * 4 + 1]) / 2;
      const cornerB = (data[2] + data[(canvas.width - 1) * 4 + 2]) / 2;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const dist = Math.sqrt((r - cornerR) ** 2 + (g - cornerG) ** 2 + (b - cornerB) ** 2);
        // Ngưỡng bóc phông nền studio
        if (dist < 38) {
          data[i + 3] = 0;
        } else if (dist < 60) {
          data[i + 3] = Math.round(((dist - 38) / 22) * 255);
        }
      }

      ctx.putImageData(imgData, 0, 0);
      canvas.toBlob(blob => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas export failed'));
      }, 'image/png');
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/* ==========================================================================
   7. BỘ SƯU TẬP & NGÁCH HÀNG
   ========================================================================== */
function renderCollectionsAndNiches() {
  const collsBox = document.getElementById('collsContainer');
  const nichesBox = document.getElementById('nichesContainer');

  if (collsBox) {
    collsBox.innerHTML = STATE.collections.map((c, i) => `
      <div class="admin-coll-item">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span class="admin-badge" style="background:${c.tint};color:${c.ink}"><b>${c.code}</b></span>
          <span style="font-size:12px;color:var(--admin-ink-soft)">ID: ${c.id}</span>
        </div>
        <div class="admin-form-group">
          <label>Tên chương</label>
          <input type="text" class="admin-input" data-coll-idx="${i}" data-field="name" value="${c.name || ''}">
        </div>
        <div class="admin-form-group">
          <label>Mô tả ngắn (Blurb)</label>
          <textarea class="admin-textarea" rows="2" data-coll-idx="${i}" data-field="blurb">${c.blurb || ''}</textarea>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div class="admin-form-group">
            <label>Màu nền (Tint)</label>
            <input type="text" class="admin-input" data-coll-idx="${i}" data-field="tint" value="${c.tint || ''}">
          </div>
          <div class="admin-form-group">
            <label>Màu chữ (Ink)</label>
            <input type="text" class="admin-input" data-coll-idx="${i}" data-field="ink" value="${c.ink || ''}">
          </div>
        </div>
      </div>
    `).join('');
  }

  if (nichesBox) {
    nichesBox.innerHTML = STATE.niches.map((n, i) => `
      <div class="admin-niche-item">
        <div class="admin-form-group">
          <label>Tên ngách thời trang</label>
          <input type="text" class="admin-input" data-niche-idx="${i}" data-field="name" value="${n.name || ''}">
        </div>
        <div class="admin-form-group">
          <label>Tên rút gọn (Label)</label>
          <input type="text" class="admin-input" data-niche-idx="${i}" data-field="short" value="${n.short || ''}">
        </div>
        <div class="admin-form-group">
          <label>Ghi chú đặc trưng</label>
          <input type="text" class="admin-input" data-niche-idx="${i}" data-field="note" value="${n.note || ''}">
        </div>
      </div>
    `).join('');
  }
}

// Lưu Bộ sưu tập
document.getElementById('saveCollsBtn')?.addEventListener('click', async () => {
  document.querySelectorAll('[data-coll-idx]').forEach(inp => {
    const idx = parseInt(inp.dataset.collIdx, 10);
    const field = inp.dataset.field;
    if (STATE.collections[idx]) {
      STATE.collections[idx][field] = inp.value;
    }
  });

  try {
    const res = await fetch('/api/admin/collections', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${STATE.token}`,
      },
      body: JSON.stringify(STATE.collections),
    });
    if (res.ok) {
      showToast('Đã lưu danh sách bộ sưu tập thành công!');
    } else {
      alert('Lỗi lưu bộ sưu tập');
    }
  } catch (err) {
    showToast('Đã lưu bộ sưu tập (chế độ local)!');
  }
});

// Lưu Ngách hàng
document.getElementById('saveNichesBtn')?.addEventListener('click', async () => {
  document.querySelectorAll('[data-niche-idx]').forEach(inp => {
    const idx = parseInt(inp.dataset.nicheIdx, 10);
    const field = inp.dataset.field;
    if (STATE.niches[idx]) {
      STATE.niches[idx][field] = inp.value;
    }
  });

  try {
    const res = await fetch('/api/admin/niches', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${STATE.token}`,
      },
      body: JSON.stringify(STATE.niches),
    });
    if (res.ok) {
      showToast('Đã lưu các ngách hàng thời trang!');
    } else {
      alert('Lỗi lưu ngách hàng');
    }
  } catch (err) {
    showToast('Đã lưu ngách hàng (chế độ local)!');
  }
});

/* ==========================================================================
   8. NỘI DUNG WEBSITE & THÔNG TIN LIÊN HỆ
   ========================================================================== */
function renderContentForm() {
  const s = STATE.site || {};
  const c = STATE.content || {};

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  };

  setVal('siteBrand', s.brand);
  setVal('siteSeason', s.season);
  setVal('sitePhone', s.phone);
  setVal('siteEmail', s.email);
  setVal('siteZalo', s.zalo);
  setVal('siteMessenger', s.messenger);
  setVal('siteInstagram', s.instagram);
  setVal('siteFacebook', s.facebook);
  setVal('siteAddress', s.address);
  setVal('siteHours', s.hours);
  setVal('siteTagline', s.tagline);

  setVal('contentManifesto', c.manifesto);
  setVal('contentB2bTitle', c.b2bTitle);
  setVal('contentB2bDesc', c.b2bDesc);
  setVal('contentBespokeTitle', c.bespokeTitle);
  setVal('contentBespokeDesc', c.bespokeDesc);
}

document.getElementById('contentForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const getVal = id => document.getElementById(id)?.value?.trim() || '';

  STATE.site = {
    ...STATE.site,
    brand: getVal('siteBrand') || 'HARMONY.STUDIO',
    season: getVal('siteSeason') || 'Bộ sưu tập Thu Đông',
    phone: getVal('sitePhone') || '0900 000 000',
    phoneHref: `tel:${getVal('sitePhone').replace(/[^0-9]/g, '')}`,
    email: getVal('siteEmail') || 'contact@harmony.studio',
    zalo: getVal('siteZalo') || 'https://zalo.me',
    messenger: getVal('siteMessenger') || 'https://m.me',
    instagram: getVal('siteInstagram') || 'https://instagram.com',
    facebook: getVal('siteFacebook') || 'https://facebook.com',
    address: getVal('siteAddress') || 'Studio tại Việt Nam',
    hours: getVal('siteHours') || 'Đón khách theo lịch hẹn',
    tagline: getVal('siteTagline') || 'Thiết kế cho xưởng & may đo theo số đo riêng.',
  };

  STATE.content = {
    ...STATE.content,
    manifesto: getVal('contentManifesto'),
    b2bTitle: getVal('contentB2bTitle'),
    b2bDesc: getVal('contentB2bDesc'),
    bespokeTitle: getVal('contentBespokeTitle'),
    bespokeDesc: getVal('contentBespokeDesc'),
  };

  try {
    const res = await fetch('/api/admin/content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${STATE.token}`,
      },
      body: JSON.stringify({ site: STATE.site, content: STATE.content }),
    });

    if (res.ok) {
      showToast('Đã lưu nội dung & thông tin liên hệ thành công!');
      renderDashboard();
    } else {
      alert('Lỗi lưu nội dung');
    }
  } catch (err) {
    showToast('Đã lưu nội dung vào bộ nhớ local!');
    renderDashboard();
  }
});

/* ==========================================================================
   9. SAO LƯU & PHỤC HỒI DỮ LIỆU (BACKUP & RESTORE)
   ========================================================================== */
document.getElementById('exportBackupBtn')?.addEventListener('click', () => {
  const backup = {
    niches: STATE.niches,
    collections: STATE.collections,
    looks: STATE.looks,
    site: STATE.site,
    content: STATE.content,
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `harmony-studio-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  showToast('Đã xuất file sao lưu dữ liệu!');
});

document.getElementById('importBackupInput')?.addEventListener('change', async (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!data.looks || !Array.isArray(data.looks)) {
      alert('Tệp dữ liệu không hợp lệ!');
      return;
    }

    if (confirm('Bạn có chắc muốn nạp tệp này và ghi đè dữ liệu hiện tại?')) {
      STATE.looks = data.looks || STATE.looks;
      STATE.collections = data.collections || STATE.collections;
      STATE.niches = data.niches || STATE.niches;
      STATE.site = data.site || STATE.site;
      STATE.content = data.content || STATE.content;

      // Sync via API
      await Promise.all([
        fetch('/api/admin/looks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${STATE.token}` },
          body: JSON.stringify(STATE.looks[0] || {})
        }).catch(() => {}),
        fetch('/api/admin/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${STATE.token}` },
          body: JSON.stringify({ site: STATE.site, content: STATE.content })
        }).catch(() => {})
      ]);

      showToast('Nạp dữ liệu sao lưu thành công!');
      loadAllData();
    }
  } catch (err) {
    alert('Lỗi đọc tệp sao lưu: ' + err.message);
  }
});

document.getElementById('resetDataBtn')?.addEventListener('click', async () => {
  if (!confirm('CẢNH BÁO: Thao tác này sẽ xóa mọi chỉnh sửa và khôi phục website về dữ liệu gốc ban đầu. Bạn có chắc không?')) return;

  try {
    const res = await fetch('/api/admin/reset', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${STATE.token}` }
    });
    if (res.ok) {
      showToast('Đã khôi phục dữ liệu gốc của Harmony Studio!');
      await loadAllData();
    }
  } catch (err) {
    alert('Khôi phục dữ liệu thất bại');
  }
});

/* ==========================================================================
   KHỞI CHẠY HỆ THỐNG QUẢN TRỊ
   ========================================================================== */
initAuth();
initStudioAI();
