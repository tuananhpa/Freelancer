/**
 * CPES Main JavaScript
 * Xử lý tương tác Header, Mobile Drawer, Danh mục sản phẩm, Carousel, Modals & Toast
 */

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initMobileDrawer();
  initCatalogIfPresent();
  initContactFormIfPresent();
});

/* =========================================================
   HEADER & SCROLL EFFECT
   ========================================================= */
function initHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const onScroll = () => {
    if (window.scrollY > 30) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* =========================================================
   MOBILE DRAWER
   ========================================================= */
function initMobileDrawer() {
  const toggleBtn = document.querySelector('.menu-toggle');
  const drawer = document.querySelector('.mobile-drawer');
  if (!toggleBtn || !drawer) return;

  const toggle = (force) => {
    const isOpen = typeof force === 'boolean' ? force : !drawer.classList.contains('is-open');
    drawer.classList.toggle('is-open', isOpen);
    toggleBtn.classList.toggle('is-active', isOpen);
    toggleBtn.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  };

  toggleBtn.addEventListener('click', () => toggle());

  // Đóng khi click ngoài hoặc click link
  drawer.addEventListener('click', (e) => {
    if (e.target === drawer || e.target.closest('a')) {
      toggle(false);
    }
  });

  // Đóng khi nhấn phím Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
      toggle(false);
    }
  });
}

/* =========================================================
   CATALOG / PRODUCT CAROUSEL (SAN-PHAM.HTML)
   ========================================================= */
async function initCatalogIfPresent() {
  const grid = document.querySelector('#productCarouselGrid');
  if (!grid) return;

  let allProducts = [];
  try {
    allProducts = await CPES_API.getProducts();
  } catch (e) {
    console.error('Lỗi nạp sản phẩm:', e);
    return;
  }

  let currentCategory = 'all';
  let searchQuery = '';

  const renderProducts = () => {
    // Lọc theo danh mục và từ khóa
    const normalizedQuery = removeVietnameseTones(searchQuery.toLowerCase().trim());
    
    const filtered = allProducts.filter(p => {
      // Danh mục / Thương hiệu
      if (currentCategory !== 'all') {
        if (currentCategory === 'scan' && p.brand !== 's::can') return false;
        if (currentCategory === 'ati' && p.brand !== 'ATi') return false;
        if (currentCategory === 'spectrometer' && p.category_slug !== 'spectrometer') return false;
        if (currentCategory === 'sensor' && p.category_slug !== 'sensor') return false;
        if (currentCategory === 'accessory' && p.category_slug !== 'accessory') return false;
      }
      // Tìm kiếm
      if (normalizedQuery) {
        const text = removeVietnameseTones(`${p.name} ${p.name_vi || ''} ${p.brand || ''} ${p.parameters || ''} ${p.description_vi || ''}`).toLowerCase();
        if (!text.includes(normalizedQuery)) return false;
      }
      return true;
    });

    const countElem = document.querySelector('#productCountInfo');
    if (countElem) {
      countElem.textContent = `Hiển thị ${filtered.length} / ${allProducts.length} sản phẩm (s::can & ATi)`;
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 48px 20px; text-align: center; background: #fff; border-radius: 12px; border: 1px solid var(--line);">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 12px; color: var(--muted);"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <h4 style="margin: 0 0 6px;">Không tìm thấy sản phẩm phù hợp</h4>
          <p style="color: var(--muted); font-size: 0.9rem;">Vui lòng thử từ khóa khác hoặc chọn xem "Tất cả sản phẩm".</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(p => {
      // Tách dải thông số
      const paramsList = (p.parameters || '')
        .split(/[,;\/]/)
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .slice(0, 4);

      const paramsHtml = paramsList.length > 0 
        ? paramsList.map(item => `<span class="param-pill">${item}</span>`).join('')
        : `<span class="param-pill">${p.category}</span>`;

      const imgSrc = p.local_image || p.image_url;

      return `
        <article class="product-card" data-id="${p.id}">
          <div class="product-card-plate">
            <img src="${imgSrc}" alt="${p.name_vi}" loading="lazy" width="240" height="200" onerror="this.src='${p.image_url}'">
          </div>
          <span class="product-card-category">${p.category}</span>
          <h3 class="product-card-title">${p.name}</h3>
          <p class="product-card-desc">${p.description_vi}</p>
          <div class="product-params-chips">
            ${paramsHtml}
          </div>
          <div class="product-card-footer">
            <a href="chi-tiet-san-pham.html?id=${p.id}" class="btn btn-sm btn-ghost btn-view-detail" data-id="${p.id}">Chi tiết &rarr;</a>
            <button type="button" class="btn btn-sm btn-primary btn-request-quote" data-id="${p.id}" data-name="${p.name}">Báo giá</button>
          </div>
        </article>
      `;
    }).join('');

    // Gắn sự kiện click
    grid.querySelectorAll('.btn-view-detail').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id, 10);
        const prod = allProducts.find(x => x.id === id);
        if (prod) openProductModal(prod);
      });
    });

    grid.querySelectorAll('.btn-request-quote').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.dataset.name;
        openQuoteModal(name);
      });
    });
  };

  // Lọc tab
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.dataset.category || 'all';
      renderProducts();
    });
  });

  // Tìm kiếm
  const searchInput = document.querySelector('#productSearchInput');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        searchQuery = e.target.value;
        renderProducts();
      }, 180);
    });
  }

  // Nút lướt carousel trái/phải
  const prevBtn = document.querySelector('#carouselPrevBtn');
  const nextBtn = document.querySelector('#carouselNextBtn');
  if (prevBtn && nextBtn) {
    prevBtn.addEventListener('click', () => {
      const cardWidth = grid.querySelector('.product-card')?.offsetWidth || 340;
      grid.scrollBy({ left: -(cardWidth + 20), behavior: 'smooth' });
    });
    nextBtn.addEventListener('click', () => {
      const cardWidth = grid.querySelector('.product-card')?.offsetWidth || 340;
      grid.scrollBy({ left: cardWidth + 20, behavior: 'smooth' });
    });
  }

  // Khởi tạo hiển thị lần đầu
  renderProducts();
}

