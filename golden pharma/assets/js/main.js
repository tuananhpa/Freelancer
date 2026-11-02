/* ==========================================================================
   GOLDEN PHARMA — main.js
   Một nguồn dữ liệu liên hệ (SITE), giỏ hàng localStorage, chuyển đổi VI/EN,
   hiệu ứng sân khấu 3D sản phẩm và chuyển động mượt 60fps trên mọi thiết bị.
   ========================================================================== */
const SITE = window.SITE = {
  brand: 'GOLDEN PHARMA',
  company: 'Công Ty Cổ Phần Quốc Tế Thú Y Vàng',
  companyEn: 'Golden Veterinary International JSC',
  tagline: 'Chế phẩm sinh học & thuốc thú y chuẩn GMP-WHO — Vì sức khỏe vật nuôi',
  taglineEn: 'GMP-WHO Veterinary Pharmaceuticals & Probiotics — For Animal Health',
  phone: '0968 486 985',
  phoneRaw: '0968486985',
  phoneHref: 'tel:0968486985',
  zalo: 'https://zalo.me/0968486985',
  tiktok: 'https://www.tiktok.com/@thuyvanghanoi',
  tiktokHandle: '@thuyvanghanoi',
  shopee: 'https://vn.shp.ee/ghozM3PF',
  messenger: 'https://m.me/thuyvanghanoi',
  email: 'goldenvet10@gmail.com',
  address: 'Tầng 4, lô 30-31 Liền kề 2, khu đô thị Đại Thanh, Xã Đại Thanh, TP Hà Nội',
  addressEn: '4th Floor, Lot 30-31 LK2, Dai Thanh Urban Area, Dai Thanh, Hanoi',
  mapEmbed: 'https://www.google.com/maps?q=Khu+do+thi+Dai+Thanh+Ha+Noi&output=embed',
};

const DATA = window.GOLDEN_DATA || { categories: [], animals: [], products: [] };
let prodById = Object.fromEntries(DATA.products.map(p => [p.id, p]));
let catById = Object.fromEntries(DATA.categories.map(c => [c.id, c]));

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
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ==========================================================================
   Quản lý Ngôn ngữ (VI / EN)
   ========================================================================== */
const I18N = {
  vi: {
    nav_home: 'Trang chủ',
    nav_shop: 'Sản phẩm (30)',
    nav_about: 'Giới thiệu',
    nav_contact: 'Liên hệ',
    cart_btn: 'Giỏ hàng',
    hero_eyebrow: 'Công Ty Cổ Phần Quốc Tế Thú Y Vàng · Chuẩn GMP-WHO',
    hero_title: 'Dược phẩm & chế phẩm sinh học <em>vì sức khỏe vật nuôi</em>',
    hero_desc: 'Trọn bộ 30 dòng men vi sinh sống, vitamin khoáng đậm đặc, thảo dược giải độc và kháng sinh đặc trị chính hãng Golden Pharma — được tin dùng bởi hàng chục nghìn trang trại trên toàn quốc.',
    hero_search_ph: 'Tìm tên thuốc, công dụng (vd: GP-Guard, hen khẹc, vỗ béo, tiêu chảy)...',
    hero_search_btn: 'Tìm kiếm',
    hero_m1: 'Đơn hàng trên TikTok Shop',
    hero_m2: 'Sản phẩm chủ lực chính hãng',
    hero_m3: 'Đánh giá thực tế từ nhà chăn nuôi',
    sec_cat_eyebrow: 'Danh mục chuyên biệt',
    sec_cat_title: 'Giải pháp theo nhóm công dụng & vật nuôi',
    sec_spot_eyebrow: 'Sân khấu sản phẩm bán chạy · Chạm để xoay & xem',
    sec_spot_title: 'Top chế phẩm dẫn đầu doanh số của Golden Pharma',
    sec_best_eyebrow: 'Sản phẩm chính hãng · Ảnh chuẩn bao bì thật',
    sec_best_title: 'Danh mục sản phẩm nổi bật',
    sec_trust_eyebrow: 'Tiêu chuẩn chất lượng',
    sec_trust_title: 'Vì sao trang trại & đại lý chọn Golden Pharma?',
    add_cart: 'Thêm vào giỏ',
    buy_now: 'Mua ngay',
    view_detail: 'Xem chi tiết',
    sold_lbl: 'Đã bán',
  },
  en: {
    nav_home: 'Home',
    nav_shop: 'Products (30)',
    nav_about: 'About Us',
    nav_contact: 'Contact',
    cart_btn: 'Cart',
    hero_eyebrow: 'Golden Veterinary International JSC · GMP-WHO Certified',
    hero_title: 'Veterinary pharmaceuticals & probiotics <em>for healthy livestock</em>',
    hero_desc: 'Discover 30 flagship probiotic formulas, concentrated vitamins, herbal detoxifiers, and specialized treatments trusted by tens of thousands of farms across Vietnam.',
    hero_search_ph: 'Search product name, symptom (e.g., GP-Guard, respiratory, growth)...',
    hero_search_btn: 'Search',
    hero_m1: 'Orders sold on TikTok Shop',
    hero_m2: 'Official flagship formulas',
    hero_m3: 'Verified farmer ratings',
    sec_cat_eyebrow: 'Specialized Categories',
    sec_cat_title: 'Solutions by Function & Livestock',
    sec_spot_eyebrow: 'Best-Seller 3D Stage · Tap to Explore',
    sec_spot_title: 'Top-Selling Golden Pharma Formulas',
    sec_best_eyebrow: 'Official Catalog · Studio Packaging',
    sec_best_title: 'Featured Veterinary Products',
    sec_trust_eyebrow: 'Quality Assurance',
    sec_trust_title: 'Why Farms & Dealers Trust Golden Pharma',
    add_cart: 'Add to Cart',
    buy_now: 'Buy Now',
    view_detail: 'View Details',
    sold_lbl: 'Sold',
  }
};

let curLang = localStorage.getItem('gp_lang') || 'vi';
const t = key => (I18N[curLang] && I18N[curLang][key]) || I18N.vi[key] || key;

function setLang(lang) {
  curLang = lang === 'en' ? 'en' : 'vi';
  localStorage.setItem('gp_lang', curLang);
  document.documentElement.lang = curLang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const k = el.dataset.i18n;
    if (I18N[curLang][k]) el.innerHTML = I18N[curLang][k];
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const k = el.dataset.i18nPh;
    if (I18N[curLang][k]) el.setAttribute('placeholder', I18N[curLang][k]);
  });
  document.querySelectorAll('[data-lang-btn]').forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.langBtn === curLang);
  });
}

/* ==========================================================================
   Quản lý Giỏ hàng (localStorage: gp_cart_v1)
   ========================================================================== */
const CART_KEY = 'gp_cart_v1';
function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  } catch {
    return [];
  }
}
function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  updateCartUI();
}
function addToCart(prodId, varLabel = null, qty = 1, openDrawer = false) {
  const p = prodById[prodId];
  if (!p) return;
  const v = (varLabel && p.variations.find(x => x.label === varLabel)) || p.variations[0];
  const cart = getCart();
  const key = `${p.id}__${v.label}`;
  const found = cart.find(x => x.key === key);
  if (found) {
    found.qty += Number(qty || 1);
  } else {
    cart.push({
      key,
      id: p.id,
      name: p.shortName,
      fullName: p.name,
      varLabel: v.label,
      price: v.price,
      sku: v.sku,
      img: resolveImg(p.gallery?.[0], 400),
      qty: Number(qty || 1),
    });
  }
  saveCart(cart);
  showToast(`Đã thêm "${p.shortName} (${v.label})" vào giỏ hàng`);
  if (openDrawer) setCartDrawer(true);
}
function updateCartQty(key, delta) {
  let cart = getCart();
  const item = cart.find(x => x.key === key);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(x => x.key !== key);
  saveCart(cart);
}
function removeCartItem(key) {
  saveCart(getCart().filter(x => x.key !== key));
}
function getCartTotals() {
  const cart = getCart();
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  return { cart, count, total };
}

/* ==========================================================================
   Vỏ trang dùng chung (Header, Cart Drawer, Quick View, Lightbox, Footer)
   ========================================================================== */
