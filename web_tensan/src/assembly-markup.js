import { icon } from './icons.js';
import { applications, products } from './data.js';

function productSlide(kind, index, title, description, id, reference, labels) {
  const product=products.find(item=>item.id===id);
  return `<div class="hero-slide hero-slide-product" role="group" aria-roledescription="slide" aria-label="${index} / 5: ${title}" aria-hidden="true" inert>
    <div class="container product-banner-layout"><div class="product-banner-copy"><p class="product-banner-kicker">TENSAN Việt Nam</p><h2>${title.replace('TS-350','<span class="product-code-nowrap">TS-350</span>')}</h2><p class="product-banner-description">${description}</p>
      <div class="product-real-card"><img src="/assets/${product.image}" alt="Ảnh sản phẩm ${product.name}" width="90" height="110"><div><span>Sản phẩm TENSAN</span><h3>${product.name}</h3><a href="/san-pham/${id}" data-link>Xem thông tin sản phẩm ${icon('arrow')}</a></div></div>
      <a class="button button-primary" href="/san-pham/${id}" data-link>Xem sản phẩm ${icon('arrow')}</a><a class="product-consult" href="/lien-he?san-pham=${product.code}" data-link>Tư vấn ứng dụng ${icon('arrow')}</a>
    </div><div class="product-model-view"><div class="product-model-heading"><span>${kind==='led'?'Cấu tạo cụm đèn LED':'In kem hàn trên bo mạch'}</span><span>Kéo ngang để xoay</span></div>
      <div class="product-model-stage" data-product-scene="${kind}" role="group" aria-label="Mô hình ${title}, có thể xoay và lắp ghép"><div class="product-model-fallback"><img src="/assets/${reference}" alt="Hình tham chiếu ${title}" width="2172" height="724"></div>${labels.map(([key,text])=>`<span class="product-model-label" data-model-label="${key}">${text}</span>`).join('')}</div>
      <div class="product-model-toolbar"><button data-model-left aria-label="Xoay mô hình sang trái">${icon('arrow','banner-arrow-prev')}</button><button data-model-assemble aria-pressed="false">${icon('layers')}<span>Lắp ghép</span></button><button data-model-reset aria-label="Góc xem ban đầu">${icon('rotate')}</button><button data-model-play aria-label="Tạm dừng tự xoay" aria-pressed="true">${icon('pause')}</button><button data-model-right aria-label="Xoay mô hình sang phải">${icon('arrow')}</button></div>
      <p class="product-model-note">Mô hình minh họa ứng dụng và vị trí vật liệu. Bao bì dựng theo ảnh tham chiếu.</p><p class="sr-only" data-model-status aria-live="polite"></p>
    </div></div></div>`;
}

