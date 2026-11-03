/**
 * CPES ATi Interactive 3D Flipbook Brochure
 * Biến brochure ATi thành sách lật 3D tương tác sống động,
 * chứa sản phẩm thực tế có thể click xem chi tiết hoặc nhận báo giá.
 */

const ATI_BOOK_PAGES = [
  {
    type: 'cover',
    title: 'ATi Water Quality Monitors',
    subtitle: 'Hệ thống thiết bị đo & giám sát chất lượng nước thông minh',
    tagline: 'Brochure Tổng Quan & Danh Mục Sản Phẩm 2026',
    desc: 'Giải pháp giám sát khí độc & chất lượng nước hàng đầu từ Analytical Technology, Inc. (ATi) - Phân phối chính hãng bởi CPE Solutions.',
    coverImg: 'assets/img/ati/trang-01.webp',
    stats: [
      { num: '30+', label: 'Năm kinh nghiệm ATi' },
      { num: '60+', label: 'Chỉ tiêu đo đạc' },
      { num: '100%', label: 'Chính hãng từ CPES' }
    ]
  },
  {
    type: 'intro',
    title: 'Về Analytical Technology (ATi)',
    subtitle: 'Tiên phong toàn cầu về cảm biến điện hóa & quang học',
    text: 'Analytical Technology, Inc. (ATi) là nhà sản xuất hàng đầu thế giới chuyên về các thiết bị phân tích nước và hệ thống phát hiện khí độc hại. Các sản phẩm của ATi nổi tiếng nhờ độ bền vượt trội, công nghệ cảm biến tự làm sạch AutoClean và khả năng đo đạc chính xác trong các điều kiện công nghiệp khắc nghiệt nhất.',
    highlights: [
      'Cảm biến điện hóa màng thẩm thấu độc quyền',
      'Công nghệ AutoClean tự động sục rửa định kỳ',
      'Tích hợp Modbus, Profibus, 4-20mA và IoT Cloud',
      'Đạt chuẩn chống cháy nổ ATEX / IECEx / CSA'
    ],
    bgImg: 'assets/img/ati/trang-02.webp'
  },
  {
    type: 'product',
    productId: 1001,
    title: 'Q46H/62 Thiết Bị Đo Clo Dư Tự Do',
    series: 'Q46H Chlorine Series',
    badge: 'Bán chạy nhất cho nước cấp',
    desc: 'Hệ thống đo Clo dư tự do liên tục không cần hóa chất đệm reagent. Sử dụng cảm biến màng phân cực thế 3 cực và hệ thống làm sạch dòng chảy tự động.',
    features: [
      'Không dùng hóa chất, giảm 90% chi phí vận hành',
      'Dải đo: 0-200.0 ppb đến 0-200.0 ppm',
      'Độ chính xác cao, bù nhiệt độ tự động PT1000',
      'Ngõ ra: 2 x 4-20mA cách ly, 3 rơ-le cảnh báo SPDT'
    ],
    img: 'assets/img/ati/products/ati-q46h-chlorine.png',
    pdfPage: 'assets/img/ati/trang-03.webp'
  },
  {
    type: 'product',
    productId: 1002,
    title: 'Q46H/64 Thiết Bị Đo Ozone Hòa Tan',
    series: 'Q46H Ozone Series',
    badge: 'Độ nhạy cực cao',
    desc: 'Thiết bị giám sát nồng độ Ozone hòa tan liên tục trong các hệ thống khử trùng nước tinh khiết, dược phẩm, đóng chai và xử lý nước thải cao cấp.',
    features: [
      'Cảm biến màng chọn lọc Ozone không bị ảnh hưởng bởi Clo',
      'Dải đo tùy chọn từ 0-200 ppb đến 0-200 ppm',
      'Tùy chọn sục rửa tự động AutoClean bằng khí nén',
      'Màn hình LCD đồ họa có đèn nền lớn, chuẩn IP66'
    ],
    img: 'assets/img/ati/products/ati-q46h-chlorine.png',
    pdfPage: 'assets/img/ati/trang-04.webp'
  },
  {
    type: 'product',
    productId: 1003,
    title: 'Q46D Thiết Bị Đo Oxy Hòa Tan (DO)',
    series: 'Q46 Optical & Galvanic DO',
    badge: 'Chuyên dụng xử lý nước thải',
    desc: 'Giám sát DO trong bể hiếu khí Aerotank, kiểm soát quạt thổi khí tiết kiệm đến 40% điện năng tiêu thụ cho trạm xử lý nước thải tập trung.',
    features: [
      'Công nghệ quang học huỳnh quang hoặc màng Galvanic độ bền cao',
      'Đo cả nồng độ ppm/mg/L và độ bão hòa % Saturation',
      'Tích hợp AutoClean chống bám cặn vi sinh và bùn hoạt tính',
      'Bền bỉ trong môi trường bùn đậm đặc và hóa chất'
    ],
    img: 'assets/img/ati/products/ati-q46d-do.png',
    pdfPage: 'assets/img/ati/trang-05.webp'
  },
  {
    type: 'product',
    productId: 1004,
    title: 'Q46P & Q46R Thiết Bị Đo pH / ORP Công Nghiệp',
    series: 'Q46 Electrochemistry Series',
    badge: 'Cảm biến vi sai Differential',
    desc: 'Hệ thống đo pH và thế oxy hóa khử ORP với công nghệ điện cực so sánh vi sai (Differential pH) khử hoàn toàn hiện tượng dòng rò đất và nghẹt cầu muối.',
    features: [
      'Công nghệ điện cực vi sai (Differential Sensor) bền gấp 3 lần',
      'Điện cực PEEK / Ryton chịu hóa chất và nhiệt độ cao',
      'Tích hợp cảm biến nhiệt độ PT1000 giải bù nhiệt toàn dải',
      'Chuẩn chống bụi nước NEMA 4X / IP66 lắp ngoài trời'
    ],
    img: 'assets/img/ati/products/ati-q46p-ph.png',
    pdfPage: 'assets/img/ati/trang-06.webp'
  },
  {
    type: 'product',
    productId: 1005,
    title: 'MetriNet Mạng Lưới Quan Trắc Nước Đa Chỉ Tiêu Thông Minh',
    series: 'MetriNet Modular Water Network',
    badge: 'Smart Water / IoT Đột Phá',
    desc: 'Hệ sinh thái quan trắc phân tán dạng mô-đun gắn trên mạng lưới cấp nước đô thị. Sử dụng các cảm biến M-Node siêu nhỏ tiết kiệm điện năng.',
    features: [
      'Cảm biến M-Node đo tới 16 chỉ tiêu nước đồng thời',
      'Tiết kiệm điện năng tối đa, chạy bằng pin hoặc Solar panel',
      'Truyền thông không dây 4G/5G/NB-IoT về đám mây CPES Cloud',
      'Lắp đặt trực tiếp trên đường ống phân phối áp lực cao'
    ],
    img: 'assets/img/ati/products/ati-metrinet-system.png',
    pdfPage: 'assets/img/ati/trang-07.webp'
  },
  {
    type: 'product',
    productId: 1006,
    title: 'Q46N Đo Độ Đục Trực Tuyến & Cặn Lơ Lửng (TSS)',
    series: 'Q46 Optical Turbidity',
    badge: 'Chuẩn ISO 7027 & EPA',
    desc: 'Đo độ đục dải thấp cho nước uống và dải cao cho cặn lơ lửng nước thải bằng quang học hồng ngoại 860nm tán xạ góc 90 độ.',
    features: [
      'Hệ quang học hồng ngoại 860nm không phụ thuộc màu sắc nước',
      'Dải đo từ 0.001 NTU đến 4000 NTU / ppm TSS',
      'Buồng đo Bubble Trap loại bỏ triệt để bọt khí gây sai số',
      'Tùy chọn tự làm sạch cơ học cần gạt wiper định kỳ'
    ],
    img: 'assets/img/ati/products/ati-q46c4-cond.png',
    pdfPage: 'assets/img/ati/trang-08.webp'
  },
  {
    type: 'product',
    productId: 1007,
    title: 'Q46F Thiết Bị Đo Flo Dư Tự Do (Fluoride Monitor)',
    series: 'Q46 Ion Selective ISE',
    badge: 'Chuyên dụng cấp nước sinh hoạt',
    desc: 'Giám sát và kiểm soát nồng độ Flo cho vào nước uống sinh hoạt tại nhà máy nước, bảo vệ men răng và sức khỏe cộng đồng theo QCVN 01-1:2018/BYT.',
    features: [
      'Cảm biến điện cực chọn lọc ion Lanthanum Fluoride (ISE)',
      'Hệ định lượng đệm TISAB tự động ổn định lực ion và pH',
      'Đo chính xác từ 0.1 đến 10.0 ppm F-',
      'Hiển thị trực quan và lưu trữ lịch sử dữ liệu'
    ],
    img: 'assets/img/ati/products/ati-q46f-fluoride.png',
    pdfPage: 'assets/img/ati/trang-09.webp'
  },
  {
    type: 'product',
    productId: 1008,
    title: 'D12 Thiết Bị Phát Hiện & Cảnh Báo Khí Độc Công Nghiệp',
    series: 'Toxic Gas Detection',
    badge: 'Chuẩn chống nổ ATEX / IECEx',
    desc: 'Hệ thống cảm biến đo và cảnh báo rò rỉ khí độc hại Cl2, SO2, NH3, H2S, O3 trong các trạm khử trùng nhà máy nước và khu vực nguy hiểm.',
    features: [
      'Đo hơn 60 loại khí độc hại và khí dễ cháy nổ',
      'Vỏ máy chuẩn chống cháy nổ Class 1 Div 1 & ATEX',
      'Tự động kiểm tra tính toàn vẹn của cảm biến Auto-Test',
      'Tín hiệu 4-20mA, Relay cảnh báo và Modbus RTU'
    ],
    img: 'assets/img/ati/products/ati-d12-gas.png',
    pdfPage: 'assets/img/ati/trang-10.webp'
  },
  {
    type: 'backcover',
    title: 'Liên Hệ Phân Phối & Dịch Vụ ATi',
    subtitle: 'Công ty TNHH Giải Pháp CPE (CPE Solutions)',
    desc: 'CPES là đối tác công nghệ và đại diện phân phối chính thức các dòng sản phẩm s::can và ATi tại thị trường Việt Nam. Chúng tôi cam kết dịch vụ kỹ thuật chuyên sâu, hiệu chuẩn định kỳ và phụ tùng thay thế sẵn có.',
    contactInfo: [
      { icon: 'fas fa-map-marker-alt', label: 'Địa chỉ', value: '490 Phạm Thái Bường, Tân Phong, Q.7, TP.HCM' },
      { icon: 'fas fa-phone-alt', label: 'Hotline kỹ thuật', value: '(+84) 942 537 025' },
      { icon: 'fas fa-envelope', label: 'Email báo giá', value: 'Sales@cpes.vn' },
      { icon: 'fas fa-globe', label: 'Website chính thức', value: 'https://cpes.vn' }
    ],
    pdfPage: 'assets/img/ati/trang-11.webp'
  }
];