function mountChrome() {
  const page = document.body.dataset.page || '';
  const cur = p => (p === page ? ' aria-current="page"' : '');

  const shell = document.createElement('div');
  shell.innerHTML = `
    <div class="topbar">
      <div class="wrap topbar__inner">
        <div class="topbar__left">
          <span class="topbar__badge">GMP-WHO</span>
          <span>${SITE.company} — Chính hãng 100%</span>
        </div>
        <div class="topbar__right">
          <a href="${SITE.shopee}" target="_blank" rel="noopener" style="color:#FFB399;font-weight:700">🛒 Shopee Chính Hãng</a>
          <span>·</span>
          <a href="${SITE.tiktok}" target="_blank" rel="noopener">TikTok Shop: <b>${SITE.tiktokHandle}</b> (68.5K+ đã bán)</a>
          <span>·</span>
          <a href="${SITE.phoneHref}">Hotline/Zalo: <b>${SITE.phone}</b></a>
        </div>
      </div>
    </div>

    <header class="header" id="header">
      <div class="wrap header__inner">
        <a class="brand" href="index.html" aria-label="Golden Pharma — Trang chủ">
          <span class="brand__mark"><img src="assets/brand/logo-mark.png" alt="Golden Pharma" width="36" height="36"></span>
          <span class="brand__txt">
            <span class="brand__name">GOLDEN PHARMA</span>
            <span class="brand__sub">Vì sức khỏe vật nuôi</span>
          </span>
        </a>

        <nav class="nav" aria-label="Điều hướng chính">
          <a class="nav__link" href="index.html"${cur('home')} data-i18n="nav_home">Trang chủ</a>
          <a class="nav__link" href="san-pham.html"${cur('shop')} data-i18n="nav_shop">Sản phẩm (30)</a>
          <a class="nav__link" href="san-pham.html?cat=men-tieu-hoa">Men vi sinh</a>
          <a class="nav__link" href="san-pham.html?cat=vitamin-khoang">Vitamin & Khoáng</a>
          <a class="nav__link" href="san-pham.html?cat=khang-sinh-dac-tri">Đặc trị</a>
          <a class="nav__link" href="gioi-thieu.html"${cur('about')} data-i18n="nav_about">Giới thiệu</a>
          <a class="nav__link" href="lien-he.html"${cur('contact')} data-i18n="nav_contact">Liên hệ</a>
        </nav>

        <div class="header__actions">
          <div class="lang-switch" role="group" aria-label="Chọn ngôn ngữ">
            <button type="button" data-lang-btn="vi" class="is-active">VI</button>
            <button type="button" data-lang-btn="en">EN</button>
          </div>
          <button type="button" class="cart-trigger" id="openCartBtn" aria-label="Mở giỏ hàng">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6h15l-1.5 9h-12L6 6Zm0 0L5 3H2m7 17a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm9 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/></svg>
            <span class="cart-trigger__lbl" data-i18n="cart_btn">Giỏ hàng</span>
            <span class="cart-badge" id="headerCartCount">0</span>
          </button>
          <button type="button" class="menu-toggle" id="openMenuBtn" aria-label="Mở menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
          </button>
        </div>
      </div>
    </header>

    <!-- Menu Mobile -->
    <div class="m-drawer" id="mobileMenu" aria-hidden="true">
      <div class="m-drawer__bg" data-close-menu></div>
      <div class="m-drawer__panel">
        <div>
          <div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:14px;border-bottom:1px solid var(--line)">
            <span style="font-weight:700;color:var(--emerald)">GOLDEN PHARMA</span>
            <button type="button" data-close-menu aria-label="Đóng" style="padding:6px">✕</button>
          </div>
          <nav class="m-drawer__links">
            <a href="index.html"${cur('home')}><span>Trang chủ</span><span>→</span></a>
            <a href="san-pham.html"${cur('shop')}><span>Tất cả 30 sản phẩm</span><span>→</span></a>
            <a href="san-pham.html?cat=men-tieu-hoa"><span>Men Vi Sinh & Tiêu Hóa</span><span>→</span></a>
            <a href="san-pham.html?cat=vitamin-khoang"><span>Vitamin, Khoáng & Điện Giải</span><span>→</span></a>
            <a href="san-pham.html?cat=tang-trong-sinh-san"><span>Vỗ Béo & Sinh Sản</span><span>→</span></a>
            <a href="san-pham.html?cat=khang-sinh-dac-tri"><span>Đặc Trị Hô Hấp & Tiêu Chảy</span><span>→</span></a>
            <a href="san-pham.html?cat=sat-trung-chuong-trai"><span>Rắc Chuồng & Khử Mùi</span><span>→</span></a>
            <a href="gioi-thieu.html"${cur('about')}><span>Giới thiệu công ty</span><span>→</span></a>
            <a href="lien-he.html"${cur('contact')}><span>Liên hệ & Đại lý</span><span>→</span></a>
          </nav>
        </div>
        <div style="padding-top:16px;border-top:1px solid var(--line);font-size:13.5px;display:grid;gap:8px">
          <div>Hotline/Zalo: <a href="${SITE.phoneHref}" style="font-weight:700;color:var(--emerald)">${SITE.phone}</a></div>
          <div>Shopee: <a href="${SITE.shopee}" target="_blank" rel="noopener" style="font-weight:700;color:#EE4D2D">Gian hàng Shopee Chính Hãng ↗</a></div>
          <div>TikTok: <a href="${SITE.tiktok}" target="_blank" rel="noopener" style="font-weight:600">${SITE.tiktokHandle}</a></div>
        </div>
      </div>
    </div>

    <!-- Giỏ hàng Drawer -->
    <div class="cart-drawer" id="cartDrawer" role="dialog" aria-modal="true" aria-label="Giỏ hàng" aria-hidden="true">
      <div class="cart-drawer__bg" data-close-cart></div>
      <div class="cart-drawer__panel">
        <div class="cart-drawer__head">
          <div>
            <h3 style="font-size:18px;font-weight:700">Giỏ hàng của bạn</h3>
            <p style="font-size:12.5px;color:var(--ink-soft)" id="cartSubTitle">Chưa có sản phẩm</p>
          </div>
          <button type="button" data-close-cart aria-label="Đóng" style="width:36px;height:36px;border-radius:50%;background:var(--ivory)">✕</button>
        </div>
        <div class="cart-drawer__items" id="cartItemsList"></div>
        <div class="cart-drawer__foot">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
            <span style="font-size:14px;color:var(--ink-soft)">Tạm tính:</span>
            <strong style="font-size:20px;color:var(--emerald)" id="cartTotalPrice">0đ</strong>
          </div>
          <div style="display:grid;gap:8px">
            <a href="thanh-toan.html" class="btn btn--primary btn--full" id="cartCheckoutBtn">Tiến hành đặt hàng (COD)</a>
            <button type="button" class="btn btn--outline btn--sm btn--full" data-close-cart>Tiếp tục chọn sản phẩm</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Xem Nhanh Sản Phẩm (Quick View) -->
    <div class="modal" id="qvModal" role="dialog" aria-modal="true" aria-hidden="true">
      <div class="modal__bg" data-close-qv></div>
      <div class="modal__box" id="qvContent"></div>
    </div>

    <!-- Lightbox phóng to ảnh sản phẩm -->
    <div class="modal" id="lightboxModal" role="dialog" aria-modal="true" aria-hidden="true">
      <div class="modal__bg" data-close-lb></div>
      <div class="modal__box" style="max-width:720px;text-align:center">
        <button type="button" class="modal__close" data-close-lb aria-label="Đóng">✕</button>
        <div style="aspect-ratio:1/1;max-height:70vh;margin-inline:auto;display:grid;place-items:center;padding:12px">
          <img id="lbMainImg" src="assets/img/studio/prod-01-1-1000.webp" alt="Golden Pharma" style="max-height:66vh;width:auto;object-fit:contain;border-radius:20px">
        </div>
        <p id="lbCaption" style="font-weight:700;margin-top:8px"></p>
        <div id="lbThumbs" style="display:flex;justify-content:center;gap:10px;margin-top:12px"></div>
      </div>
    </div>

    <!-- Nút Chat & Gian Hàng Nổi Desktop -->
    <div class="float-chat" aria-label="Liên hệ nhanh">
      <a class="f-btn f-btn--shopee" href="${SITE.shopee}" target="_blank" rel="noopener">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M6 7h12l-1 13H7L6 7Z"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/><path d="M9.5 12.5c.3 1.2 1.3 2 2.5 2s2.2-.8 2.5-2"/></svg>
        <span>Shopee Chính Hãng</span>
      </a>
      <a class="f-btn f-btn--zalo" href="${SITE.zalo}" target="_blank" rel="noopener"><span>Zalo: ${SITE.phone}</span></a>
      <a class="f-btn f-btn--phone" href="${SITE.phoneHref}"><span>Gọi: ${SITE.phone}</span></a>
      <a class="f-btn" href="${SITE.tiktok}" target="_blank" rel="noopener"><span>TikTok Shop</span></a>
      <a class="f-btn" href="${SITE.messenger}" target="_blank" rel="noopener"><span>Messenger</span></a>
    </div>

    <!-- Thanh Đáy Mobile -->
    <nav class="m-bottom-bar" aria-label="Điều hướng nhanh mobile">
      <a href="san-pham.html">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
        <span>Sản phẩm</span>
      </a>
      <a href="${SITE.shopee}" target="_blank" rel="noopener" style="color:#EE4D2D;font-weight:700">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M6 7h12l-1 13H7L6 7Z"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/><path d="M9.5 12.5c.3 1.2 1.3 2 2.5 2s2.2-.8 2.5-2"/></svg>
        <span>Shopee</span>
      </a>
      <a href="${SITE.zalo}" target="_blank" rel="noopener" style="color:#0068FF">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"/></svg>
        <span>Zalo</span>
      </a>
      <a href="${SITE.phoneHref}" style="color:var(--emerald)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z"/></svg>
        <span>Hotline</span>
      </a>
      <button type="button" id="mOpenCartBtn" style="color:var(--forest)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6h15l-1.5 9h-12L6 6Z"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg>
        <span>Giỏ (<b id="mCartCount">0</b>)</span>
      </button>
    </nav>

    <div class="toast" id="toast" role="status" aria-live="polite">
      <span style="width:24px;height:24px;border-radius:50%;background:var(--gold-bright);color:var(--forest-deep);display:grid;place-items:center;font-weight:800;font-size:13px">✓</span>
      <span id="toastMsg" style="font-size:13.5px;font-weight:600">Đã thêm vào giỏ</span>
    </div>
  `;
  document.body.prepend(shell);

  const footer = document.getElementById('footer');
  if (footer) {
    footer.innerHTML = `
      <div class="wrap">
        <div class="footer__grid">
          <div>
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
              <img src="assets/brand/logo-mark-white.png" alt="Golden Pharma" width="40" height="40" style="background:rgba(255,255,255,0.1);padding:6px;border-radius:10px">
              <div>
                <div style="font-weight:800;font-size:16px;color:#fff;letter-spacing:0.04em">${SITE.brand}</div>
                <div style="font-size:12px;color:var(--gold-bright)">${SITE.company}</div>
              </div>
            </div>
            <p style="font-size:13.5px;line-height:1.6;margin-bottom:14px">
              Chuyên nghiên cứu, sản xuất và phân phối thuốc thú y, chế phẩm sinh học, men vi sinh, vitamin khoáng chất lượng cao phục vụ chăn nuôi gia súc, gia cầm.
            </p>
            <p style="font-size:13px;color:rgba(255,255,255,0.68)">📍 ${SITE.address}</p>
          </div>
          <div>
            <h4>Danh mục sản phẩm</h4>
            <ul>
              ${DATA.categories.slice(1).map(c => `<li><a href="san-pham.html?cat=${c.id}">${c.name} (${c.count})</a></li>`).join('')}
            </ul>
          </div>
          <div>
            <h4>Điều hướng</h4>
            <ul>
              <li><a href="index.html">Trang chủ</a></li>
              <li><a href="san-pham.html">Tất cả sản phẩm</a></li>
              <li><a href="thanh-toan.html">Giỏ hàng & Đặt hàng</a></li>
              <li><a href="gioi-thieu.html">Về Golden Pharma</a></li>
              <li><a href="lien-he.html">Đăng ký đại lý phân phối</a></li>
              <li><a href="admin.html" style="color:var(--gold-bright);font-weight:700">🔐 Quản trị hệ thống</a></li>
            </ul>
          </div>
          <div>
            <h4>Liên hệ & Kênh chính thức</h4>
            <ul>
              <li>📞 Hotline/Zalo: <a href="${SITE.phoneHref}" style="color:var(--gold-bright);font-weight:700">${SITE.phone}</a></li>
              <li>✉️ Email: <a href="mailto:${SITE.email}">${SITE.email}</a></li>
              <li>🛒 Shopee: <a href="${SITE.shopee}" target="_blank" rel="noopener" style="color:#FF8566;font-weight:700">Gian hàng Shopee Chính Hãng ↗</a></li>
              <li>🎵 TikTok Shop: <a href="${SITE.tiktok}" target="_blank" rel="noopener">${SITE.tiktokHandle} (Dược Phẩm Vàng)</a></li>
              <li>💬 <a href="${SITE.zalo}" target="_blank" rel="noopener">Chat Zalo tư vấn phác đồ</a></li>
            </ul>
          </div>
        </div>
        <div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;padding-top:22px;font-size:12.5px;color:rgba(255,255,255,0.55)">
          <span>© 2026 ${SITE.company} (${SITE.brand}). Bảo lưu mọi quyền.</span>
          <span>Giao hàng toàn quốc · Thanh toán khi nhận hàng (COD)</span>
        </div>
        <div class="footer__wordmark" aria-hidden="true">GOLDEN PHARMA</div>
      </div>
    `;
  }

  // Events
  window.addEventListener('scroll', () => {
    document.getElementById('header')?.classList.toggle('is-scrolled', window.scrollY > 24);
  }, { passive: true });

  document.getElementById('openCartBtn')?.addEventListener('click', () => setCartDrawer(true));
  document.getElementById('mOpenCartBtn')?.addEventListener('click', () => setCartDrawer(true));
  document.querySelectorAll('[data-close-cart]').forEach(el => el.addEventListener('click', () => setCartDrawer(false)));

  const mMenu = document.getElementById('mobileMenu');
  document.getElementById('openMenuBtn')?.addEventListener('click', () => {
    mMenu.classList.add('is-open');
    mMenu.setAttribute('aria-hidden', 'false');
  });
  document.querySelectorAll('[data-close-menu]').forEach(el => el.addEventListener('click', () => {
    mMenu.classList.remove('is-open');
    mMenu.setAttribute('aria-hidden', 'true');
  }));

  document.querySelectorAll('[data-close-qv]').forEach(el => el.addEventListener('click', () => closeModal('qvModal')));
  document.querySelectorAll('[data-close-lb]').forEach(el => el.addEventListener('click', () => closeModal('lightboxModal')));
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      setCartDrawer(false);
      closeModal('qvModal');
      closeModal('lightboxModal');
      mMenu?.classList.remove('is-open');
    }
  });

  document.querySelectorAll('[data-lang-btn]').forEach(btn => {
    btn.addEventListener('click', () => setLang(btn.dataset.langBtn));
  });

  updateCartUI();
  setLang(curLang);
}

