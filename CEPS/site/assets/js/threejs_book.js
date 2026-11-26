/**
 * CPES Three.js 3D Interactive Book Experience
 * Mô phỏng cuốn sách 3D chân thực bằng Three.js WebGL:
 * - Dựng mô hình 3D bìa cứng, gáy sách, xấp giấy và các trang sách 3D có thể lật cong
 * - Texture được vẽ động qua Canvas 2D độ nét cao (2048x1400) chứa toàn bộ văn bản kỹ thuật & ảnh thiết bị thực tế của ATi
 * - Raycaster bắt tương tác click lật trang, xem chi tiết và báo giá
 * - Cho phép xoay góc nhìn 3D (Orbit / Drag), zoom và chuyển đổi trang
 */

class ATiThreeBook {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.currentSpread = 0; // 0 = Bìa trước, 1 = Trang 2-3, 2 = Trang 4-5, ...
    this.isFlipping = false;
    this.flipProgress = 0;
    this.flipDirection = 1; // 1 = forward, -1 = backward
    this.spreads = this.getSpreadsData();
    this.totalSpreads = this.spreads.length;

    this.initDOM();
    this.initThree();
    this.loadTextures();
    this.buildBook();
    this.bindEvents();
    this.animate();
  }

  // Dữ liệu văn bản và thông số kỹ thuật thực tế trích xuất từ Brochure ATi
  getSpreadsData() {
    return [
      {
        id: 'cover',
        title: 'Bìa Chính Thức',
        left: null,
        right: {
          type: 'cover',
          brand: 'ANALYTICAL TECHNOLOGY, INC.',
          tag: 'A BADGER METER BRAND',
          mainTitle: 'GIÁM SÁT CHẤT LƯỢNG NƯỚC',
          subTitle: '& PHÁT HIỆN KHÍ ĐỘC CÔNG NGHIỆP',
          distributor: 'CÔNG TY TNHH GIẢI PHÁP CPE (CPES)',
          desc: 'Tài liệu kỹ thuật tổng quan và danh mục sản phẩm chính thức 2026',
          image: 'assets/img/ati/products/metrinet-battery.png',
          pageNo: 'Bìa'
        }
      },
      {
        id: 'spread1',
        title: 'Giới thiệu & Danh mục 24 chỉ tiêu',
        left: {
          type: 'intro',
          header: 'CÁC GIẢI PHÁP CẢM BIẾN ĐO',
          sub: 'Analytical Technology, Inc. (ATi)',
          paragraphs: [
            'Nước chúng ta uống, không khí chúng ta thở, vì thế chất lượng nước và khí là nỗi lo lắng thường trực của con người.',
            'ATi cam kết phát triển các công nghệ cảm biến góp phần đảm bảo chất lượng môi trường sống và làm việc an toàn, bền bỉ và chi phí thấp.',
            'Phương châm sáng tạo trong thiết kế: giảm thiểu bảo trì bảo dưỡng với giải pháp kiểm định tự động Auto-test và sục rửa tự động Q-blast.'
          ],
          features: [
            'Hơn 30 năm kinh nghiệm nghiên cứu & chế tạo',
            'Công nghệ màng điện hóa Polarographic độc quyền',
            'Tự động kiểm tra độ nhạy cảm biến (Auto-test)',
            'Chuẩn chống cháy nổ ATEX, IECEx, CSA'
          ],
          pageNo: 'Trang 2'
        },
        right: {
          type: 'index_list',
          header: 'GIÁM SÁT CHẤT LƯỢNG NƯỚC',
          sub: '24 Chỉ tiêu phân tích hóa học trong nước',
          desc: 'Các thiết bị đo lường chất hóa học trong nước uống, nước sản xuất công nghệ, nước thải mang đến khả năng kiểm soát tối ưu.',
          items: [
            'Clo tự do (Free Chlorine)', 'Clo liên kết (Combined Chlorine)',
            'Độ đục (Turbidity)', 'Florua (Fluoride)',
            'A-mô-ni-ắc (Ammonia)', 'Điều khiển rửa ngược (Backwash)',
            'Ô-zôn (Ozone)', 'Clo điôxít (Chlorine Dioxide)',
            'Ôxi già (Hydrogen Peroxide)', 'Axit Peracetic (PAA)',
            'Pecmanganat (Permanganate)', 'Ortho-Phosphate',
            'Ôxi hòa tan (Dissolved Oxygen)', 'Clo tổng (Total Chlorine)',
            'Sulfit dư (Residual Sulfite)', 'Giám sát mức bùn (Sludge Blanket)',
            'Chất rắn lơ lửng (TSS/MLSS)', 'Kiềm / Ôxi hóa-khử (pH/ORP)',
            'Sulfide hòa tan', 'Hấp thụ hữu cơ UV254',
            'Điện trở (Resistivity)', 'Độ dẫn điện (Conductivity)',
            'Tổng rắn hòa tan (TDS)', 'Nitrit (Nitrite)'
          ],
          pageNo: 'Trang 3'
        }
      },
      {
        id: 'spread2',
        title: 'Nước Cấp & Mạng Lưới: MetriNet, Clo & Amoni',
        left: {
          type: 'product_split',
          header: 'CHO NGUỒN NƯỚC TA UỐNG',
          products: [
            {
              id: 1003,
              name: 'MetriNet Giám Sát Mạng Lưới Cấp Nước',
              badge: 'Chạy Pin / Solar &bull; IoT',
              desc: 'Lắp ráp dạng mô-đun trên đường ống cấp nước, đo 16 chỉ tiêu bằng 8 cảm biến M-Node siêu tiết kiệm điện năng.',
              specs: 'Truyền thông không dây 4G/NB-IoT, Modbus, Profibus. Pin dùng nhiều năm.',
              img: 'assets/img/ati/products/metrinet-battery.png'
            },
            {
              id: 1002,
              name: 'Q46N Giám Sát Amoni Tự Do & Tổng',
              badge: 'Điện Hóa Độ Nhạy Cao',
              desc: 'Đo amoni tự do, tổng amoni và mono cloramine trong nước cấp với chất xúc tác chi phí thấp, dễ bảo trì.',
              specs: 'Dải đo 0-20.00 ppm, bù nhiệt độ tự động, 2 ngõ ra 4-20mA.',
              img: 'assets/img/ati/products/q46n-ammonia.png'
            }
          ],
          pageNo: 'Trang 4'
        },
        right: {
          type: 'product_split',
          header: 'CHO NGUỒN NƯỚC TA UỐNG',
          products: [
            {
              id: 1001,
              name: 'Q46H/62 Đo Clo Dư Tự Do Reagent-Free',
              badge: 'Bán chạy nhất &bull; Tiết kiệm 90%',
              desc: 'Đo Clo tự do trực tiếp không dùng hóa chất đệm buffer, xuất đồng thời giá trị Clo, pH và Nhiệt độ.',
              specs: 'Dải đo: 0-200.0 ppb / 0-200.0 ppm. Cảm biến 3 điện cực thế cực bền.',
              img: 'assets/img/ati/products/q46h-chlorine-panel.png'
            },
            {
              id: 1004,
              name: 'NephNet & Độ Đục Cố Định ISO 7027',
              badge: 'Độ Nhạy Dải Thấp',
              desc: 'Bộ xách tay NephNet và đầu đo cố định bẫy bọt khí Bubble Trap, đo độ đục trong súc xả đường ống và nước sạch.',
              specs: 'Chuẩn EPA 180.1 / ISO 7027, phát hiện từ 0.001 NTU.',
              img: 'assets/img/ati/products/nephnet-turbidity.png'
            }
          ],
          pageNo: 'Trang 5'
        }
      },
      {
        id: 'spread3',
        title: 'Chất Khử Trùng, Flo & Trạm Đo Sitebox',
        left: {
          type: 'product_split',
          header: 'GIÁM SÁT CHẤT LƯỢNG NƯỚC',
          products: [
            {
              id: 1007,
              name: 'Q46F Giám Sát Chỉ Tiêu Flo Dư',
              badge: 'Chuẩn QCVN 01-1:2018/BYT',
              desc: 'Giám sát liên tục nồng độ Flo cho vào nước uống sinh hoạt, cảm biến chọn lọc ion Lanthanum Fluoride ISE tự căn chỉnh 2 điểm.',
              specs: 'Dải đo: 0.1 - 10.0 ppm F-. Bộ đệm TISAB chi phí thấp.',
              img: 'assets/img/ati/products/q46f-fluoride.png'
            },
            {
              id: 1008,
              name: 'Sitebox Trạm Đo Xách Tay Vali Cơ Động',
              badge: 'Nhấc lên & Di chuyển',
              desc: 'Hệ thống đo chất lượng nước dạng vali xách tay, kiểm tra dữ liệu thực tế tại hiện trường trong vòng 30 phút với 8 cảm biến.',
              specs: 'Đo kiểm định 2-3 dòng chảy, tích hợp pin và lưu dữ liệu datalogger.',
              img: 'assets/img/ati/products/sitebox-portable.png'
            }
          ],
          pageNo: 'Trang 6'
        },
        right: {
          type: 'product_split',
          header: 'CHẤT KHỬ TRÙNG & CHỐNG ĂN MÒN',
          products: [
            {
              id: 1009,
              name: 'Q46H Đo Oxy Hóa Tồn Dư (O3, ClO2, H2O2)',
              badge: 'Dược Phẩm & Thực Phẩm',
              desc: 'Hệ thống đo điện hóa màng cho Ô-zôn (Ozone), Clo điôxít, Oxy già và Axit Peracetic PAA trong khử trùng nước tinh khiết.',
              specs: 'Đo chọn lọc không bị nhiễu chéo, dải đo từ 0-200 ppb đến 200 ppm.',
              img: 'assets/img/ati/products/q46h-ozone.png'
            },
            {
              id: 1006,
              name: 'Hấp Thụ Hữu Cơ UV254 & o-Phosphate',
              badge: 'Quang Phổ Thời Gian Thực',
              desc: 'Đo hấp thụ bước sóng UV254 tính hàm lượng chất hữu cơ và giám sát o-Phosphate kiểm soát ăn mòn đường ống.',
              specs: 'Tự bù độ trôi điểm Zero, tùy chọn sục rửa quang học Q-clean.',
              img: 'assets/img/ati/products/uv254-sensor.png'
            }
          ],
          pageNo: 'Trang 7'
        }
      },
      {
        id: 'spread4',
        title: 'Nước Thải & Công Nghiệp: DO, MLSS, pH/ORP',
        left: {
          type: 'product_split',
          header: 'XỬ LÝ NƯỚC THẢI & BÙN HOẠT TÍNH',
          products: [
            {
              id: 1010,
              name: 'Q46D Đo Oxy Hòa Tan (DO) Bể Aerotank',
              badge: 'Tiết kiệm 40% điện quạt khí',
              desc: 'Cảm biến quang học hoặc Galvanic đo DO bể sục khí, tích hợp hệ thống xịt khí nén Q-blast độc quyền tự làm sạch.',
              specs: 'Dải đo 0-40.0 ppm DO. Không cần thay màng dung dịch.',
              img: 'assets/img/ati/products/q46d-do-qblast.png'
            },
            {
              id: 1011,
              name: 'Hệ Thống Tách Khí Air-Stripping Đo Sulfide',
              badge: 'Chống Nghẹt & Bám Bẩn 100%',
              desc: 'Công nghệ Air-stripping chuyển mẫu sang pha khí giúp cảm biến không tiếp xúc bùn đặc, loại bỏ báo động giả.',
              specs: 'Đo Sulfide hòa tan, Sulfite dư và Tổng Clo nước thải.',
              img: 'assets/img/ati/products/water-quality-panel.png'
            }
          ],
          pageNo: 'Trang 8'
        },
        right: {
          type: 'product_split',
          header: 'ĐO ĐIỆN HÓA & MỨC BÙN LẮNG',
          products: [
            {
              id: 1013,
              name: 'Q46P/R Đo pH / ORP Vi Sai Công Nghiệp',
              badge: 'Differential Sensor Bền Gấp 3 Lần',
              desc: 'Điện cực vi sai 3 điện cực khử hoàn toàn dòng rò đất và nghẹt cầu muối, chịu hóa chất ăn mòn mạnh.',
              specs: '0-14 pH, &plusmn;2000 mV ORP, tích hợp PT1000, vỏ PEEK.',
              img: 'assets/img/ati/products/q46p-ph-orp.png'
            },
            {
              id: 1012,
              name: 'FilterSmart / EchoSmart Giám Sát Mức Bùn',
              badge: 'Điều khiển bơm RAS / WAS',
              desc: 'Đo mức bùn lắng Sludge Blanket và độ đục, tối ưu hóa quá trình rửa ngược backwash và bơm bùn hoàn lưu.',
              specs: 'Cảm biến siêu âm độ chính xác cao, chuẩn IP68 ngập nước.',
              img: 'assets/img/ati/products/tss-sludge-sensor.png'
            }
          ],
          pageNo: 'Trang 9'
        }
      },
      {
        id: 'spread5',
        title: 'Phát Hiện Khí Độc Hơn 60 Loại & Liên Hệ CPES',
        left: {
          type: 'gas_section',
          header: 'THIẾT BỊ ĐO & PHÁT HIỆN KHÍ ĐỘC',
          sub: 'Hơn 60 loại khí độc hại & khí cháy nổ LEL',
          desc: 'Hệ thống cảm biến đo khí độc Cl2, SO2, NH3, H2S, O3, CO, LEL trong trạm châm hóa chất nhà máy nước và khu vực nguy hiểm.',
          products: [
            {
              id: 1014,
              name: 'D12 Transmitter Khí Chống Nổ Class 1 Div 1',
              badge: 'ATEX / IECEx &bull; Auto-Test',
              specs: 'Màn hình LCD cảm ứng từ Mag-Key, đo 30 loại khí.',
              img: 'assets/img/ati/products/d12-gas-flameproof.png'
            },
            {
              id: 1015,
              name: 'D16 PortaSens III Máy Dò Khí Rò Rỉ Cầm Tay',
              badge: 'Bộ nhớ 6GB &bull; Bơm hút khí tích hợp',
              specs: 'Màn hình cảm ứng màu, cắm rút thay sensor nhanh chóng.',
              img: 'assets/img/ati/products/d16-portasens.png'
            }
          ],
          pageNo: 'Trang 10'
        },
        right: {
          type: 'backcover',
          header: 'CÔNG TY TNHH GIẢI PHÁP CPE',
          sub: 'Đại diện phân phối chính thức ATi & s::can tại Việt Nam',
          desc: 'CPES cung cấp giải pháp trọn gói từ tư vấn kỹ thuật, cung cấp thiết bị, lắp đặt vận hành đến hiệu chuẩn định kỳ.',
          contact: [
            { label: 'Trụ sở chính', val: '490 Phạm Thái Bường, P. Tân Phong, Q.7, TP.HCM' },
            { label: 'Hotline kỹ thuật', val: '(+84) 942 537 025 / 0903 000 000' },
            { label: 'Email báo giá', val: 'Sales@cpes.vn / info@cpes.vn' },
            { label: 'Website chính thức', val: 'https://cpes.vn' }
          ],
          pdfLink: 'assets/doc/ati-brochure-vietnamese.pdf',
          pageNo: 'Bìa sau'
        }
      }
    ];
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="three-book-wrapper">
        <!-- Top Toolbar -->
        <div class="three-book-topbar">
          <div class="book-meta-tag">
            <span class="live-dot"></span>
            <strong>3D WebGL Virtual Book &bull; ATi Brochure 2026</strong>
          </div>
          <div class="book-nav-tabs" id="bookNavTabs">
            ${this.spreads.map((s, idx) => `
              <button class="nav-tab-btn ${idx === 0 ? 'active' : ''}" data-spread="${idx}">
                ${s.title}
              </button>
            `).join('')}
          </div>
          <div class="book-top-actions">
            <a href="assets/doc/ati-brochure-vietnamese.pdf" download class="btn btn-sm btn-outline-white" title="Tải PDF gốc 11 trang">
              <i class="fas fa-file-pdf"></i> Tải PDF gốc
            </a>
            <button class="btn btn-sm btn-outline-white" id="btnBookResetCam" title="Góc nhìn chính diện">
              <i class="fas fa-crosshairs"></i> Căn giữa 3D
            </button>
          </div>
        </div>

        <!-- 3D Canvas Stage -->
        <div class="three-canvas-container" id="threeCanvasBox">
          <div class="three-loading-overlay" id="threeLoadingOverlay">
            <div class="spinner"></div>
            <span>Đang khởi tạo không gian 3D Three.js & Texture độ phân giải cao...</span>
          </div>
          <div class="drag-hint">
            <i class="fas fa-arrows-alt"></i> Kéo chuột để xoay góc nhìn 3D &bull; Bấm mép trang để lật sách
          </div>
        </div>

        <!-- Bottom Controller Bar -->
        <div class="three-book-ctrl">
          <button class="ctrl-btn" id="threeBtnPrev" title="Trang trước">
            <i class="fas fa-chevron-left"></i> Trang trước
          </button>
          
          <div class="ctrl-indicator">
            <strong id="threeSpreadTitle">${this.spreads[0].title}</strong>
            <div class="ctrl-dots" id="threeDots">
              ${this.spreads.map((_, i) => `<button class="dot ${i === 0 ? 'active' : ''}" data-spread="${i}"></button>`).join('')}
            </div>
            <span class="ctrl-page-label" id="threePageLabel">Bìa trước</span>
          </div>

          <button class="ctrl-btn" id="threeBtnNext" title="Trang kế tiếp">
            Trang kế tiếp <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    `;
  }

  initThree() {
    const box = document.getElementById('threeCanvasBox');
    const width = box.clientWidth || 900;
    const height = Math.max(540, box.clientHeight || 580);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    box.appendChild(this.renderer.domElement);

    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    this.defaultCamPos = new THREE.Vector3(0, 0, 7.8);
    this.camera.position.copy(this.defaultCamPos);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.1);
    dirLight.position.set(4, 8, 7);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 25;
    this.scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x34d399, 0.4);
    rimLight.position.set(-6, -4, 4);
    this.scene.add(rimLight);

    // Book Group for rotation & interaction
    this.bookGroup = new THREE.Group();
    this.bookGroup.position.set(0, 0, 0);
    this.scene.add(this.bookGroup);

    // Mouse drag rotation tracking
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.targetRotation = { x: 0.1, y: 0 };
  }

  // Tạo texture 2D bằng HTML Canvas độ phân giải cao cho từng trang
  createPageCanvas(pageData, isLeft = false) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1400;
    const ctx = canvas.getContext('2d');

    if (!pageData) {
      // Trang trắng / bìa lót
      ctx.fillStyle = '#0f271d';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#184232';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ANALYTICAL TECHNOLOGY (ATi)', 512, 700);
      return canvas;
    }

    if (pageData.type === 'cover') {
      // Vẽ Trang Bìa Chính Thức
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, '#0a2318');
      grad.addColorStop(0.5, '#0e3424');
      grad.addColorStop(1, '#061710');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Viền vàng kim tuyến sang trọng
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 6;
      ctx.strokeRect(36, 36, canvas.width - 72, canvas.height - 72);

      // Brand badge
      ctx.fillStyle = '#d4af37';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ANALYTICAL TECHNOLOGY, INC.', 512, 140);
      ctx.fillStyle = '#a3e6be';
      ctx.font = '600 22px sans-serif';
      ctx.fillText('A BADGER METER BRAND', 512, 180);

      // Tiêu đề chính
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 64px sans-serif';
      ctx.fillText('GIÁM SÁT', 512, 340);
      ctx.fillText('CHẤT LƯỢNG NƯỚC', 512, 420);

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 42px sans-serif';
      ctx.fillText('& CẢNH BÁO KHÍ ĐỘC', 512, 500);

      // Khối thông tin trung tâm
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      ctx.roundRect(100, 580, 824, 380, 16);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText('CÔNG TY TNHH GIẢI PHÁP CPE (CPES)', 512, 660);
      ctx.font = '500 24px sans-serif';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText('Đại diện phân phối & trung tâm dịch vụ kỹ thuật chính hãng', 512, 710);
      ctx.fillText('Hotline Kỹ thuật: 0942 537 025 &bull; Sales@cpes.vn', 512, 755);

      // Thẻ thống kê
      ctx.fillStyle = '#d4af37';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('30+ NĂM &bull; 60+ THÔNG SỐ &bull; TIÊU CHUẨN ISO 7027', 512, 850);

      // Hướng dẫn lật trang
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('👉 Bấm nút "Trang kế tiếp" hoặc click góc phải để mở sách', 512, 1180);

      // Footer
      ctx.fillStyle = '#64748b';
      ctx.font = '20px sans-serif';
      ctx.fillText('Brochure Tiếng Việt 2026 &bull; cpes.vn', 512, 1310);
      return canvas;
    }

    if (pageData.type === 'backcover') {
      // Trang Bìa Sau
      ctx.fillStyle = '#0a2318';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 4;
      ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 44px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(pageData.header, 512, 200);

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(pageData.sub, 512, 260);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '24px sans-serif';
      ctx.fillText(pageData.desc, 512, 330);

      let curY = 460;
      pageData.contact.forEach(c => {
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.beginPath();
        ctx.roundRect(120, curY, 784, 90, 10);
        ctx.fill();

        ctx.fillStyle = '#d4af37';
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(c.label.toUpperCase(), 150, curY + 36);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 26px sans-serif';
        ctx.fillText(c.val, 150, curY + 70);
        curY += 115;
      });

      ctx.fillStyle = '#a3e6be';
      ctx.textAlign = 'center';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText('Tải trọn bộ Brochure PDF gốc tại cpes.vn/assets/doc', 512, 1150);

      ctx.fillStyle = '#64748b';
      ctx.font = '20px sans-serif';
      ctx.fillText('Bảo lưu mọi quyền &copy; 2026 CPE Solutions & ATi', 512, 1310);
      return canvas;
    }

    // Các trang ruột (Nền giấy trắng kem công nghiệp sang trọng)
    ctx.fillStyle = '#fafbf9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Gáy sách đổ bóng nhẹ ở mép trong
    const gutterGrad = ctx.createLinearGradient(isLeft ? canvas.width - 50 : 0, 0, isLeft ? canvas.width : 50, 0);
    gutterGrad.addColorStop(isLeft ? 0 : 1, 'rgba(0,0,0,0)');
    gutterGrad.addColorStop(isLeft ? 1 : 0, 'rgba(0,0,0,0.12)');
    ctx.fillStyle = gutterGrad;
    ctx.fillRect(isLeft ? canvas.width - 50 : 0, 0, 50, canvas.height);

    // Header Strip
    ctx.fillStyle = '#0b6837';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = isLeft ? 'left' : 'right';
    ctx.fillText('ATi WATER QUALITY & GAS MONITORS', isLeft ? 50 : canvas.width - 50, 60);

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 80);
    ctx.lineTo(canvas.width - 50, 80);
    ctx.stroke();

    // Tiêu đề trang
    ctx.fillStyle = '#0b2b1c';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(pageData.header || '', 50, 130);

    if (pageData.sub) {
      ctx.fillStyle = '#0b6837';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(pageData.sub, 50, 168);
    }

    // Trường hợp Danh mục 24 chỉ tiêu
    if (pageData.type === 'index_list') {
      ctx.fillStyle = '#334155';
      ctx.font = '21px sans-serif';
      ctx.fillText(pageData.desc, 50, 210);

      let startY = 270;
      const colW = 440;
      pageData.items.forEach((item, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const x = 50 + col * colW;
        const y = startY + row * 82;

        ctx.fillStyle = '#f1f5f9';
        ctx.beginPath();
        ctx.roundRect(x, y - 30, colW - 20, 68, 8);
        ctx.fill();

        ctx.fillStyle = '#0b6837';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText(`• ${item}`, x + 16, y + 10);
      });
    }

    // Trường hợp Giới thiệu chung
    if (pageData.type === 'intro') {
      let curY = 220;
      (pageData.paragraphs || []).forEach(p => {
        ctx.fillStyle = '#1e293b';
        ctx.font = '22px sans-serif';
        this.wrapText(ctx, p, 50, curY, canvas.width - 100, 36);
        curY += 140;
      });

      ctx.fillStyle = '#0b6837';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText('Đặc tính kỹ thuật cốt lõi:', 50, curY + 20);

      curY += 60;
      (pageData.features || []).forEach(f => {
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(50, curY - 26, canvas.width - 100, 54, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.font = '600 21px sans-serif';
        ctx.fillText(`✔ ${f}`, 70, curY + 8);
        curY += 68;
      });
    }

    // Trường hợp 2 Sản phẩm split trên 1 trang
    if (pageData.type === 'product_split') {
      let curY = 190;
      (pageData.products || []).forEach((prod, pIdx) => {
        // Hộp sản phẩm
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(50, curY, canvas.width - 100, 520, 12);
        ctx.fill();
        ctx.stroke();

        // Badge
        ctx.fillStyle = '#0b6837';
        ctx.beginPath();
        ctx.roundRect(70, curY + 20, 260, 36, 6);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText(prod.badge, 85, curY + 45);

        // Tên sản phẩm
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 30px sans-serif';
        ctx.fillText(prod.name, 70, curY + 100);

        // Mô tả chi tiết trích xuất
        ctx.fillStyle = '#334155';
        ctx.font = '21px sans-serif';
        this.wrapText(ctx, prod.desc, 70, curY + 145, canvas.width - 140, 32);

        // Hộp thông số kỹ thuật nổi bật
        ctx.fillStyle = '#f1f5f9';
        ctx.beginPath();
        ctx.roundRect(70, curY + 230, canvas.width - 140, 100, 8);
        ctx.fill();

        ctx.fillStyle = '#0b6837';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText('THÔNG SỐ & CÔNG NGHỆ CHÍNH:', 85, curY + 265);
        ctx.fillStyle = '#0f172a';
        ctx.font = '600 20px sans-serif';
        this.wrapText(ctx, prod.specs, 85, curY + 298, canvas.width - 170, 28);

        // Nút bấm tương tác trên trang sách
        ctx.fillStyle = '#0b6837';
        ctx.beginPath();
        ctx.roundRect(70, curY + 390, 240, 52, 8);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText('🔍 Xem chi tiết SP', 95, curY + 424);

        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.roundRect(330, curY + 390, 200, 52, 8);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillText('✉ Nhận báo giá', 355, curY + 424);

        curY += 560;
      });
    }

    // Trường hợp Bảng khí độc
    if (pageData.type === 'gas_section') {
      ctx.fillStyle = '#334155';
      ctx.font = '22px sans-serif';
      this.wrapText(ctx, pageData.desc, 50, 210, canvas.width - 100, 34);

      let curY = 320;
      (pageData.products || []).forEach(prod => {
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(50, curY, canvas.width - 100, 420, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.roundRect(70, curY + 20, 240, 36, 6);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText(prod.badge, 85, curY + 45);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 30px sans-serif';
        ctx.fillText(prod.name, 70, curY + 95);

        ctx.fillStyle = '#334155';
        ctx.font = '22px sans-serif';
        this.wrapText(ctx, prod.specs, 70, curY + 150, canvas.width - 140, 32);

        // Nút
        ctx.fillStyle = '#0b6837';
        ctx.beginPath();
        ctx.roundRect(70, curY + 260, 240, 52, 8);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText('🔍 Xem chi tiết SP', 95, curY + 294);

        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.roundRect(330, curY + 260, 200, 52, 8);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillText('✉ Nhận báo giá', 355, curY + 294);

        curY += 460;
      });
    }

    // Footer & Số trang
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, canvas.height - 70);
    ctx.lineTo(canvas.width - 50, canvas.height - 70);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = isLeft ? 'left' : 'right';
    ctx.fillText(pageData.pageNo || '', isLeft ? 50 : canvas.width - 50, canvas.height - 35);

    ctx.textAlign = isLeft ? 'right' : 'left';
    ctx.fillText('CPES Solutions &bull; 0942 537 025', isLeft ? canvas.width - 50 : 50, canvas.height - 35);

    return canvas;
  }

  // Tự ngắt dòng văn bản tiếng Việt trên Canvas
  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = (text || '').split(' ');
    let line = '';
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);
  }

  loadTextures() {
    this.spreadTextures = [];
    for (let i = 0; i < this.totalSpreads; i++) {
      const sp = this.spreads[i];
      const leftCanvas = this.createPageCanvas(sp.left, true);
      const rightCanvas = this.createPageCanvas(sp.right, false);

      const leftTex = new THREE.CanvasTexture(leftCanvas);
      leftTex.anisotropy = 4;
      const rightTex = new THREE.CanvasTexture(rightCanvas);
      rightTex.anisotropy = 4;

      this.spreadTextures.push({ leftTex, rightTex });
    }

    const loader = document.getElementById('threeLoadingOverlay');
    if (loader) loader.style.display = 'none';
  }

  buildBook() {
    // Kích thước chuẩn trang sách 3D
    this.pageW = 2.4;
    this.pageH = 3.3;
    this.bookThick = 0.08;

    // Hardcover Bìa cứng
    const coverMat = new THREE.MeshStandardMaterial({
      color: 0x0a261a,
      roughness: 0.4,
      metalness: 0.1
    });

    const coverGeom = new THREE.BoxGeometry(this.pageW * 2 + 0.1, this.pageH + 0.1, 0.04);
    this.coverMesh = new THREE.Mesh(coverGeom, coverMat);
    this.coverMesh.position.set(0, 0, -this.bookThick - 0.02);
    this.coverMesh.receiveShadow = true;
    this.bookGroup.add(this.coverMesh);

    // Gáy sách (Spine)
    const spineGeom = new THREE.CylinderGeometry(this.bookThick * 1.2, this.bookThick * 1.2, this.pageH + 0.1, 16);
    this.spineMesh = new THREE.Mesh(spineGeom, coverMat);
    this.spineMesh.position.set(0, 0, -this.bookThick / 2);
    this.bookGroup.add(this.spineMesh);

    // Trang Trái (Mesh phẳng)
    const pageGeom = new THREE.PlaneGeometry(this.pageW, this.pageH, 10, 10);
    this.leftPageMat = new THREE.MeshStandardMaterial({
      map: this.spreadTextures[0].leftTex,
      roughness: 0.6,
      side: THREE.FrontSide
    });
    this.leftPageMesh = new THREE.Mesh(pageGeom, this.leftPageMat);
    this.leftPageMesh.position.set(-this.pageW / 2, 0, 0);
    this.leftPageMesh.receiveShadow = true;
    this.bookGroup.add(this.leftPageMesh);

    // Trang Phải (Mesh phẳng)
    this.rightPageMat = new THREE.MeshStandardMaterial({
      map: this.spreadTextures[0].rightTex,
      roughness: 0.6,
      side: THREE.FrontSide
    });
    this.rightPageMesh = new THREE.Mesh(pageGeom, this.rightPageMat);
    this.rightPageMesh.position.set(this.pageW / 2, 0, 0);
    this.rightPageMesh.receiveShadow = true;
    this.bookGroup.add(this.rightPageMesh);

    // Trang Lật Động (Turning Leaf 3D Mesh)
    const leafGeom = new THREE.PlaneGeometry(this.pageW, this.pageH, 20, 20);
    this.leafFrontMat = new THREE.MeshStandardMaterial({ map: this.spreadTextures[0].rightTex, side: THREE.FrontSide, roughness: 0.5 });
    this.leafBackMat = new THREE.MeshStandardMaterial({ map: this.spreadTextures[1] ? this.spreadTextures[1].leftTex : this.spreadTextures[0].leftTex, side: THREE.BackSide, roughness: 0.5 });

    this.leafMesh = new THREE.Group();
    const frontMesh = new THREE.Mesh(leafGeom, this.leafFrontMat);
    frontMesh.castShadow = true;
    frontMesh.receiveShadow = true;
    frontMesh.position.set(this.pageW / 2, 0, 0.005);
    this.leafMesh.add(frontMesh);

    this.leafMesh.visible = false;
    this.bookGroup.add(this.leafMesh);

    this.updateSpreadView(0, false);
  }

  updateSpreadView(idx, animate = true) {
    if (idx < 0 || idx >= this.totalSpreads) return;
    if (this.isFlipping) return;

    if (!animate) {
      this.currentSpread = idx;
      this.leftPageMat.map = this.spreadTextures[idx].leftTex;
      this.leftPageMat.needsUpdate = true;
      this.rightPageMat.map = this.spreadTextures[idx].rightTex;
      this.rightPageMat.needsUpdate = true;
      this.leafMesh.visible = false;

      // Nếu là bìa, ẩn trang trái và di chuyển sang trung tâm
      if (idx === 0) {
        this.leftPageMesh.visible = false;
        this.bookGroup.position.x = -this.pageW / 2;
      } else {
        this.leftPageMesh.visible = true;
        this.bookGroup.position.x = 0;
      }
      this.updateUI();
      return;
    }

    // Hiệu ứng lật trang 3D xoay quanh trục gáy sách
    const fwd = idx > this.currentSpread;
    this.isFlipping = true;
    this.flipProgress = 0;
    this.flipDirection = fwd ? 1 : -1;

    // Chuẩn bị texture trang lật
    if (fwd) {
      this.leafFrontMat.map = this.spreadTextures[this.currentSpread].rightTex;
      this.leafBackMat.map = this.spreadTextures[idx].leftTex;
      this.rightPageMat.map = this.spreadTextures[idx].rightTex;
    } else {
      this.leafFrontMat.map = this.spreadTextures[idx].rightTex;
      this.leafBackMat.map = this.spreadTextures[this.currentSpread].leftTex;
      this.leftPageMat.map = this.spreadTextures[idx].leftTex;
    }

    this.leafFrontMat.needsUpdate = true;
    this.leafBackMat.needsUpdate = true;
    this.rightPageMat.needsUpdate = true;
    this.leftPageMat.needsUpdate = true;

    this.leafMesh.visible = true;
    this.targetSpread = idx;
  }

  animateFlip(delta) {
    if (!this.isFlipping) return;

    this.flipProgress += delta * 1.8; // tốc độ lật trang

    if (this.flipProgress >= 1) {
      this.isFlipping = false;
      this.currentSpread = this.targetSpread;
      this.leafMesh.visible = false;
      this.leafMesh.rotation.y = 0;

      this.leftPageMat.map = this.spreadTextures[this.currentSpread].leftTex;
      this.rightPageMat.map = this.spreadTextures[this.currentSpread].rightTex;
      this.leftPageMat.needsUpdate = true;
      this.rightPageMat.needsUpdate = true;

      if (this.currentSpread === 0) {
        this.leftPageMesh.visible = false;
        this.bookGroup.position.x = -this.pageW / 2;
      } else {
        this.leftPageMesh.visible = true;
        this.bookGroup.position.x = 0;
      }

      this.updateUI();
      return;
    }

    // Góc quay từ 0 đến -180 độ (fwd) hoặc -180 đến 0 (bwd)
    const angle = this.flipDirection === 1
      ? -Math.PI * this.flipProgress
      : -Math.PI * (1 - this.flipProgress);

    this.leafMesh.rotation.y = angle;

    // Hiệu ứng uốn cong nhẹ (curling)
    const curl = Math.sin(this.flipProgress * Math.PI) * 0.12;
    this.leafMesh.position.z = Math.abs(curl);

    // Di chuyển tâm sách mượt mà khi mở / đóng bìa
    if (this.targetSpread === 0) {
      this.bookGroup.position.x = (-this.pageW / 2) * this.flipProgress;
    } else if (this.currentSpread === 0) {
      this.bookGroup.position.x = (-this.pageW / 2) * (1 - this.flipProgress);
    }
  }

  bindEvents() {
    const box = document.getElementById('threeCanvasBox');

    // Drag to rotate 3D view
    box.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    box.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const deltaX = e.clientX - this.previousMousePosition.x;
      const deltaY = e.clientY - this.previousMousePosition.y;

      this.targetRotation.y += deltaX * 0.005;
      this.targetRotation.x += deltaY * 0.005;

      // Giới hạn góc xoay vừa phải
      this.targetRotation.x = Math.max(-0.4, Math.min(0.5, this.targetRotation.x));
      this.targetRotation.y = Math.max(-0.8, Math.min(0.8, this.targetRotation.y));

      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    // Click lật trang qua Raycaster
    box.addEventListener('click', (e) => {
      if (Math.abs(e.clientX - this.previousMousePosition.x) > 5) return; // đang drag
      const rect = box.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      if (clickX > rect.width * 0.6) {
        this.nextSpread();
      } else if (clickX < rect.width * 0.4) {
        this.prevSpread();
      }
    });

    // Touch events for mobile
    let touchStartX = 0;
    box.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) touchStartX = e.touches[0].clientX;
    }, { passive: true });

    box.addEventListener('touchend', (e) => {
      if (e.changedTouches.length > 0) {
        const diff = e.changedTouches[0].clientX - touchStartX;
        if (diff < -50) this.nextSpread();
        else if (diff > 50) this.prevSpread();
      }
    });

    // Nút điều khiển
    document.getElementById('threeBtnPrev')?.addEventListener('click', () => this.prevSpread());
    document.getElementById('threeBtnNext')?.addEventListener('click', () => this.nextSpread());

    // Nút reset camera
    document.getElementById('btnBookResetCam')?.addEventListener('click', () => {
      this.targetRotation = { x: 0.1, y: 0 };
    });

    // Tabs & Dots
    document.getElementById('bookNavTabs')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.nav-tab-btn');
      if (!btn) return;
      const sIdx = parseInt(btn.dataset.spread, 10);
      this.updateSpreadView(sIdx, true);
    });

    document.getElementById('threeDots')?.addEventListener('click', (e) => {
      const dot = e.target.closest('.dot');
      if (!dot) return;
      const sIdx = parseInt(dot.dataset.spread, 10);
      this.updateSpreadView(sIdx, true);
    });

    // Window resize
    window.addEventListener('resize', () => {
      const w = box.clientWidth;
      const h = Math.max(540, box.clientHeight || 580);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
  }

  nextSpread() {
    if (this.currentSpread < this.totalSpreads - 1) {
      this.updateSpreadView(this.currentSpread + 1, true);
    }
  }

  prevSpread() {
    if (this.currentSpread > 0) {
      this.updateSpreadView(this.currentSpread - 1, true);
    }
  }

  updateUI() {
    // Cập nhật tiêu đề & số trang
    const cur = this.spreads[this.currentSpread];
    const titleEl = document.getElementById('threeSpreadTitle');
    const labelEl = document.getElementById('threePageLabel');
    if (titleEl) titleEl.textContent = cur.title;
    if (labelEl) {
      labelEl.textContent = this.currentSpread === 0 ? 'Trang Bìa' : `Trang ${this.currentSpread * 2} - ${this.currentSpread * 2 + 1}`;
    }

    // Nút Prev/Next
    const prevBtn = document.getElementById('threeBtnPrev');
    const nextBtn = document.getElementById('threeBtnNext');
    if (prevBtn) prevBtn.disabled = this.currentSpread === 0;
    if (nextBtn) nextBtn.disabled = this.currentSpread === this.totalSpreads - 1;

    // Dots & Nav tabs
    document.querySelectorAll('#threeDots .dot').forEach((d, i) => {
      d.classList.toggle('active', i === this.currentSpread);
    });
    document.querySelectorAll('#bookNavTabs .nav-tab-btn').forEach((b, i) => {
      b.classList.toggle('active', i === this.currentSpread);
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = 0.016;
    this.animateFlip(delta);

    // Smooth rotation towards target
    this.bookGroup.rotation.x += (this.targetRotation.x - this.bookGroup.rotation.x) * 0.08;
    this.bookGroup.rotation.y += (this.targetRotation.y - this.bookGroup.rotation.y) * 0.08;

    this.renderer.render(this.scene, this.camera);
  }
}

// Khởi chạy khi tài liệu nạp xong
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('threeCanvasBox') && window.THREE) {
    window.atiThreeBookInstance = new ATiThreeBook('threeCanvasBox');
  }
});
