import { icon } from './icons.js';

export function heroMarkup() {
  return `<section class="hero assembly-hero" aria-labelledby="hero-title">
    <div class="hero-atmosphere" aria-hidden="true"></div>
    <div class="container assembly-layout">
      <div class="hero-copy">
        <p class="hero-kicker"><span></span>TENSAN Việt Nam</p>
        <h1 id="hero-title">Giải pháp vật liệu<br><span>cho sản xuất điện tử</span></h1>
        <p class="hero-description">Keo công nghiệp, vật liệu tản nhiệt<br class="desktop-break"> và giải pháp phụ trợ SMT.</p>
        <div class="hero-actions"><a class="button button-primary" href="/san-pham" data-link>Khám phá sản phẩm ${icon('arrow')}</a><a class="button button-outline-light" href="/lien-he" data-link>Yêu cầu tư vấn</a></div>
        <div class="thermal-product-card">
          <a href="/san-pham/ts1001" data-link aria-label="Xem keo tản nhiệt TS1001"><img src="/assets/ts1001.jpg" alt="Ảnh keo tản nhiệt TS1001 của TENSAN" width="72" height="84"></a>
          <div><span class="thermal-product-eyebrow">Vật liệu trong mô hình</span><h2>Keo tản nhiệt TS1001</h2><p>Lớp keo giữa chip và tản nhiệt, giúp truyền nhiệt qua bề mặt tiếp xúc.</p><a href="/san-pham/ts1001" data-link>Xem sản phẩm ${icon('arrow')}</a></div>
        </div>
        <button id="focus-paste" class="thermal-focus-button">${icon('layers')}Xem rõ lớp keo tản nhiệt ${icon('arrow')}</button>
      </div>
      <div class="assembly-view">
        <div class="assembly-view-heading"><span>Cấu tạo cụm tản nhiệt</span><span class="assembly-mode" id="assembly-mode">Góc nhìn tách lớp</span></div>
        <div id="hero-scene" class="assembly-stage" role="group" aria-label="Mô hình bo mạch tách lớp: keo tản nhiệt TS1001 nằm giữa chip và tản nhiệt nhôm.">
          <div class="assembly-fallback"><img src="/assets/thermal-assembly-fallback.svg" alt="Sơ đồ tản nhiệt nhôm, lớp keo tản nhiệt TS1001 và chip trên bo mạch" width="720" height="600"></div>
          <svg class="assembly-leaders" aria-hidden="true"><g data-anchor="heatsink"><path/><circle r="3"/></g><g data-anchor="paste"><path/><circle r="4"/></g><g data-anchor="chip"><path/><circle r="3"/></g><g data-anchor="board"><path/><circle r="3"/></g></svg>
          <div class="assembly-label" data-label="heatsink"><span>01</span><div>Tản nhiệt nhôm</div></div>
          <button class="assembly-label assembly-label-paste" data-label="paste" id="paste-hotspot"><span>02</span><div>Keo tản nhiệt<strong>TS1001</strong></div></button>
          <div class="assembly-label" data-label="chip"><span>03</span><div>Chip xử lý</div></div>
          <div class="assembly-label" data-label="board"><span>04</span><div>Bo mạch điện tử</div></div>
        </div>
        <div class="assembly-toolbar"><span class="assembly-drag-hint">${icon('rotate')}Kéo ngang để xoay</span><button id="assemble-toggle" class="assembly-control" aria-pressed="false">${icon('layers')}<span>Lắp ghép</span></button><button id="view-reset" class="assembly-control" aria-label="Trở về góc xem ban đầu">${icon('rotate')}<span>Góc ban đầu</span></button><button id="motion-toggle" class="assembly-control" aria-label="Bật tự xoay mô hình" aria-pressed="false">${icon('play')}</button></div>
        <div class="assembly-rotation"><button id="view-left" aria-label="Xoay mô hình sang trái 30 độ">${icon('chevron','rotate-left')}Xoay trái</button><p id="assembly-explanation">Lớp keo được tách ra để quan sát vị trí tiếp xúc.</p><button id="view-right" aria-label="Xoay mô hình sang phải 30 độ">Xoay phải ${icon('chevron')}</button></div>
        <p class="assembly-note">Mô phỏng nguyên lý truyền nhiệt · Độ dày lớp keo được phóng đại để dễ quan sát.</p>
      </div>
    </div><p id="scene-status" class="sr-only" aria-live="polite"></p>
  </section>`;
}