function setCartDrawer(open) {
  const dr = document.getElementById('cartDrawer');
  if (!dr) return;
  dr.classList.toggle('is-open', open);
  dr.setAttribute('aria-hidden', String(!open));
  document.body.classList.toggle('is-locked', open);
}

function updateCartUI() {
  const { cart, count, total } = getCartTotals();
  const hc = document.getElementById('headerCartCount');
  const mc = document.getElementById('mCartCount');
  const sub = document.getElementById('cartSubTitle');
  const list = document.getElementById('cartItemsList');
  const tot = document.getElementById('cartTotalPrice');
  if (hc) hc.textContent = count;
  if (mc) mc.textContent = count;
  if (sub) sub.textContent = count > 0 ? `${count} sản phẩm đã chọn` : 'Chưa có sản phẩm trong giỏ';
  if (tot) tot.textContent = fmtVND(total);
  if (!list) return;

  if (cart.length === 0) {
    list.innerHTML = `
      <div style="text-align:center;padding:44px 16px;color:var(--ink-soft)">
        <p style="font-weight:600;margin-bottom:8px">Giỏ hàng đang trống</p>
        <p style="font-size:13.5px;margin-bottom:18px">Hãy chọn chế phẩm phù hợp cho đàn vật nuôi của bạn.</p>
        <a href="san-pham.html" class="btn btn--primary btn--sm">Xem 30 sản phẩm</a>
      </div>`;
    return;
  }

  list.innerHTML = cart.map(item => `
    <div class="c-item">
      <img class="c-item__img" src="${item.img}" alt="${item.name}" width="72" height="72">
      <div>
        <a href="chi-tiet-san-pham.html?id=${item.id}" class="c-item__name">${item.name}</a>
        <div class="c-item__var">Quy cách: <b>${item.varLabel}</b></div>
        <div class="c-item__price">${fmtVND(item.price * item.qty)}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
        <button type="button" data-rm-cart="${item.key}" aria-label="Xóa" style="font-size:12px;color:var(--ink-muted)">✕</button>
        <div class="c-item__qty">
          <button type="button" data-qty-cart="${item.key}" data-delta="-1">−</button>
          <span style="font-size:13px;font-weight:700;min-width:18px;text-align:center">${item.qty}</span>
          <button type="button" data-qty-cart="${item.key}" data-delta="1">+</button>
        </div>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('[data-qty-cart]').forEach(b => {
    b.addEventListener('click', () => updateCartQty(b.dataset.qtyCart, Number(b.dataset.delta)));
  });
  list.querySelectorAll('[data-rm-cart]').forEach(b => {
    b.addEventListener('click', () => removeCartItem(b.dataset.rmCart));
  });
}

let toastTimer;
function showToast(msg) {
  const el = document.getElementById('toast');
  const txt = document.getElementById('toastMsg');
  if (!el || !txt) return;
  txt.textContent = msg;
  el.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-on'), 2600);
}

/* ==========================================================================
   Thẻ Sản Phẩm Chuẩn Mẫu sample-product.png (Bo tròn góc + Chỉ ảnh chính)
   ========================================================================== */
function renderProductCard(p) {
  const v0 = p.variations[0] || { label: 'Mặc định', price: p.price };
  const salePct = p.originalPrice > v0.price ? Math.round((1 - v0.price / p.originalPrice) * 100) : 0;
  return `
    <article class="p-card" data-prod-card="${p.id}">
      <div>
        <div class="p-card__media">
          <div class="p-card__badges">
            <span class="p-badge">★ ${p.rating} · Đã bán ${p.soldText}</span>
            ${salePct >= 1 ? `<span class="p-badge p-badge--sale">-${salePct}%</span>` : ''}
          </div>
          <a href="chi-tiet-san-pham.html?id=${p.id}" style="width:100%;height:100%;display:grid;place-items:center" aria-label="${p.name}">
            <img class="p-card__img" src="${resolveImg(p.gallery?.[0], 400)}" alt="${p.name}" width="360" height="360" loading="lazy" decoding="async">
          </a>
          <button type="button" class="p-card__qv" data-open-qv="${p.id}" title="Xem nhanh" aria-label="Xem nhanh ${p.shortName}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>

        <div class="p-card__body">
          <div class="p-card__meta">
            <span>Mã: <b>${p.code}</b></span>
            <span>${p.brand}</span>
          </div>
          <a href="chi-tiet-san-pham.html?id=${p.id}" class="p-card__title" title="${p.name}">${p.name}</a>
          <div class="p-card__vars">
            ${p.variations.slice(0, 4).map((v, idx) => `
              <button type="button" class="p-var-chip${idx === 0 ? ' is-on' : ''}" data-card-var="${v.label}" data-card-price="${v.price}">
                ${v.label}
              </button>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="p-card__foot">
        <div class="p-card__price" data-price-el>
          ${fmtVND(v0.price)}
          ${salePct >= 1 ? `<del>${fmtVND(p.originalPrice)}</del>` : ''}
        </div>
        <button type="button" class="p-card__add" data-add-prod="${p.id}" data-selected-var="${v0.label}" aria-label="Thêm ${p.shortName} vào giỏ">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M12 5v14M5 12h14"/></svg>
          <span>Thêm giỏ</span>
        </button>
      </div>
    </article>
  `;
}

function bindProductCardEvents(root = document) {
  root.querySelectorAll('[data-prod-card]').forEach(card => {
    const addBtn = card.querySelector('[data-add-prod]');
    const priceEl = card.querySelector('[data-price-el]');
    card.querySelectorAll('[data-card-var]').forEach(chip => {
      chip.addEventListener('click', e => {
        e.preventDefault();
        card.querySelectorAll('[data-card-var]').forEach(c => c.classList.remove('is-on'));
        chip.classList.add('is-on');
        const pr = Number(chip.dataset.cardPrice);
        if (priceEl) priceEl.innerHTML = fmtVND(pr);
        if (addBtn) addBtn.dataset.selectedVar = chip.dataset.cardVar;
      });
    });
  });

  root.querySelectorAll('[data-add-prod]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      addToCart(btn.dataset.addProd, btn.dataset.selectedVar, 1, false);
    });
  });

  root.querySelectorAll('[data-open-qv]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      openQuickView(btn.dataset.openQv);
    });
  });
}