export function heroMarkup() {
  return `<section class="hero assembly-hero" aria-labelledby="hero-title">
    <div class="hero-atmosphere" aria-hidden="true"></div>
    <div class="hero-carousel" aria-roledescription="băng chuyền" aria-label="Giải pháp vật liệu TENSAN">
    <div class="hero-carousel-viewport"><div class="hero-carousel-track">
    <div class="hero-slide" role="group" aria-roledescription="slide" aria-label="1 / 5: Keo tản nhiệt TS1001">
    <div class="container assembly-layout">
      <div class="hero-copy">
        <p class="hero-kicker"><span></span>TENSAN Việt Nam</p>
        <h1 id="hero-title">Giải pháp vật liệu<br><span>cho sản xuất điện tử</span></h1>
        <p class="hero-description">Keo công nghiệp, vật liệu tản nhiệt<br class="desktop-break"> và giải pháp phụ trợ SMT.</p>
        <div class="hero-material-functions"><span>${icon('layers')}Truyền nhiệt</span><span>${icon('drop')}Kết dính</span><span>${icon('shield')}Bảo vệ mạch</span></div>
        <div class="hero-actions"><a class="button button-primary" href="/san-pham" data-link>Khám phá sản phẩm ${icon('arrow')}</a><a class="button button-outline-light" href="/lien-he" data-link>Yêu cầu tư vấn</a></div>
        <div class="thermal-product-card">
          <a href="/san-pham/ts1001" data-link aria-label="Xem keo tản nhiệt TS1001"><img src="/assets/ts1001.jpg" alt="Ảnh keo tản nhiệt TS1001 của TENSAN" width="104" height="126"></a>
          <div><span class="thermal-product-eyebrow">Vật liệu trong mô hình</span><h2>Keo tản nhiệt TS1001</h2><p>Tạo lớp tiếp xúc truyền nhiệt giữa linh kiện và bộ phận tản nhiệt.</p><div class="thermal-product-tags"><span>IC / CPU</span><span>Cụm đèn LED</span></div><a href="/san-pham/ts1001" data-link>Xem sản phẩm ${icon('arrow')}</a></div>
        </div>
        <button id="focus-paste" class="thermal-focus-button">${icon('layers')}Xem rõ lớp keo tản nhiệt ${icon('arrow')}</button>
      </div>
      <div class="assembly-view">
        <div class="assembly-view-heading"><div><span class="assembly-title-mark">${icon('chip')}</span><span>Cấu tạo cụm tản nhiệt<small>Khám phá vị trí và vai trò của vật liệu</small></span></div><span class="assembly-mode" id="assembly-mode">Góc nhìn tách lớp</span></div>
        <div id="hero-scene" class="assembly-stage" role="group" aria-label="Mô hình bo mạch tách lớp: keo tản nhiệt TS1001 nằm giữa chip và tản nhiệt nhôm.">
          <div class="assembly-fallback"><img src="/assets/thermal-assembly-fallback.svg" alt="Sơ đồ tản nhiệt nhôm, lớp keo tản nhiệt TS1001 và chip trên bo mạch" width="720" height="600"></div>
          <svg class="assembly-leaders" aria-hidden="true"><g data-anchor="heatsink"><path/><circle r="3"/></g><g data-anchor="paste"><path/><circle r="4"/></g><g data-anchor="chip"><path/><circle r="3"/></g><g data-anchor="board"><path/><circle r="3"/></g></svg>
          <div class="assembly-label" data-label="heatsink"><span>01</span><div>Cụm tản nhiệt<small>Nhôm & quạt</small></div></div>
          <button class="assembly-label assembly-label-paste" data-label="paste" id="paste-hotspot"><span>02</span><div>Keo tản nhiệt<strong>TS1001</strong></div></button>
          <div class="assembly-label" data-label="chip"><span>03</span><div>Chip xử lý</div></div>
          <div class="assembly-label" data-label="board"><span>04</span><div>Bo mạch điện tử</div></div>
        </div>
        <div class="assembly-toolbar"><span class="assembly-drag-hint">${icon('rotate')}Kéo ngang để xoay</span><button id="assemble-toggle" class="assembly-control" aria-pressed="false">${icon('layers')}<span>Lắp ghép</span></button><button id="view-reset" class="assembly-control" aria-label="Trở về góc xem ban đầu">${icon('rotate')}<span>Góc ban đầu</span></button><button id="motion-toggle" class="assembly-control" aria-label="Tạm dừng tự xoay" aria-pressed="true">${icon('pause')}</button></div>
        <div class="assembly-rotation"><button id="view-left" aria-label="Xoay mô hình sang trái 30 độ">${icon('chevron','rotate-left')}Xoay trái</button><p id="assembly-explanation">Lớp keo được tách ra để quan sát vị trí tiếp xúc.</p><button id="view-right" aria-label="Xoay mô hình sang phải 30 độ">Xoay phải ${icon('chevron')}</button></div>
        <p class="assembly-note">Mô phỏng nguyên lý truyền nhiệt · Độ dày lớp keo được phóng đại để dễ quan sát.</p>
      </div>
    </div>
    </div>
    ${productSlide('led',2,'Silicone cho đèn LED','Kết dính các chi tiết trong cụm đèn. Khám phá lớp silicone giữa thân tản nhiệt, bảng LED và bộ khuếch tán.','keo-silicone-dan-den-led-ts6603','reference-led-3d.webp',[['silicone','Lớp silicone kết dính'],['ledBoard','Bảng LED'],['package','Silicone RTV']])}
    ${productSlide('solder',3,'Kem hàn TS-350','Từ lớp kem hàn đến vị trí kết nối linh kiện. Quan sát khuôn in, gạt kem và các điểm tiếp xúc trên bo mạch.','kem-han-ts350','reference-solder-3d.webp',[['stencil','Khuôn in kem hàn'],['squeegee','Gạt kem hàn'],['package','Kem hàn TS-350']])}
    ${[
      { title: 'Sản xuất tại Việt Nam', image: 'banner-factory-motion.webp', href: '/gioi-thieu', text: 'Đồng hành cùng sản xuất công nghiệp.', tags: ['Bắc Ninh', 'Vật liệu công nghiệp'], motion:'factory', cta:'Khám phá Tensan' },
      { title: 'Keo đỏ SMT 4109A', image: 'banner-red-smt-motion.webp', href: '/san-pham/4109a', text: 'Cố định linh kiện trong quy trình lắp ráp điện tử.', tags: ['Lắp ráp SMT', 'Keo giữ linh kiện'], motion:'smt', cta:'Xem sản phẩm' }
    ].map((slide, index) => `<div class="hero-slide hero-slide-2d motion-${slide.motion}" data-animated-banner="${slide.motion}" role="group" aria-roledescription="slide" aria-label="${index + 4} / 5: ${slide.title}" aria-hidden="true" inert>
      <div class="banner-motion-art"><a class="banner-art" href="${slide.href}" data-link aria-label="${slide.cta}: ${slide.title}"><img src="/assets/${slide.image}" alt="${slide.title} — ${slide.text}" width="2172" height="724" decoding="async"></a>
      <svg class="banner-motion-overlay" viewBox="0 0 2172 724" aria-hidden="true">${slide.motion==='factory'?'<g class="factory-rotor" transform="translate(1155 420)"><circle r="38"/><path d="M-26 0h52M0-26v52"/></g><g class="factory-rotor" transform="translate(1760 450)"><circle r="30"/><path d="M-22 0h44M0-22v44"/></g><path class="motion-trace" d="M920 652H1410L1465 620H1980"/><g class="factory-status"><circle cx="1325" cy="436" r="7"/><circle cx="1850" cy="447" r="7"/></g>':'<path class="motion-trace" d="M1520 610 1580 550 1530 500 1640 390 1720 435 1850 305 2050 440"/><g class="smt-deposits"><circle cx="1630" cy="350" r="20"/><circle cx="1670" cy="388" r="20"/><circle cx="1710" cy="426" r="20"/><circle cx="1750" cy="464" r="20"/></g>'}</svg>
      <button class="banner-animation-toggle" aria-label="Tạm dừng hoạt ảnh banner" aria-pressed="true">${icon('pause')}</button></div>
      <div class="container banner-product-strip"><div><span class="banner-caption">Vật liệu cho sản xuất điện tử</span><h2>${slide.title}</h2><p>${slide.text}</p></div><div class="banner-product-actions"><div class="banner-tags">${slide.tags.map(tag => `<span>${tag}</span>`).join('')}</div><a class="button button-primary" href="${slide.href}" data-link>${slide.cta} ${icon('arrow')}</a><small>${slide.motion==='factory'?'Hình minh họa doanh nghiệp':'Hình minh họa ứng dụng'}</small></div></div>
    </div>`).join('')}
    </div></div>
    <div class="container hero-carousel-nav"><div class="banner-selectors" aria-label="Chọn banner">${['Keo tản nhiệt', 'Silicone LED', 'Kem hàn TS-350', 'Tensan Việt Nam', 'Keo đỏ SMT'].map((title, index) => `<button type="button" data-slide="${index}" aria-pressed="${index === 0}"><span>0${index + 1}</span>${title}</button>`).join('')}</div><div class="banner-arrows"><button type="button" data-banner-prev aria-label="Banner trước">${icon('arrow','banner-arrow-prev')}</button><span class="banner-count" aria-hidden="true">01 / 05</span><button type="button" data-banner-next aria-label="Banner tiếp theo">${icon('arrow')}</button></div></div>
    <p class="sr-only" data-banner-status aria-live="polite" aria-atomic="true"></p>
    </div>
    <div class="container hero-industry-rail"><div class="hero-industry-heading"><p>Vật liệu cho từng ứng dụng</p><a href="/ung-dung" data-link>Khám phá giải pháp ${icon('arrow')}</a></div><div class="hero-industry-grid">${applications.map((application, index) => `<a class="hero-industry" href="/ung-dung#${application.id}" data-link><div class="application-photo photo-${index} hero-industry-photo" aria-hidden="true"></div><div class="hero-industry-copy">${icon(application.icon)}<span>${application.title}</span>${icon('arrow')}</div></a>`).join('')}</div></div>
    <p id="scene-status" class="sr-only" aria-live="polite"></p>
  </section>`;
}