class ATiFlipBook {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;
    this.currentPage = 0;
    this.totalPages = ATI_BOOK_PAGES.length;
    this.init();
  }

  init() {
    this.render();
    this.bindEvents();
    this.updateControls();
  }

  render() {
    this.container.innerHTML = `
      <div class="ati-book-wrapper">
        <div class="ati-book-header">
          <div class="ati-book-badge">
            <span class="pulse-dot"></span>
            <span>Brochure ATi Tương Tác 3D &bull; Danh mục sản phẩm trực tuyến</span>
          </div>
          <div class="ati-book-actions">
            <a href="assets/doc/ati-brochure-vietnamese.pdf" download="ATi-brochure-Vietnamese.pdf" class="btn btn-outline-white btn-sm" title="Tải PDF gốc">
              <i class="fas fa-file-pdf"></i> <span>Tải PDF gốc (11 trang)</span>
            </a>
          </div>
        </div>

        <div class="ati-3d-stage">
          <div class="ati-book" id="atiBook">
            <!-- Dynamic pages will be inserted here -->
          </div>
        </div>

        <div class="ati-book-toolbar">
          <div class="ati-toolbar-left">
            <button class="btn-book-nav" id="btnBookPrev" title="Trang trước">
              <i class="fas fa-chevron-left"></i> Trang trước
            </button>
            <span class="ati-page-indicator" id="atiPageIndicator">Trang 1 / ${this.totalPages}</span>
            <button class="btn-book-nav" id="btnBookNext" title="Trang kế tiếp">
              Trang sau <i class="fas fa-chevron-right"></i>
            </button>
          </div>
          <div class="ati-page-thumbnails" id="atiThumbnails">
            <!-- Thumbnail list -->
          </div>
        </div>
      </div>
    `;

    this.renderPages();
    this.renderThumbnails();
  }

  renderPages() {
    const bookEl = document.getElementById('atiBook');
    if (!bookEl) return;

    bookEl.innerHTML = ATI_BOOK_PAGES.map((page, index) => {
      let contentHtml = '';

      if (page.type === 'cover') {
        contentHtml = `
          <div class="book-page-content page-cover">
            <div class="cover-glow"></div>
            <div class="cover-brand">
              <div class="brand-chip"><i class="fas fa-microchip"></i> ANALYTICAL TECHNOLOGY, INC.</div>
              <span class="cpes-badge">Phân phối bởi CPES</span>
            </div>
            <h2 class="cover-title">${page.title}</h2>
            <p class="cover-subtitle">${page.subtitle}</p>
            <div class="cover-image-container">
              <img src="${page.coverImg}" alt="${page.title}" class="cover-image" onerror="this.src='assets/img/ati/page-01.webp'">
            </div>
            <p class="cover-desc">${page.desc}</p>
            <div class="cover-stats">
              ${page.stats.map(s => `
                <div class="c-stat">
                  <strong>${s.num}</strong>
                  <span>${s.label}</span>
                </div>
              `).join('')}
            </div>
            <div class="cover-hint">
              <span><i class="fas fa-hand-pointer"></i> Lật trang để xem sản phẩm hoặc bấm "Trang sau"</span>
            </div>
          </div>
        `;
      } else if (page.type === 'intro') {
        contentHtml = `
          <div class="book-page-content page-intro">
            <div class="intro-header">
              <span class="page-tag"><i class="fas fa-info-circle"></i> Giới thiệu thương hiệu</span>
              <h3 class="page-title">${page.title}</h3>
              <p class="page-subtitle">${page.subtitle}</p>
            </div>
            <div class="intro-body">
              <p class="intro-text">${page.text}</p>
              <div class="intro-highlights">
                <h4>Đặc điểm công nghệ cốt lõi:</h4>
                <ul>
                  ${page.highlights.map(h => `<li><i class="fas fa-check-circle"></i> ${h}</li>`).join('')}
                </ul>
              </div>
              <div class="intro-preview-card">
                <img src="${page.bgImg}" alt="ATi Brochure" class="intro-bg-img" onerror="this.src='assets/img/ati/page-02.webp'">
              </div>
            </div>
          </div>
        `;
      } else if (page.type === 'product') {
        contentHtml = `
          <div class="book-page-content page-product">
            <div class="product-header">
              <div class="product-top-row">
                <span class="series-badge">${page.series}</span>
                <span class="feature-badge">${page.badge}</span>
              </div>
              <h3 class="product-name">${page.title}</h3>
            </div>
            
            <div class="product-main-view">
              <div class="product-img-box">
                <img src="${page.img}" alt="${page.title}" class="product-img" onerror="this.src='${page.pdfPage}'">
                <span class="zoom-pill"><i class="fas fa-search-plus"></i> Ảnh trích xuất thực tế</span>
              </div>
              <div class="product-info-box">
                <p class="product-desc">${page.desc}</p>
                <div class="product-features-list">
                  <h5>Ưu điểm kỹ thuật nổi bật:</h5>
                  <ul>
                    ${page.features.map(f => `<li><i class="fas fa-angle-right"></i> ${f}</li>`).join('')}
                  </ul>
                </div>
              </div>
            </div>

            <div class="product-actions-bar">
              <a href="chi-tiet-san-pham.html?id=${page.productId}" class="btn btn-primary btn-sm">
                <i class="fas fa-info-circle"></i> Xem chi tiết & Thông số
              </a>
              <button class="btn btn-warning btn-sm btn-quote-product" data-product-id="${page.productId}" data-product-title="${page.title}">
                <i class="fas fa-paper-plane"></i> Nhận báo giá ngay
              </button>
              <a href="${page.pdfPage}" target="_blank" class="btn btn-outline-white btn-sm" title="Xem trang brochure gốc độ phân giải cao">
                <i class="fas fa-expand-arrows-alt"></i> Trang PDF gốc
              </a>
            </div>
          </div>
        `;
      } else if (page.type === 'backcover') {
        contentHtml = `
          <div class="book-page-content page-backcover">
            <div class="backcover-brand">
              <img src="assets/img/brand/logo-cpes-ngang.webp" alt="CPES Logo" class="backcover-logo">
              <h3>${page.subtitle}</h3>
              <p class="backcover-desc">${page.desc}</p>
            </div>
            <div class="contact-card-grid">
              ${page.contactInfo.map(c => `
                <div class="contact-item">
                  <div class="c-icon"><i class="${c.icon}"></i></div>
                  <div class="c-info">
                    <span class="c-label">${c.label}</span>
                    <strong class="c-val">${c.value}</strong>
                  </div>
                </div>
              `).join('')}
            </div>
            <div class="backcover-actions">
              <a href="lien-he.html" class="btn btn-primary">
                <i class="fas fa-phone-volume"></i> Đặt lịch tư vấn kỹ thuật
              </a>
              <a href="#scan" class="btn btn-outline-white">
                <i class="fas fa-arrow-up"></i> Khám phá dòng sản phẩm s::can
              </a>
            </div>
          </div>
        `;
      }

      const activeClass = index === 0 ? 'active' : (index < 0 ? 'flipped' : '');
      return `
        <div class="ati-page ${activeClass}" data-page-index="${index}" id="atiPage_${index}">
          <div class="page-inner">
            <div class="page-header-strip">
              <span class="ph-left"><i class="fas fa-book-open"></i> ATi Water Technologies</span>
              <span class="ph-right">Trang ${index + 1} / ${ATI_BOOK_PAGES.length}</span>
            </div>
            ${contentHtml}
            <div class="page-footer-strip">
              <span>CPE Solutions &bull; Hotline: 0903 000 000</span>
              <span class="page-number-tag">P.${index + 1}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  renderThumbnails() {
    const thumbsEl = document.getElementById('atiThumbnails');
    if (!thumbsEl) return;

    thumbsEl.innerHTML = ATI_BOOK_PAGES.map((page, idx) => {
      const activeCls = idx === this.currentPage ? 'active' : '';
      let thumbTitle = `P.${idx + 1}`;
      if (page.type === 'cover') thumbTitle = 'Bìa';
      else if (page.type === 'intro') thumbTitle = 'Về ATi';
      else if (page.type === 'backcover') thumbTitle = 'Liên hệ';
      else if (page.title) thumbTitle = page.title.split(' ')[0] + ' ' + (page.title.split(' ')[1] || '');

      return `
        <button class="thumb-btn ${activeCls}" data-thumb-index="${idx}" title="${page.title || 'Trang ' + (idx + 1)}">
          <span class="thumb-num">${idx + 1}</span>
          <span class="thumb-label">${thumbTitle}</span>
        </button>
      `;
    }).join('');
  }

  bindEvents() {
    const prevBtn = document.getElementById('btnBookPrev');
    const nextBtn = document.getElementById('btnBookNext');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.prevPage());
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextPage());
    }

    // Thumbnail clicks
    const thumbsEl = document.getElementById('atiThumbnails');
    if (thumbsEl) {
      thumbsEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.thumb-btn');
        if (!btn) return;
        const targetIdx = parseInt(btn.getAttribute('data-thumb-index'), 10);
        if (!isNaN(targetIdx)) {
          this.goToPage(targetIdx);
        }
      });
    }

    // Direct click on right side to flip next, left side to flip prev
    const bookEl = document.getElementById('atiBook');
    if (bookEl) {
      bookEl.addEventListener('click', (e) => {
        // Don't flip if user clicked an anchor, button, or input
        if (e.target.closest('a') || e.target.closest('button')) {
          return;
        }
        const rect = bookEl.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        if (clickX > rect.width * 0.6) {
          this.nextPage();
        } else if (clickX < rect.width * 0.4) {
          this.prevPage();
        }
      });
    }

    // Quote buttons on products
    document.addEventListener('click', (e) => {
      const qBtn = e.target.closest('.btn-quote-product');
      if (!qBtn) return;
      e.preventDefault();
      const pId = qBtn.getAttribute('data-product-id');
      const pTitle = qBtn.getAttribute('data-product-title');
      if (window.openQuoteModal) {
        window.openQuoteModal({ id: pId, title: pTitle });
      } else {
        alert(`Yêu cầu báo giá cho: ${pTitle}\nVui lòng liên hệ Hotline: 0903 000 000 hoặc info@cpes.vn`);
      }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      const bookInView = this.isElementInViewport(this.container);
      if (!bookInView) return;
      if (e.key === 'ArrowRight') {
        this.nextPage();
      } else if (e.key === 'ArrowLeft') {
        this.prevPage();
      }
    });
  }

  isElementInViewport(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return (
      rect.top < (window.innerHeight || document.documentElement.clientHeight) &&
      rect.bottom > 0
    );
  }

  nextPage() {
    if (this.currentPage < this.totalPages - 1) {
      this.goToPage(this.currentPage + 1);
    }
  }

  prevPage() {
    if (this.currentPage > 0) {
      this.goToPage(this.currentPage - 1);
    }
  }

  goToPage(targetIdx) {
    if (targetIdx < 0 || targetIdx >= this.totalPages) return;
    this.currentPage = targetIdx;

    const pages = document.querySelectorAll('.ati-page');
    pages.forEach((p, idx) => {
      p.classList.remove('active', 'flipped', 'prev-page');
      if (idx === targetIdx) {
        p.classList.add('active');
      } else if (idx < targetIdx) {
        p.classList.add('flipped');
      }
    });

    this.updateControls();
  }

  updateControls() {
    const indicator = document.getElementById('atiPageIndicator');
    if (indicator) {
      indicator.textContent = `Trang ${this.currentPage + 1} / ${this.totalPages}`;
    }

    const prevBtn = document.getElementById('btnBookPrev');
    const nextBtn = document.getElementById('btnBookNext');
    if (prevBtn) prevBtn.disabled = this.currentPage === 0;
    if (nextBtn) nextBtn.disabled = this.currentPage === this.totalPages - 1;

    // Update active thumb
    const thumbs = document.querySelectorAll('.thumb-btn');
    thumbs.forEach((t, idx) => {
      if (idx === this.currentPage) {
        t.classList.add('active');
        t.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      } else {
        t.classList.remove('active');
      }
    });
  }
}

// Auto init when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('atiFlipbookContainer')) {
    window.atiBookInstance = new ATiFlipBook('atiFlipbookContainer');
  }
});