/* ==========================================================================
   Modal Xem Nhanh (Quick View) & Lightbox
   ========================================================================== */
function openQuickView(prodId) {
  const p = prodById[prodId];
  if (!p) return;
  const modal = document.getElementById('qvModal');
  const box = document.getElementById('qvContent');
  let curVar = p.variations[0];

  box.innerHTML = `
    <button type="button" class="modal__close" data-close-qv aria-label="Đóng">✕</button>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px;align-items:center">
      <div style="background:#fff;border:1px solid var(--line);border-radius:20px;padding:16px;aspect-ratio:1/1;display:grid;place-items:center">
        <img src="${resolveImg(p.gallery?.[0], 800)}" alt="${p.name}" style="max-height:300px;object-fit:contain;border-radius:14px">
      </div>
      <div>
        <span class="eyebrow" style="margin-bottom:8px">${p.code} · ★ ${p.rating} (${p.soldText} đã bán)</span>
        <h3 style="font-size:20px;font-weight:700;line-height:1.3;margin-bottom:10px">${p.name}</h3>
        <div style="font-size:26px;font-weight:800;color:var(--emerald);margin-bottom:14px" id="qvPrice">${fmtVND(curVar.price)}</div>
        <ul style="display:grid;gap:6px;margin-bottom:16px;font-size:14px;color:var(--ink-soft)">
          ${p.highlights.map(h => `<li>✓ ${h}</li>`).join('')}
        </ul>
        <div class="var-group">
          <span class="var-group__lbl">Chọn quy cách:</span>
          <div class="var-list">
            ${p.variations.map((v, i) => `
              <button type="button" class="var-btn${i === 0 ? ' is-active' : ''}" data-qv-var="${v.label}" data-qv-price="${v.price}">${v.label}</button>
            `).join('')}
          </div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:18px">
          <button type="button" class="btn btn--primary" id="qvAddBtn">Thêm vào giỏ hàng</button>
          <a href="${SITE.shopee}" target="_blank" rel="noopener" class="btn btn--shopee">🛒 Mua trên Shopee</a>
          <a href="chi-tiet-san-pham.html?id=${p.id}" class="btn btn--outline">Xem đầy đủ chi tiết →</a>
        </div>
      </div>
    </div>
  `;

  box.querySelector('[data-close-qv]')?.addEventListener('click', () => closeModal('qvModal'));
  box.querySelectorAll('[data-qv-var]').forEach(b => {
    b.addEventListener('click', () => {
      box.querySelectorAll('[data-qv-var]').forEach(x => x.classList.remove('is-active'));
      b.classList.add('is-active');
      curVar = p.variations.find(v => v.label === b.dataset.qvVar) || p.variations[0];
      document.getElementById('qvPrice').textContent = fmtVND(curVar.price);
    });
  });
  document.getElementById('qvAddBtn')?.addEventListener('click', () => {
    addToCart(p.id, curVar.label, 1, true);
    closeModal('qvModal');
  });

  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
}

function openLightbox(prodId, startIdx = 0) {
  const p = prodById[prodId];
  if (!p) return;
  const modal = document.getElementById('lightboxModal');
  const mainImg = document.getElementById('lbMainImg');
  const cap = document.getElementById('lbCaption');
  const thumbs = document.getElementById('lbThumbs');
  const labels = ['Ảnh sản phẩm chính', 'Chi tiết nhãn & thương hiệu', 'Thành phần & hướng dẫn sử dụng'];

  const setSlide = idx => {
    const base = p.gallery[idx] || p.gallery[0];
    mainImg.src = resolveImg(base, 1000);
    mainImg.alt = p.name;
    cap.textContent = `${p.shortName} — ${labels[idx] || ''}`;
    thumbs.querySelectorAll('button').forEach((b, i) => {
      b.style.borderColor = i === idx ? 'var(--emerald)' : 'var(--line)';
    });
  };

  thumbs.innerHTML = p.gallery.map((g, i) => `
    <button type="button" style="width:64px;height:64px;border-radius:12px;border:2px solid var(--line);padding:4px;background:#fff">
      <img src="${resolveImg(g, 400)}" alt="" style="width:100%;height:100%;object-fit:contain;border-radius:8px">
    </button>
  `).join('');
  thumbs.querySelectorAll('button').forEach((b, i) => b.addEventListener('click', () => setSlide(i)));
  setSlide(startIdx);

  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.classList.remove('is-open');
  m.setAttribute('aria-hidden', 'true');
}