/* =========================================================
   PRODUCT DETAIL MODAL
   ========================================================= */
function openProductModal(prod) {
  let modal = document.querySelector('#productDetailModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'productDetailModal';
    modal.className = 'modal-backdrop';
    document.body.appendChild(modal);
  }

  const imgSrc = prod.local_image || prod.image_url;
  const highlightsList = (prod.highlights_vi || []).map(h => `<li><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color:var(--brand);flex-shrink:0;"><polyline points="20 6 9 17 4 12"></polyline></svg> ${h}</li>`).join('');
  const marketsList = (prod.markets_vi || []).map(m => `<span class="tag-chip">${m}</span>`).join('');

  modal.innerHTML = `
    <div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="modalProdTitle">
      <button type="button" class="modal-close-btn" aria-label="Đóng">&times;</button>
      <div style="display: flex; flex-direction: column; gap: 20px;">
        <div style="background: radial-gradient(circle, #fff, #edf5ef); border-radius: 12px; padding: 24px; text-align: center;">
          <img src="${imgSrc}" alt="${prod.name_vi}" style="max-height: 240px; margin: 0 auto; object-fit: contain;">
        </div>
        <div>
          <span style="font-size: 0.78rem; font-weight: 700; color: var(--brand); text-transform: uppercase;">${prod.category}</span>
          <h2 id="modalProdTitle" style="font-size: 1.45rem; margin: 4px 0 10px; color: var(--brand-dark);">${prod.name}</h2>
          <p style="font-size: 0.95rem; color: var(--ink-2); line-height: 1.6; margin-bottom: 16px;">${prod.description_vi}</p>
        </div>
        
        ${prod.parameters ? `
          <div style="background: var(--bg-alt); padding: 14px 18px; border-radius: 8px; border: 1px solid var(--line);">
            <h4 style="margin: 0 0 6px; font-size: 0.92rem; color: var(--brand-dark);">Thông số đo lường:</h4>
            <p style="margin: 0; font-size: 0.9rem; font-weight: 600; color: var(--ink);">${prod.parameters}</p>
          </div>
        ` : ''}

        ${highlightsList ? `
          <div>
            <h4 style="margin: 0 0 8px; font-size: 0.95rem; color: var(--brand-dark);">Đặc tính kỹ thuật nổi bật:</h4>
            <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; font-size: 0.9rem;">
              ${highlightsList}
            </ul>
          </div>
        ` : ''}

        ${marketsList ? `
          <div>
            <h4 style="margin: 0 0 8px; font-size: 0.95rem; color: var(--brand-dark);">Ứng dụng công nghiệp:</h4>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              ${marketsList}
            </div>
          </div>
        ` : ''}

        <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-top: 20px; border-top: 1px solid var(--line); margin-top: 8px;">
          <a href="${prod.original_url}" target="_blank" rel="noopener noreferrer" style="font-size: 0.85rem; color: var(--muted); text-decoration: underline;">
            Xem trang gốc Badger Meter &nearr;
          </a>
          <button type="button" class="btn btn-primary btn-modal-quote" data-name="${prod.name}">
            Yêu cầu báo giá thiết bị
          </button>
        </div>
      </div>
    </div>
  `;

  modal.classList.add('is-open');

  modal.querySelector('.modal-close-btn').addEventListener('click', () => {
    modal.classList.remove('is-open');
  });

  modal.querySelector('.btn-modal-quote')?.addEventListener('click', (e) => {
    modal.classList.remove('is-open');
    openQuoteModal(e.target.dataset.name);
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('is-open');
  });
}