/* ==========================================================================
   Trang Chủ (index.html)
   ========================================================================== */
function initHomePage() {
  // 1. Intro ngắn (chỉ chạy lần đầu mỗi phiên, hoặc bấm/cuộn bỏ qua ngay)
  const intro = document.getElementById('intro');
  if (intro) {
    if (reduced() || sessionStorage.getItem('gp_intro')) {
      intro.remove();
    } else {
      sessionStorage.setItem('gp_intro', '1');
      const finish = () => {
        if (!intro.parentNode) return;
        intro.style.clipPath = 'inset(0 0 100% 0)';
        setTimeout(() => intro.remove(), 750);
      };
      setTimeout(finish, 950);
      ['click', 'wheel', 'touchstart', 'keydown'].forEach(ev =>
        window.addEventListener(ev, finish, { once: true, passive: true })
      );
    }
  }

  // 2. Hero Interactive 3D Stage (Top 5 Flagship Products)
  const heroIds = ['01', '02', '03', '13', '10'];
  const stageCard = document.getElementById('heroStageCard');
  const stageImg = document.getElementById('heroStageImg');
  const stageSold = document.getElementById('heroStageSold');
  const stageName = document.getElementById('heroStageName');
  const stagePrice = document.getElementById('heroStagePrice');
  const stageAdd = document.getElementById('heroStageAdd');
  const stageLink = document.getElementById('heroStageLink');
  const thumbsWrap = document.getElementById('heroThumbs');

  if (stageCard && thumbsWrap) {
    let curHeroIdx = 0;
    let heroTimer;

    const renderHeroProd = idx => {
      curHeroIdx = idx;
      const p = prodById[heroIds[idx]] || DATA.products[0];
      stageCard.style.setProperty('--stage-accent', p.accent);
      if (window.gsap && !reduced()) {
        gsap.fromTo(stageImg, { opacity: 0, scale: 0.88, y: 14 }, { opacity: 1, scale: 1, y: 0, duration: 0.42, ease: 'power3.out' });
      }
      stageImg.src = resolveImg(p.cut, 1000);
      stageImg.alt = p.name;
      stageSold.textContent = `★ ${p.rating} · Đã bán ${p.soldText}`;
      stageName.textContent = p.name;
      stagePrice.innerHTML = `${fmtVND(p.price)} <del>${fmtVND(p.originalPrice)}</del>`;
      stageLink.href = `chi-tiet-san-pham.html?id=${p.id}`;
      stageAdd.onclick = () => addToCart(p.id, null, 1, true);
      thumbsWrap.querySelectorAll('.hero-thumb').forEach((b, i) => b.classList.toggle('is-active', i === idx));
    };

    thumbsWrap.innerHTML = heroIds.map((id, i) => {
      const p = prodById[id];
      if (!p) return '';
      return `<button type="button" class="hero-thumb${i === 0 ? ' is-active' : ''}" aria-label="Xem ${p.shortName}">
        <img src="${resolveImg(p.gallery?.[0], 400)}" alt="${p.shortName}" width="48" height="48">
      </button>`;
    }).join('');

    thumbsWrap.querySelectorAll('.hero-thumb').forEach((btn, i) => {
      btn.addEventListener('click', () => {
        clearInterval(heroTimer);
        renderHeroProd(i);
      });
    });

    renderHeroProd(0);
    if (!reduced()) {
      heroTimer = setInterval(() => {
        renderHeroProd((curHeroIdx + 1) % heroIds.length);
      }, 4800);
    }

    // Parallax nhẹ theo con trỏ trên desktop
    if (window.gsap && !window.matchMedia('(hover: none)').matches && !reduced()) {
      const xTo = gsap.quickTo(stageImg, 'x', { duration: 0.35, ease: 'power3' });
      const yTo = gsap.quickTo(stageImg, 'y', { duration: 0.35, ease: 'power3' });
      stageCard.addEventListener('pointermove', e => {
        const r = stageCard.getBoundingClientRect();
        const dx = ((e.clientX - r.left) / r.width - 0.5) * 18;
        const dy = ((e.clientY - r.top) / r.height - 0.5) * 14;
        xTo(dx);
        yTo(dy);
      });
      stageCard.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    }
  }

  // 3. Danh mục (5 nhóm chính)
  const catGrid = document.getElementById('homeCatGrid');
  if (catGrid) {
    const repImg = {
      'men-tieu-hoa': '08',
      'vitamin-khoang': '02',
      'tang-trong-sinh-san': '10',
      'khang-sinh-dac-tri': '21',
      'sat-trung-chuong-trai': '01',
    };
    catGrid.innerHTML = DATA.categories.slice(1).map(c => {
      const p = prodById[repImg[c.id]] || DATA.products[0];
      return `
        <a class="cat-card" href="san-pham.html?cat=${c.id}">
          <div>
            <div class="cat-card__top">
              <div class="cat-card__thumb">
                <img src="${resolveImg(p.gallery?.[0], 400)}" alt="${c.name}" width="60" height="60" loading="lazy">
              </div>
              <span class="cat-card__cnt">${c.count} SP</span>
            </div>
            <h3 style="margin-top:14px">${c.name}</h3>
            <p>${c.desc}</p>
          </div>
          <span class="cat-card__more">Khám phá dòng này →</span>
        </a>
      `;
    }).join('');
  }

  // 4. Sân khấu 3D Sản Phẩm Bán Chạy (Interactive Depth Stage)
  const spotIds = ['01', '02', '03', '04', '05', '08', '09', '13'];
  const spotLineup = document.getElementById('spotLineup');
  const spotDots = document.getElementById('spotDots');
  if (spotLineup && spotDots) {
    let spotIdx = 0;
    const spotProds = spotIds.map(id => prodById[id]).filter(Boolean);

    spotLineup.innerHTML = spotProds.map((p, i) => `
      <div class="spot-item" data-spot-idx="${i}">
        <img src="${resolveImg(p.gallery?.[0], 800)}" alt="${p.name}" width="280" height="280" loading="lazy">
      </div>
    `).join('');

    spotDots.innerHTML = spotProds.map((p, i) => `
      <button type="button" class="spot-dot${i === 0 ? ' is-active' : ''}" data-spot-dot="${i}" title="${p.shortName}">
        <img src="${resolveImg(p.gallery?.[0], 400)}" alt="${p.shortName}" width="44" height="44" loading="lazy">
      </button>
    `).join('');

    const updateSpot = idx => {
      spotIdx = (idx + spotProds.length) % spotProds.length;
      const p = spotProds[spotIdx];
      const prevIdx = (spotIdx - 1 + spotProds.length) % spotProds.length;
      const nextIdx = (spotIdx + 1) % spotProds.length;

      document.getElementById('spotSection')?.style.setProperty('--spot-accent', p.accent);
      spotLineup.querySelectorAll('.spot-item').forEach((el, i) => {
        el.classList.remove('is-active', 'is-prev', 'is-next', 'is-far');
        if (i === spotIdx) el.classList.add('is-active');
        else if (i === prevIdx) el.classList.add('is-prev');
        else if (i === nextIdx) el.classList.add('is-next');
        else el.classList.add('is-far');
      });
      spotDots.querySelectorAll('.spot-dot').forEach((d, i) => d.classList.toggle('is-active', i === spotIdx));

      document.getElementById('spotRank').textContent = `TOP 0${spotIdx + 1} BÁN CHẠY · MÃ ${p.code}`;
      document.getElementById('spotSold').textContent = `★ ${p.rating} · ${p.soldText} đã bán`;
      document.getElementById('spotTitle').textContent = p.shortName;
      document.getElementById('spotFullname').textContent = p.name;
      document.getElementById('spotPrice').innerHTML = `${fmtVND(p.price)} <del>${fmtVND(p.originalPrice)}</del>`;
      document.getElementById('spotBullets').innerHTML = p.highlights.map(h => `<li>${h}</li>`).join('');
      document.getElementById('spotDetailLink').href = `chi-tiet-san-pham.html?id=${p.id}`;
      const addBtn = document.getElementById('spotAddBtn');
      if (addBtn) addBtn.onclick = () => addToCart(p.id, null, 1, true);
    };

    spotLineup.querySelectorAll('.spot-item').forEach(el => {
      el.addEventListener('click', () => {
        const i = Number(el.dataset.spotIdx);
        if (i === spotIdx) openLightbox(spotProds[i].id, 0);
        else updateSpot(i);
      });
    });
    spotDots.querySelectorAll('.spot-dot').forEach(d => {
      d.addEventListener('click', () => updateSpot(Number(d.dataset.spotDot)));
    });
    document.getElementById('spotPrev')?.addEventListener('click', () => updateSpot(spotIdx - 1));
    document.getElementById('spotNext')?.addEventListener('click', () => updateSpot(spotIdx + 1));

    // Vuốt ngang trên điện thoại
    let startX = 0;
    spotLineup.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
    spotLineup.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) updateSpot(dx < 0 ? spotIdx + 1 : spotIdx - 1);
    }, { passive: true });

    updateSpot(0);
  }

  // 5. Lưới sản phẩm nổi bật trên Trang chủ (lọc theo loài vật nuôi)
  const homeGrid = document.getElementById('homeProdGrid');
  const animalFilters = document.getElementById('homeAnimalFilters');
  if (homeGrid && animalFilters) {
    let curAnimal = 'all';
    const renderGrid = () => {
      const list = DATA.products
        .filter(p => curAnimal === 'all' || p.animals.includes(curAnimal))
        .slice(0, 12);
      homeGrid.innerHTML = list.map(renderProductCard).join('');
      bindProductCardEvents(homeGrid);
    };

    animalFilters.innerHTML = DATA.animals.map(a => `
      <button type="button" class="f-pill${a.id === 'all' ? ' is-active' : ''}" data-animal-f="${a.id}">${a.name}</button>
    `).join('');
    animalFilters.querySelectorAll('[data-animal-f]').forEach(b => {
      b.addEventListener('click', () => {
        animalFilters.querySelectorAll('[data-animal-f]').forEach(x => x.classList.remove('is-active'));
        b.classList.add('is-active');
        curAnimal = b.dataset.animalF;
        renderGrid();
      });
    });
    renderGrid();
  }
}

/* ==========================================================================
   Trang Danh Sách 30 Sản Phẩm (san-pham.html)
   ========================================================================== */
function initShopPage() {
  const grid = document.getElementById('shopProdGrid');
  const catBar = document.getElementById('shopCatBar');
  const searchInput = document.getElementById('shopSearchInput');
  const sortSelect = document.getElementById('shopSortSelect');
  const countLbl = document.getElementById('shopResultCount');
  if (!grid) return;

  const params = new URLSearchParams(location.search);
  let curCat = params.get('cat') || 'all';
  let curQuery = (params.get('q') || '').trim();
  let curSort = 'popular';

  if (searchInput && curQuery) searchInput.value = curQuery;

  const render = () => {
    let list = DATA.products.filter(p => {
      const matchCat = curCat === 'all' || p.category === curCat;
      const q = curQuery.toLowerCase();
      const matchQ = !q || p.name.toLowerCase().includes(q) || p.shortName.toLowerCase().includes(q) || p.highlights.some(h => h.toLowerCase().includes(q));
      return matchCat && matchQ;
    });

    if (curSort === 'price-asc') list.sort((a, b) => a.price - b.price);
    else if (curSort === 'price-desc') list.sort((a, b) => b.price - a.price);
    else if (curSort === 'rating') list.sort((a, b) => b.rating - a.rating);
    else list.sort((a, b) => b.soldCount - a.soldCount);

    if (countLbl) countLbl.textContent = `Hiển thị ${list.length} / 30 sản phẩm chính hãng`;

    if (list.length === 0) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:48px 20px;background:var(--surface);border-radius:var(--r-lg);border:1px solid var(--line)">
          <h3 style="margin-bottom:8px">Không tìm thấy sản phẩm phù hợp</h3>
          <p style="color:var(--ink-soft);margin-bottom:16px">Hãy thử từ khóa khác hoặc xem toàn bộ 30 sản phẩm của Golden Pharma.</p>
          <button type="button" class="btn btn--primary btn--sm" id="resetShopBtn">Xem tất cả 30 sản phẩm</button>
        </div>`;
      document.getElementById('resetShopBtn')?.addEventListener('click', () => {
        curCat = 'all'; curQuery = '';
        if (searchInput) searchInput.value = '';
        catBar?.querySelectorAll('[data-shop-cat]').forEach(b => b.classList.toggle('is-active', b.dataset.shopCat === 'all'));
        render();
      });
      return;
    }

    grid.innerHTML = list.map(renderProductCard).join('');
    bindProductCardEvents(grid);
  };

  if (catBar) {
    catBar.innerHTML = DATA.categories.map(c => `
      <button type="button" class="f-pill${c.id === curCat ? ' is-active' : ''}" data-shop-cat="${c.id}">
        ${c.name} (${c.count})
      </button>
    `).join('');
    catBar.querySelectorAll('[data-shop-cat]').forEach(b => {
      b.addEventListener('click', () => {
        catBar.querySelectorAll('[data-shop-cat]').forEach(x => x.classList.remove('is-active'));
        b.classList.add('is-active');
        curCat = b.dataset.shopCat;
        render();
      });
    });
  }

  searchInput?.addEventListener('input', e => {
    curQuery = e.target.value.trim();
    render();
  });
  sortSelect?.addEventListener('change', e => {
    curSort = e.target.value;
    render();
  });

  render();
}

/* ==========================================================================
   Trang Chi Tiết Sản Phẩm (chi-tiet-san-pham.html) — Bố cục sample-product.png
   ========================================================================== */
function initProductDetailPage() {
  const root = document.getElementById('pdpRoot');
  if (!root) return;
  const id = new URLSearchParams(location.search).get('id') || '01';
  const p = prodById[id] || DATA.products[0];
  const cat = catById[p.category] || { id: 'all', name: 'Sản phẩm' };
  document.title = `${p.shortName} — GOLDEN PHARMA`;

  let curVar = p.variations[0];
  let curQty = 1;
  let curImgIdx = 0;

  root.innerHTML = `
    <nav style="font-size:13.5px;color:var(--ink-soft);margin-bottom:20px;display:flex;flex-wrap:wrap;gap:8px;align-items:center">
      <a href="index.html">Trang chủ</a> <span>/</span>
      <a href="san-pham.html?cat=${cat.id}">${cat.name}</a> <span>/</span>
      <strong style="color:var(--ink)">${p.shortName}</strong>
    </nav>

    <div class="pdp">
      <!-- Cột trái: Bộ ảnh chuẩn sample-product.png (Ảnh chính lớn bo góc + nút Play 3D + hàng thumbnail bo góc) -->
      <div class="pdp-gallery">
        <div class="pdp-main" id="pdpMainBox" title="Bấm vào ảnh để phóng to Lightbox">
          <img class="pdp-main__img" id="pdpMainImg" src="${resolveImg(p.gallery?.[0], 1000)}" alt="${p.name}" width="640" height="640">
          <button type="button" class="pdp-play-btn" id="pdpPlayBtn" title="Bấm để xem hiệu ứng chuyển động 3D sản phẩm" aria-label="Xem chuyển động sản phẩm">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7L8 5Z"/></svg>
          </button>
        </div>

        <div class="pdp-thumbs">
          ${p.gallery.map((g, idx) => `
            <button type="button" class="pdp-thumb${idx === 0 ? ' is-active' : ''}" data-pdp-thumb="${idx}" aria-label="Ảnh góc ${idx + 1}">
              <img src="${resolveImg(g, 400)}" alt="${p.shortName} góc ${idx + 1}" width="120" height="120">
            </button>
          `).join('')}
          <button type="button" class="pdp-thumb pdp-thumb--more" id="pdpOpenLightbox">
            <span>🔍 Xem thêm<br>${p.gallery.length} ảnh lớn</span>
          </button>
        </div>
      </div>

      <!-- Cột phải: Thông tin & Mua hàng -->
      <div class="pdp-info">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
          <span class="eyebrow" style="margin:0">${p.brand} · Mã ${p.code}</span>
          <span style="font-size:13px;color:var(--emerald);font-weight:700">✓ Còn hàng · Giao toàn quốc</span>
        </div>

        <h1 class="pdp-info__title">${p.name}</h1>

        <div class="pdp-info__stats">
          <span style="color:#D98A00;font-weight:800">★★★★★ ${p.rating}</span>
          <span>(${p.reviews} đánh giá)</span>
          <span>·</span>
          <span>Đã bán: <b>${p.soldText}</b> trên TikTok Shop</span>
          <span>·</span>
          <span>SKU: <b id="pdpSku">${curVar.sku}</b></span>
        </div>

        <div class="pdp-info__price-box">
          <span class="pdp-info__price" id="pdpPrice">${fmtVND(curVar.price)}</span>
          ${p.originalPrice > curVar.price ? `<span class="pdp-info__old">${fmtVND(p.originalPrice)}</span>` : ''}
          <span class="p-badge">Giá niêm yết chính hãng</span>
        </div>

        <ul style="display:grid;gap:8px;margin-bottom:22px;font-size:14.5px">
          ${p.highlights.map(h => `<li style="display:flex;align-items:center;gap:8px"><span style="color:var(--emerald);font-weight:800">✓</span> <span>${h}</span></li>`).join('')}
        </ul>

        <div class="var-group">
          <span class="var-group__lbl">Chọn quy cách đóng gói:</span>
          <div class="var-list" id="pdpVarList">
            ${p.variations.map((v, idx) => `
              <button type="button" class="var-btn${idx === 0 ? ' is-active' : ''}" data-var-idx="${idx}">
                ${v.label} — ${fmtVND(v.price)}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="qty-row">
          <span style="font-size:13.5px;font-weight:700;color:var(--ink-soft)">Số lượng:</span>
          <div class="qty-ctrl">
            <button type="button" id="pdpQtyMinus" aria-label="Giảm">−</button>
            <input type="number" id="pdpQtyInput" value="1" min="1" max="999" aria-label="Số lượng">
            <button type="button" id="pdpQtyPlus" aria-label="Tăng">+</button>
          </div>
          <span style="font-size:13px;color:var(--ink-muted)">Mua sỉ / đại lý: gọi <a href="${SITE.phoneHref}" style="color:var(--emerald);font-weight:700">${SITE.phone}</a></span>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:10px">
          <button type="button" class="btn btn--primary" id="pdpAddCart">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6h15l-1.5 9h-12L6 6Z"/><path d="M12 9v4m-2-2h4"/></svg>
            <span>Thêm vào giỏ</span>
          </button>
          <button type="button" class="btn btn--gold" id="pdpBuyNow">
            <span>Mua ngay (COD)</span> →
          </button>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px">
          <a href="${SITE.shopee}" target="_blank" rel="noopener" class="btn btn--shopee" style="justify-content:center">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M6 7h12l-1 13H7L6 7Z"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/><path d="M9.5 12.5c.3 1.2 1.3 2 2.5 2s2.2-.8 2.5-2"/></svg>
            <span>Mua trên Shopee</span>
          </a>
          <a href="${SITE.tiktok}" target="_blank" rel="noopener" class="btn btn--outline" style="justify-content:center">
            <span>Mua trên TikTok Shop ↗</span>
          </a>
        </div>

        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding-top:16px;border-top:1px solid var(--line);font-size:12.5px;color:var(--ink-soft);text-align:center">
          <div style="background:var(--ivory);padding:10px;border-radius:10px">🛡️ <b>Chính hãng 100%</b><br>Chuẩn TCCS / GMP</div>
          <div style="background:var(--ivory);padding:10px;border-radius:10px">🚚 <b>Giao nhanh toàn quốc</b><br>Kiểm hàng trước khi trả</div>
          <div style="background:var(--ivory);padding:10px;border-radius:10px">👩‍⚕️ <b>Bác sĩ thú y</b><br>Tư vấn phác đồ 24/7</div>
        </div>
      </div>
    </div>

    <!-- Thông tin chi tiết từ products.xlsx -->
    <div class="pdp-desc">
      <h3>Thông tin chi tiết, thành phần & hướng dẫn sử dụng</h3>
      <div class="pdp-desc__content">
        ${p.descriptionHtml || `<p>${p.name}</p>`}
      </div>
    </div>
  `;

  // Events
  const mainBox = document.getElementById('pdpMainBox');
  const mainImg = document.getElementById('pdpMainImg');
  const playBtn = document.getElementById('pdpPlayBtn');

  playBtn?.addEventListener('click', e => {
    e.stopPropagation();
    const spinning = mainBox.classList.toggle('is-spinning');
    playBtn.innerHTML = spinning
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>`
      : `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7L8 5Z"/></svg>`;
  });

  mainBox?.addEventListener('click', () => openLightbox(p.id, curImgIdx));
  document.getElementById('pdpOpenLightbox')?.addEventListener('click', () => openLightbox(p.id, curImgIdx));

  root.querySelectorAll('[data-pdp-thumb]').forEach(btn => {
    btn.addEventListener('click', () => {
      curImgIdx = Number(btn.dataset.pdpThumb);
      root.querySelectorAll('[data-pdp-thumb]').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      mainImg.src = resolveImg(p.gallery?.[curImgIdx], 1000);
    });
  });

  root.querySelectorAll('[data-var-idx]').forEach(btn => {
    btn.addEventListener('click', () => {
      root.querySelectorAll('[data-var-idx]').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      curVar = p.variations[Number(btn.dataset.varIdx)] || p.variations[0];
      document.getElementById('pdpPrice').textContent = fmtVND(curVar.price);
      document.getElementById('pdpSku').textContent = curVar.sku;
    });
  });

  const qtyIn = document.getElementById('pdpQtyInput');
  document.getElementById('pdpQtyMinus')?.addEventListener('click', () => {
    curQty = Math.max(1, (Number(qtyIn.value) || 1) - 1);
    qtyIn.value = curQty;
  });
  document.getElementById('pdpQtyPlus')?.addEventListener('click', () => {
    curQty = (Number(qtyIn.value) || 1) + 1;
    qtyIn.value = curQty;
  });

  document.getElementById('pdpAddCart')?.addEventListener('click', () => {
    addToCart(p.id, curVar.label, Number(qtyIn.value) || 1, true);
  });
  document.getElementById('pdpBuyNow')?.addEventListener('click', () => {
    addToCart(p.id, curVar.label, Number(qtyIn.value) || 1, false);
    location.href = 'thanh-toan.html';
  });

  // Related products
  const relGrid = document.getElementById('relatedProdGrid');
  if (relGrid) {
    const rel = DATA.products.filter(x => x.id !== p.id && x.category === p.category).slice(0, 4);
    const fallback = rel.length >= 4 ? rel : [...rel, ...DATA.products.filter(x => x.id !== p.id)].slice(0, 4);
    relGrid.innerHTML = fallback.map(renderProductCard).join('');
    bindProductCardEvents(relGrid);
  }
}

/* ==========================================================================
   Trang Đặt Hàng (thanh-toan.html) & Xác Nhận Đơn (xac-nhan-don.html)
   ========================================================================== */
function initCheckoutPage() {
  const sumList = document.getElementById('coSummaryList');
  const sumTotal = document.getElementById('coTotalValue');
  const form = document.getElementById('checkoutForm');
  if (!sumList || !form) return;

  const { cart, total } = getCartTotals();
  if (cart.length === 0) {
    // Nếu khách bấm thẳng vào trang thanh toán khi giỏ trống, nạp sẵn 1 gói GP-GUARD mẫu để khách duyệt thử luồng đặt hàng
    addToCart('01', null, 1, false);
  }
  const state = getCartTotals();
  sumList.innerHTML = state.cart.map(i => `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding-block:10px;border-bottom:1px dashed var(--line)">
      <div style="display:flex;align-items:center;gap:10px">
        <img src="${i.img}" alt="${i.name}" width="52" height="52" style="border-radius:10px;border:1px solid var(--line);background:#fff;padding:3px">
        <div>
          <div style="font-weight:700;font-size:14px">${i.name}</div>
          <div style="font-size:12px;color:var(--ink-soft)">Quy cách: ${i.varLabel} × <b>${i.qty}</b></div>
        </div>
      </div>
      <strong style="color:var(--emerald)">${fmtVND(i.price * i.qty)}</strong>
    </div>
  `).join('');
  if (sumTotal) sumTotal.textContent = fmtVND(state.total);

  form.addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(form);
    const order = {
      code: 'GP' + Math.floor(100000 + Math.random() * 900000),
      date: new Date().toLocaleString('vi-VN'),
      customer: {
        name: fd.get('fullname') || 'Khách hàng Golden Pharma',
        phone: fd.get('phone') || '',
        address: fd.get('address') || '',
        note: fd.get('note') || '',
        payment: fd.get('payment') || 'COD — Thanh toán khi nhận hàng',
      },
      items: state.cart,
      total: state.total,
    };
    localStorage.setItem('gp_last_order', JSON.stringify(order));
    localStorage.removeItem(CART_KEY);
    location.href = 'xac-nhan-don.html';
  });
}

function initOrderSuccessPage() {
  const box = document.getElementById('orderSuccessBox');
  if (!box) return;
  let order = null;
  try { order = JSON.parse(localStorage.getItem('gp_last_order')); } catch {}
  if (!order) {
    order = {
      code: 'GP868920',
      date: new Date().toLocaleString('vi-VN'),
      customer: { name: 'Trang Trại Chăn Nuôi Mẫu', phone: '0968486985', address: 'Đại Thanh, Hà Nội', payment: 'Thanh toán khi nhận hàng (COD)' },
      items: [{ name: 'GP-GUARD Bột Rắc Chuồng', varLabel: '1kg', qty: 2, price: 38999 }],
      total: 77998
    };
  }
  box.innerHTML = `
    <div style="width:68px;height:68px;border-radius:50%;background:rgba(14,107,58,0.12);color:var(--emerald);display:grid;place-items:center;font-size:32px;font-weight:800;margin-inline:auto;margin-bottom:16px">✓</div>
    <span class="eyebrow">Đặt hàng thành công</span>
    <h1 class="h2" style="margin-bottom:8px">Cảm ơn ${order.customer.name} đã đặt hàng!</h1>
    <p style="color:var(--ink-soft);margin-bottom:24px">Mã đơn hàng: <b style="color:var(--emerald)">#${order.code}</b> · Bộ phận CSKH Golden Pharma sẽ gọi xác nhận qua số <b>${order.customer.phone}</b> trong ít phút.</p>
    <div style="text-align:left;background:var(--ivory);padding:20px;border-radius:var(--r-md);margin-bottom:24px;display:grid;gap:8px;font-size:14.5px">
      <div><b>Người nhận:</b> ${order.customer.name} (${order.customer.phone})</div>
      <div><b>Địa chỉ nhận hàng:</b> ${order.customer.address}</div>
      <div><b>Hình thức thanh toán:</b> ${order.customer.payment}</div>
      <div><b>Tổng thanh toán:</b> <strong style="color:var(--emerald);font-size:18px">${fmtVND(order.total)}</strong></div>
    </div>
    <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:12px">
      <a href="san-pham.html" class="btn btn--primary">Tiếp tục mua sắm</a>
      <a href="${SITE.zalo}" target="_blank" rel="noopener" class="btn btn--outline">Nhắn Zalo hỗ trợ đơn hàng</a>
    </div>
  `;
}

/* ==========================================================================
   Khởi tạo Cuộn Mượt & Reveal 60fps
   ========================================================================== */
function initSmoothAndReveal() {
  // Desktop: dùng Lenis mượt; Mobile/Touch: dùng native scroll để đạt độ nhạy ngón tay 100%
  if (window.Lenis && !reduced() && !window.matchMedia('(pointer: coarse)').matches) {
    const lenis = new Lenis({ lerp: 0.11, smoothWheel: true });
    if (window.gsap && window.ScrollTrigger) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = time => { lenis.raf(time); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  if (window.gsap && window.ScrollTrigger && !reduced()) {
    gsap.registerPlugin(ScrollTrigger);
    document.querySelectorAll('[data-reveal]').forEach(el => {
      gsap.fromTo(el,
        { opacity: 0, y: 24 },
        {
          opacity: 1, y: 0, duration: 0.6, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true }
        }
      );
    });
  }
}

/* ==========================================================================
   Đồng bộ dữ liệu động từ Server / KV (hoặc Cache)
   ========================================================================== */
async function syncDynamicData() {
  try {
    const res = await fetch('/api/data');
    if (res.ok) {
      const data = await res.json();
      if (data.products && Array.isArray(data.products) && data.products.length) {
        DATA.products = data.products;
        Object.keys(prodById).forEach(k => delete prodById[k]);
        DATA.products.forEach(p => { prodById[p.id] = p; });
      }
      if (data.categories && Array.isArray(data.categories)) {
        DATA.categories = data.categories;
        Object.keys(catById).forEach(k => delete catById[k]);
        DATA.categories.forEach(c => { catById[c.id] = c; });
      }
      if (data.site) {
        Object.assign(SITE, data.site);
      }
      if (data.content) {
        applyDynamicContent(data.content);
      }
      return;
    }
  } catch (e) {}

  // Fallback từ localStorage nếu xem offline / static
  try {
    const cachedProds = JSON.parse(localStorage.getItem('gp_custom_products') || 'null');
    if (cachedProds && Array.isArray(cachedProds) && cachedProds.length) {
      DATA.products = cachedProds;
      Object.keys(prodById).forEach(k => delete prodById[k]);
      DATA.products.forEach(p => { prodById[p.id] = p; });
    }
    const cachedSite = JSON.parse(localStorage.getItem('gp_custom_site') || 'null');
    if (cachedSite) Object.assign(SITE, cachedSite);
    const cachedContent = JSON.parse(localStorage.getItem('gp_custom_content') || 'null');
    if (cachedContent) applyDynamicContent(cachedContent);
  } catch (err) {}
}

function applyDynamicContent(c) {
  if (!c) return;
  const eyebrowEl = document.querySelector('[data-i18n="hero_eyebrow"]');
  if (eyebrowEl && c.heroEyebrow) eyebrowEl.textContent = c.heroEyebrow;
  const titleEl = document.querySelector('[data-i18n="hero_title"]');
  if (titleEl && c.heroTitle) titleEl.innerHTML = c.heroTitle;
  const descEl = document.querySelector('[data-i18n="hero_desc"]');
  if (descEl && c.heroDesc) descEl.textContent = c.heroDesc;
  const searchEl = document.querySelector('[data-i18n-ph="hero_search_ph"]');
  if (searchEl && c.heroSearchPh) searchEl.placeholder = c.heroSearchPh;

  // Thống kê metrics
  const m1 = document.querySelector('[data-i18n="hero_m1"]')?.previousElementSibling;
  if (m1 && c.heroM1Value) m1.textContent = c.heroM1Value;
  const m2 = document.querySelector('[data-i18n="hero_m2"]')?.previousElementSibling;
  if (m2 && c.heroM2Value) m2.textContent = c.heroM2Value;
  const m3 = document.querySelector('[data-i18n="hero_m3"]')?.previousElementSibling;
  if (m3 && c.heroM3Value) m3.textContent = c.heroM3Value;

  // Tiêu đề các phần
  const catTitle = document.querySelector('[data-i18n="sec_cat_title"]');
  if (catTitle && c.secCatTitle) catTitle.textContent = c.secCatTitle;
  const spotTitle = document.querySelector('[data-i18n="sec_spot_title"]');
  if (spotTitle && c.secSpotTitle) spotTitle.textContent = c.secSpotTitle;
  const bestTitle = document.querySelector('[data-i18n="sec_best_title"]');
  if (bestTitle && c.secBestTitle) bestTitle.textContent = c.secBestTitle;
  const trustTitle = document.querySelector('[data-i18n="sec_trust_title"]');
  if (trustTitle && c.secTrustTitle) trustTitle.textContent = c.secTrustTitle;
}

/* ==========================================================================
   Boot
   ========================================================================== */
document.addEventListener('DOMContentLoaded', async () => {
  await syncDynamicData();
  mountChrome();
  const page = document.body.dataset.page || '';
  if (page === 'home') initHomePage();
  if (page === 'shop') initShopPage();
  if (page === 'detail') initProductDetailPage();
  if (page === 'checkout') initCheckoutPage();
  if (page === 'success') initOrderSuccessPage();

  // Form liên hệ
  const cForm = document.getElementById('contactForm');
  if (cForm) {
    cForm.addEventListener('submit', e => {
      e.preventDefault();
      const msg = document.getElementById('contactSuccessMsg');
      if (msg) msg.style.display = 'block';
      cForm.reset();
      showToast('Đã gửi yêu cầu tư vấn thành công!');
    });
  }

  initSmoothAndReveal();
});