/* =========================================================
   QUOTE REQUEST MODAL
   ========================================================= */
function openQuoteModal(param = '') {
  let productName = '';
  if (typeof param === 'object' && param !== null) {
    productName = param.title || param.name || '';
  } else {
    productName = param || '';
  }

  let modal = document.querySelector('#quoteRequestModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'quoteRequestModal';
    modal.className = 'modal-backdrop';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-box" role="dialog" aria-modal="true" style="max-width: 520px;">
      <button type="button" class="modal-close-btn" aria-label="Đóng">&times;</button>
      <div style="margin-bottom: 20px;">
        <span class="eyebrow">Yêu cầu báo giá</span>
        <h3 style="margin: 0 0 6px; color: var(--brand-dark);">Báo giá giải pháp & thiết bị</h3>
        <p style="font-size: 0.9rem; color: var(--muted); margin: 0;">Đội ngũ kỹ thuật CPES sẽ liên hệ phản hồi kèm bảng chào giá chi tiết trong vòng 24 giờ.</p>
      </div>

      <form id="quoteModalForm">
        <div class="form-group">
          <label class="form-label">Sản phẩm / Giải pháp quan tâm</label>
          <input type="text" class="form-control" name="product" value="${productName}" placeholder="Nhập tên sản phẩm hoặc nhu cầu" required>
        </div>
        <div class="form-group">
          <label class="form-label">Họ và tên *</label>
          <input type="text" class="form-control" name="name" placeholder="Ví dụ: Nguyễn Văn An" required>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="form-group">
            <label class="form-label">Số điện thoại *</label>
            <input type="tel" class="form-control" name="phone" placeholder="09xx xxx xxx" required>
          </div>
          <div class="form-group">
            <label class="form-label">Email công việc *</label>
            <input type="email" class="form-control" name="email" placeholder="email@congty.com" required>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Tên công ty / Đơn vị</label>
          <input type="text" class="form-control" name="company" placeholder="Tên doanh nghiệp của bạn">
        </div>
        <div class="form-group">
          <label class="form-label">Ghi chú yêu cầu kỹ thuật</label>
          <textarea class="form-control" name="notes" placeholder="Mô tả môi trường đo, thông số cần giám sát, địa điểm lắp đặt..." rows="3"></textarea>
        </div>
        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 8px;">
          Gửi yêu cầu báo giá ngay
        </button>
      </form>
    </div>
  `;

  modal.classList.add('is-open');

  modal.querySelector('.modal-close-btn').addEventListener('click', () => {
    modal.classList.remove('is-open');
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('is-open');
  });

  const form = modal.querySelector('#quoteModalForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    CPES_API.submitQuoteRequest(data);
    modal.classList.remove('is-open');
    showToast(`Đã nhận yêu cầu báo giá cho "${data.product}"! CPES sẽ liên hệ sớm nhất.`);
  });
}

/* =========================================================
   CONTACT FORM & TOAST
   ========================================================= */
function initContactFormIfPresent() {
  const form = document.querySelector('#contactForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    CPES_API.submitQuoteRequest({
      product: 'Yêu cầu tư vấn tổng quan',
      ...data
    });
    form.reset();
    showToast('Cảm ơn bạn! Đã gửi thông tin liên hệ thành công tới CPES.');
  });
}

function showToast(message) {
  let toast = document.querySelector('.cpes-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'cpes-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background: var(--brand-dark);
      color: #fff;
      padding: 14px 24px;
      border-radius: 999px;
      font-weight: 600;
      font-size: 0.94rem;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      z-index: 10000;
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      align-items: center;
      gap: 10px;
    `;
    document.body.appendChild(toast);
  }

  toast.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#53ba36" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> ${message}`;
  toast.style.transform = 'translateX(-50%) translateY(0)';

  setTimeout(() => {
    toast.style.transform = 'translateX(-50%) translateY(100px)';
  }, 4200);
}

// Bỏ dấu tiếng Việt để tìm kiếm không dấu
function removeVietnameseTones(str) {
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');
  return str;
}

window.openQuoteModal = openQuoteModal;
window.showToast = showToast;
