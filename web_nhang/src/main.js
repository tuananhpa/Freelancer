import './styles.css';
import { products, groups, forms, otherCategories, business, categoryName } from './data.js';
import { filterProducts, resolveRoute, escapeHtml as e, paginate } from './catalog.js';

const paths = {
  search:'<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/>',
  phone:'<path d="m7 3 3 5-2 2c1.3 2.7 3.3 4.7 6 6l2-2 5 3c.2 3-1.3 4.5-4 4C9 19.5 4.5 15 3 7c-.5-2.7 1-4.2 4-4Z"/>',
  user:'<circle cx="12" cy="7" r="3.5"/><path d="M4.5 21v-2a7.5 7.5 0 0 1 15 0v2Z"/>',
  arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>',
  chevron:'<path d="m6 9 6 6 6-6"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
  close:'<path d="m6 6 12 12M6 18 18 6"/>',
  pin:'<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.3"/>',
  mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',
  zoom:'<circle cx="10" cy="10" r="6.5"/><path d="m15 15 6 6M7 10h6M10 7v6"/>',
  people:'<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m2-16a3 3 0 0 1 0 6m2 10v-3a6 6 0 0 0-2-4"/>',
  leaf:'<path d="M20 3C7 2 2 8 5 15c3 7 15 5 15-12ZM4 21 16 7"/>',
  share:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"/>',
};
const icon = (name,cls='') => `<svg class="icon ${cls}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.leaf}</svg>`;
const productUrl = p => `/san-pham/${p.slug}/`;
const categoryUrl = slug => `/danh-muc-san-pham/${slug}/`;
const params = new URLSearchParams(location.search);
const route = resolveRoute(location.pathname,products);
const groupName = slug => groups.find(g=>g.slug===slug)?.name || '';
const active = page => route.page===page ? ' aria-current="page"' : '';
const arrow = icon('arrow');

function brand() {
  return `<a href="/" class="brand" aria-label="Vĩnh Thuận Phát — Trang chủ"><img src="/images/logo.png" width="64" height="64" alt="Logo hoa sen Vĩnh Thuận Phát"><span>Vĩnh Thuận Phát<small>Nhang thơm cao cấp</small></span></a>`;
}
function categoryMenu() {
  return groups.map(g=>`<div><a class="mega-title" href="${categoryUrl(g.slug)}">${g.name}</a>${g.slug==='khac'
    ? otherCategories.map(c=>`<a href="${categoryUrl(c.slug)}">${c.name}</a>`).join('')
    : forms.map(f=>`<a href="${categoryUrl(`nhang-${f.slug}-${g.slug}`)}">${f.name} ${g.name}</a>`).join('')}</div>`).join('');
}
function header() {
  return `<div class="topbar"><div class="container"><a href="tel:${business.tel}">${icon('phone')} Tư vấn mua sỉ: <strong>${business.phone}</strong></a><span class="top-address">Nhà phân phối Phúc Nguyên · TP. Hồ Chí Minh</span><a href="/my-account/">${icon('user')} Đăng nhập</a></div></div>
  <header class="site-header"><div class="container header-inner">${brand()}
    <button class="menu-toggle icon-button" aria-label="Mở menu" aria-controls="main-nav" aria-expanded="false">${icon('menu')}</button>
    <nav id="main-nav" class="main-nav" aria-label="Điều hướng chính">
      <a href="/"${active('home')}>Trang chủ</a><a href="/nhang-thom-vinh-thuan-phat/"${active('about')}>Giới thiệu</a>
      <details class="nav-products"><summary>Sản phẩm ${icon('chevron')}</summary><div class="mega-menu"><a class="mega-all" href="/san-pham/">Tất cả sản phẩm ${arrow}</a><div class="mega-grid">${categoryMenu()}</div></div></details>
      <a href="/lam-dai-ly/"${active('dealer')}>Làm đại lý</a><a href="/lien-he/"${active('contact')}>Liên hệ</a>
    </nav>
    <form class="header-search" action="/san-pham/" method="get" role="search"><label class="sr-only" for="header-q">Tìm sản phẩm</label><input id="header-q" name="q" type="search" placeholder="Tìm sản phẩm…" value="${e(params.get('q')||'')}" maxlength="150"><button aria-label="Tìm kiếm">${icon('search')}</button></form>
  </div></header>`;
}
function footer() {
  return `<section class="dealer-band"><div class="container dealer-inner"><div class="dealer-icon">${icon('people')}</div><div><h2>Trở thành đại lý</h2><p>Cùng Vĩnh Thuận Phát mang hương thơm đến mọi nếp nhà.</p></div><a href="/lam-dai-ly/" class="button button-light">Tìm hiểu hợp tác ${arrow}</a></div></section>
  <footer class="site-footer"><div class="container footer-grid"><div>${brand()}<p>Nhang thảo dược, trầm hương, đàn hương<br>và các sản phẩm thờ cúng.</p><a href="https://www.facebook.com/nhangvinhthuanphat/" target="_blank" rel="noopener noreferrer" class="footer-social">Facebook Vĩnh Thuận Phát ${arrow}</a></div>
  <div><h3>Khám phá</h3><a href="/san-pham/">Sản phẩm</a><a href="/nhang-thom-vinh-thuan-phat/">Về Vĩnh Thuận Phát</a><a href="/lam-dai-ly/">Hợp tác đại lý</a><a href="/lien-he/">Liên hệ</a></div>
  <div><h3>Nhà phân phối Phúc Nguyên</h3><a href="tel:${business.tel}">${icon('phone')} <strong>${business.phone}</strong></a><p>${business.phones[0]} · ${business.phones[1]}</p><p>${icon('pin')} ${business.address}</p><a class="email-link" href="mailto:${business.email}">${business.email}</a></div></div>
  <div class="container footer-bottom"><small>© ${new Date().getFullYear()} Nhang Thơm Cao Cấp Vĩnh Thuận Phát</small><details class="audio-details"><summary>Âm thanh thư giãn</summary><audio controls preload="none" aria-label="Nhạc thư giãn từ website gốc"><source src="https://nhangthomcaocap.vn/02-thien%20du%20tram.mp3" type="audio/mpeg"></audio><span class="audio-error" hidden>Chưa tải được âm thanh. Vui lòng thử lại sau.</span></details><a href="#top" aria-label="Về đầu trang">Về đầu trang ↑</a></div></footer>
  <a class="floating-contact" href="tel:${business.tel}" aria-label="Gọi tư vấn 0903 007 095">${icon('phone')}<span>Gọi tư vấn</span></a>`;
}
function card(p) {
  return `<article class="product-card"><a class="product-image" href="${productUrl(p)}" aria-label="${e(p.name)}"><img src="${p.image}" alt="${e(p.name)}" width="600" height="400" loading="lazy" decoding="async"></a><div class="product-info"><p class="product-category">${groupName(p.group)}</p><h3><a href="${productUrl(p)}">${e(p.name)}</a></h3><div class="card-actions"><a class="button" href="/lien-he/?san-pham=${encodeURIComponent(p.name)}">Liên hệ</a><button class="button button-outline" data-quick="${p.slug}" aria-label="Xem nhanh ${e(p.name)}">Xem nhanh</button></div></div></article>`;
}
const grid = items => `<div class="product-grid">${items.map(card).join('')}</div>`;
function sectionHeading(title,link,label='Xem tất cả sản phẩm') {
  return `<div class="section-heading"><h2>${title}</h2><span class="heading-line"></span>${link?`<a href="${link}">${label} ${arrow}</a>`:''}</div>`;
}
function intro() {
  return `<section class="intro container"><div class="intro-visual" role="img" aria-label="Trầm hương và nguyên liệu gỗ trong không gian tự nhiên"><span class="intro-seal">${icon('leaf')}<span>Hương thơm<br>nếp nhà Việt</span></span></div><div class="intro-copy"><span class="eyebrow">Một nén hương, một tấm lòng</span><h2>Hương thơm thân thuộc.<br>Gìn giữ nếp nhà.</h2><p>Vĩnh Thuận Phát mang đến các dòng nhang thảo dược, trầm hương, đàn hương cùng sản phẩm thờ cúng cho không gian gia đình.</p><p>Từ chọn sản phẩm cho gia đình đến tìm nguồn hàng cho đại lý, Phúc Nguyên luôn sẵn sàng tư vấn cùng bạn.</p><a href="/nhang-thom-vinh-thuan-phat/" class="text-link">Về Vĩnh Thuận Phát ${arrow}</a></div></section>`;
}
function home() {
  const featured = products.filter(p=>p.featured);
  return `<section class="hero"><img class="hero-image" src="/images/hero-incense.png" alt="Làn khói nhang bên lư hương xanh và gỗ thơm" width="2400" height="1000" fetchpriority="high"><div class="hero-shade"></div><div class="container hero-inner"><div class="hero-copy"><span class="hero-kicker">Hương thơm cho nếp nhà Việt</span><h1>Nhang thơm<br>Vĩnh Thuận Phát</h1><p>Khám phá nhang thảo dược,<br>trầm hương và đàn hương.</p><div class="hero-actions"><a class="button" href="/san-pham/">Khám phá sản phẩm ${arrow}</a><a class="button button-glass" href="tel:${business.tel}">Liên hệ mua sỉ</a></div><span class="hero-note"><span></span>Nhà phân phối Phúc Nguyên</span></div></div><div class="hero-caption">Một chút hương thơm. Một khoảng bình yên.</div></section>
  <section class="category-section container" aria-label="Khám phá danh mục"><div class="category-grid">${groups.map(g=>`<a class="category-item" href="${categoryUrl(g.slug)}"><div class="category-circle"><span class="category-photo category-${g.panel}"></span><span class="category-arrow">${arrow}</span></div><h2>${g.name}</h2><p>${g.description}</p></a>`).join('')}</div></section>
  <section class="container collection">${sectionHeading('Sản phẩm nổi bật','/san-pham/?collection=featured')}${grid([featured[0],featured[1],featured[2],featured[4]])}</section>
  <section class="container collection">${sectionHeading('Sản phẩm mới','/san-pham/?collection=new')}${grid(products.filter(p=>p.isNew).slice(0,4))}</section>
  ${intro()}<section class="contact-note container"><span>${icon('phone')} Cần chọn loại nhang phù hợp?</span><p>Liên hệ để được tư vấn sản phẩm, mua sỉ và tìm đại lý mua lẻ.</p><a href="tel:${business.tel}">${business.phone} ${arrow}</a></section>`;
}
function breadcrumb(title,extra='') {
  return `<nav class="breadcrumb container" aria-label="Đường dẫn"><a href="/">Trang chủ</a><span>/</span>${extra}<span aria-current="page">${e(title)}</span></nav>`;
}
function pageHeading(title,desc) {
  return `<div class="page-heading"><div class="container"><h1>${e(title)}</h1>${desc?`<p>${e(desc)}</p>`:''}</div></div>`;
}
function catalog() {
  const q=params.get('q')||'',group=params.get('group')||'',form=params.get('form')||'',sort=params.get('sort')||'default';
  const collection=params.get('collection');
  const title=q?`Tìm kiếm: “${q}”`:route.category?categoryName(route.category):collection==='new'?'Sản phẩm mới':collection==='featured'?'Sản phẩm nổi bật':'Khám phá sản phẩm';
  let source=collection==='new'?products.filter(p=>p.isNew):collection==='featured'?products.filter(p=>p.featured):products;
  const filtered=filterProducts(source,{q,group,form,sort,category:route.category||''});
  const page=paginate(filtered,params.get('page'));
  const pageLink = n => {const next=new URLSearchParams(params);next.set('page',n);return `${location.pathname}?${next}`;};
  return `${breadcrumb(route.category?categoryName(route.category):'Sản phẩm')}${pageHeading(title,'Tìm hương thơm cho gia đình, cửa hàng và không gian thờ tự.')}<div class="container catalog-layout"><aside class="catalog-sidebar"><h2>Danh mục sản phẩm</h2><a class="all-products" href="/san-pham/">Tất cả sản phẩm</a>${groups.map(g=>`<details ${route.category?.includes(g.slug)||g.slug===group?'open':''}><summary><a href="${categoryUrl(g.slug)}">${g.name}</a>${icon('chevron')}</summary><div>${g.slug==='khac'?otherCategories.map(c=>`<a ${route.category===c.slug?'aria-current="page"':''} href="${categoryUrl(c.slug)}">${c.name}</a>`).join(''):forms.map(f=>{const slug=`nhang-${f.slug}-${g.slug}`;return `<a ${route.category===slug?'aria-current="page"':''} href="${categoryUrl(slug)}">${f.name}</a>`;}).join('')}</div></details>`).join('')}<div class="sidebar-help">${icon('phone')}<h3>Cần tư vấn thêm?</h3><p>Chúng tôi giúp bạn chọn sản phẩm phù hợp.</p><a href="tel:${business.tel}">${business.phone}</a></div></aside>
  <section class="catalog-results" aria-label="Kết quả sản phẩm"><form class="filter-form" action="${e(location.pathname)}" method="get">${collection?`<input type="hidden" name="collection" value="${e(collection)}">`:''}<div class="filter-search"><label for="catalog-q">Tìm theo tên</label><input id="catalog-q" name="q" type="search" placeholder="Ví dụ: nhang đàn hương" value="${e(q)}" maxlength="150"></div><div><label for="group">Hương / nhóm</label><select id="group" name="group"><option value="">Tất cả</option>${groups.map(g=>`<option value="${g.slug}" ${group===g.slug?'selected':''}>${g.name}</option>`).join('')}</select></div><div><label for="form">Dạng sản phẩm</label><select id="form" name="form"><option value="">Tất cả</option>${[...forms,{slug:'nen',name:'Nến'},{slug:'dau',name:'Dầu'},{slug:'den',name:'Đèn'}].map(f=>`<option value="${f.slug}" ${form===f.slug?'selected':''}>${f.name}</option>`).join('')}</select></div><div><label for="sort">Sắp xếp</label><select id="sort" name="sort"><option value="default">Mặc định</option><option value="name" ${sort==='name'?'selected':''}>Tên A–Z</option></select></div><button class="button" type="submit">Lọc</button></form>
  <div class="results-count"><p><strong>${page.total}</strong> sản phẩm${page.totalPages>1?` · Trang ${page.page}/${page.totalPages}`:''}</p>${q||group||form?`<a href="${e(location.pathname)}">Xóa bộ lọc</a>`:''}</div>
  ${page.total?grid(page.items):`<div class="empty-state">${icon('search')}<h2>${q?'Chưa tìm thấy sản phẩm':'Danh mục đang được cập nhật'}</h2><p>${q?'Thử tên ngắn hơn hoặc bỏ bớt bộ lọc.':'Bạn có thể liên hệ để được tư vấn thêm về danh mục này.'}</p><a class="button" href="/san-pham/">Xem tất cả sản phẩm</a><a class="text-link" href="tel:${business.tel}">Gọi ${business.phone}</a></div>`}
  ${page.totalPages>1?`<nav class="pagination" aria-label="Phân trang">${Array.from({length:page.totalPages},(_,i)=>`<a href="${e(pageLink(i+1))}" ${page.page===i+1?'aria-current="page"':''} aria-label="Trang ${i+1}">${i+1}</a>`).join('')}</nav>`:''}
  </section></div>`;
}
function productContent(p,quick=false) {
  return `<div class="product-detail ${quick?'quick-detail':''}"><button class="detail-image" data-zoom="${p.slug}" aria-label="Phóng lớn ảnh ${e(p.name)}"><img src="${p.image}" alt="${e(p.name)}" width="600" height="400">${icon('zoom')}<span>Chạm để xem ảnh lớn</span></button><div class="detail-copy"><a class="product-category" href="${categoryUrl(p.group)}">${groupName(p.group)}</a><h1 ${quick?'id="modal-title"':''}>${e(p.name)}</h1><span class="detail-rule"></span><p>Sản phẩm thuộc dòng ${e(categoryName(p.category))} của Vĩnh Thuận Phát.</p><p>Liên hệ nhà phân phối Phúc Nguyên để được tư vấn quy cách, giá và địa điểm mua hàng.</p><div class="detail-actions"><a class="button" href="tel:${business.tel}">${icon('phone')} Mua sỉ: ${business.phone}</a><a class="button button-outline" href="/lien-he/?san-pham=${encodeURIComponent(p.name)}">Mua lẻ: liên hệ đại lý ${arrow}</a></div><p class="detail-taxonomy">Danh mục: <a href="${categoryUrl(p.category)}">${e(categoryName(p.category))}</a></p><div class="share-row"><button class="text-link" data-share="${p.slug}">${icon('share')} Sao chép liên kết</button>${quick?`<a class="text-link" href="${productUrl(p)}">Xem chi tiết ${arrow}</a>`:''}</div></div></div>`;
}
function productPage() {
  const p=products.find(p=>p.slug===route.slug);
  const related=products.filter(x=>x.slug!==p.slug && x.group===p.group).slice(0,4);
  return `${breadcrumb(p.name,'<a href="/san-pham/">Sản phẩm</a><span>/</span>')}<section class="container detail-section">${productContent(p)}</section><section class="container product-description"><h2>Thông tin sản phẩm</h2><p>${e(p.name)} được giới thiệu trong danh mục ${e(categoryName(p.category))}. Để biết thêm thông tin về quy cách đóng gói và tình trạng hàng, vui lòng liên hệ <a href="tel:${business.tel}">${business.phone}</a>.</p><p>Đặt nhang trên bề mặt vững chắc, cách vật dễ cháy và không để nhang đang cháy ngoài tầm quan sát.</p></section>${related.length?`<section class="container collection">${sectionHeading('Sản phẩm liên quan',categoryUrl(p.group),'Xem cùng danh mục')}${grid(related)}</section>`:''}`;
}
function contactDetails() {
  return `<div class="contact-details"><h2>Nhà phân phối Phúc Nguyên</h2><p>Kết nối với chúng tôi để được tư vấn sản phẩm và thông tin đại lý.</p><div class="contact-item">${icon('phone')}<div><h3>Điện thoại</h3><a href="tel:${business.tel}">${business.phone}</a><p>${business.phones[0]}<br>${business.phones[1]}</p></div></div><div class="contact-item">${icon('pin')}<div><h3>Địa chỉ</h3><p>${business.address}</p><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}" target="_blank" rel="noopener noreferrer">Xem trên bản đồ ${arrow}</a></div></div><div class="contact-item">${icon('mail')}<div><h3>Email</h3><a class="email-link" href="mailto:${business.email}">${business.email}</a></div></div></div>`;
}
function contactPage() {
  const item=params.get('san-pham')||'';
  return `${breadcrumb('Liên hệ')}${pageHeading('Chúng tôi sẵn sàng lắng nghe','Tư vấn sản phẩm, mua sỉ hoặc tìm đại lý mua lẻ.')}<section class="container contact-layout">${contactDetails()}<div class="contact-form-panel"><h2>Gửi lời nhắn</h2><p>Điền thông tin để soạn email trong ứng dụng thư của bạn.</p><form id="contact-form"><div class="field"><label for="contact-name">Họ và tên <span>*</span></label><input id="contact-name" name="name" autocomplete="name" required maxlength="100" placeholder="Tên của bạn"></div><div class="form-row"><div class="field"><label for="contact-phone">Số điện thoại <span>*</span></label><input id="contact-phone" name="phone" type="tel" autocomplete="tel" required pattern="[+]?[0-9](?: ?[0-9]){7,14}" maxlength="20" placeholder="Số điện thoại liên hệ" title="Nhập 8–15 chữ số, có thể cách nhau bằng khoảng trắng và bắt đầu bằng dấu +."></div><div class="field"><label for="contact-email">Email <span>*</span></label><input id="contact-email" name="email" type="email" autocomplete="email" required maxlength="254" placeholder="Email của bạn"></div></div><div class="field"><label for="contact-topic">Nội dung liên hệ</label><select id="contact-topic" name="topic"><option>Tư vấn sản phẩm</option><option>Mua sỉ / làm đại lý</option><option>Tìm đại lý mua lẻ</option></select></div><div class="field"><label for="contact-message">Lời nhắn <span>*</span></label><textarea id="contact-message" name="message" rows="4" required maxlength="2000" placeholder="Bạn cần chúng tôi hỗ trợ điều gì?">${e(item?`Tôi muốn tìm hiểu sản phẩm: ${item}`:'')}</textarea></div><button class="button" type="submit">${icon('mail')} Soạn email liên hệ</button><p class="form-note">Email chỉ được gửi khi bạn xác nhận trong ứng dụng thư. Hoặc gọi trực tiếp <a href="tel:${business.tel}">${business.phone}</a>.</p><p id="contact-status" role="status"></p></form></div></section>`;
}
function dealerPage() {
  return `${breadcrumb('Làm đại lý')}<section class="dealer-hero"><div class="container"><span class="eyebrow">Đồng hành cùng Vĩnh Thuận Phát</span><h1>Kết nối hương thơm.<br>Mở rộng cơ hội hợp tác.</h1><p>Bạn quan tâm đến việc phân phối nhang thơm, Đèn Bơ Mani và sản phẩm thờ cúng? Hãy trao đổi trực tiếp với nhà phân phối Phúc Nguyên.</p><a class="button" href="tel:${business.tel}">${icon('phone')} Trao đổi hợp tác</a></div></section><section class="container dealer-content"><div><h2>Bắt đầu từ một cuộc trò chuyện</h2><p>Chúng tôi tiếp nhận nhu cầu hợp tác và tư vấn sản phẩm phù hợp với cửa hàng của bạn.</p><ol class="dealer-steps"><li><h3>Chia sẻ nhu cầu</h3><p>Cho chúng tôi biết khu vực, loại cửa hàng và những dòng sản phẩm bạn quan tâm.</p></li><li><h3>Trao đổi trực tiếp</h3><p>Liên hệ để được tư vấn quy cách, giá sỉ và điều kiện hợp tác cụ thể.</p></li><li><h3>Thống nhất hợp tác</h3><p>Các điều khoản được xác nhận trực tiếp cùng nhà phân phối.</p></li></ol><a class="text-link" href="/lien-he/">Thông tin liên hệ ${arrow}</a></div>${contactDetails()}</section>`;
}
function aboutPage() {
  return `${breadcrumb('Về Vĩnh Thuận Phát')}${pageHeading('Vĩnh Thuận Phát','Hương thơm thân thuộc trong không gian gia đình Việt.')}${intro()}<section class="container about-details"><div><h2>Chọn hương theo nhu cầu</h2><p>Khám phá các dòng Thảo Dược, Trầm Hương và Đàn Hương với dạng nhang cây, nhang khoanh và nhang viên. Bên cạnh nhang thơm, danh mục còn có nến, dầu và sản phẩm thờ cúng.</p><a href="/san-pham/" class="button">Khám phá sản phẩm ${arrow}</a></div><div><h2>Nhà phân phối Phúc Nguyên</h2><p>Liên hệ để được tư vấn sản phẩm, mua sỉ và tìm đại lý mua lẻ.</p><p>${business.address}</p><a class="text-link" href="tel:${business.tel}">${icon('phone')} ${business.phone}</a></div></section>`;
}
function accountPage(reset=false) {
  return `${breadcrumb(reset?'Quên mật khẩu':'Tài khoản')}<section class="account-wrap container"><div class="account-art"><div>${brand()}<h2>Hương thơm thân thuộc,<br>gắn kết mỗi nếp nhà.</h2></div></div><div class="account-form"><h1>${reset?'Quên mật khẩu':'Chào bạn trở lại'}</h1><p>${reset?'Nhập email đã đăng ký để yêu cầu khôi phục.':'Đăng nhập tài khoản Vĩnh Thuận Phát.'}</p><p class="notice">Chức năng tài khoản đang chờ kết nối hệ thống. Bạn có thể liên hệ nhà phân phối để được hỗ trợ.</p><form id="account-form"><div class="field"><label for="account-email">${reset?'Email':'Tên đăng nhập hoặc email'}</label><input id="account-email" name="email" type="${reset?'email':'text'}" autocomplete="username" required maxlength="254"></div>${!reset?'<div class="field"><label for="account-password">Mật khẩu</label><div class="password-field"><input id="account-password" type="password" autocomplete="current-password" required maxlength="128"><button type="button" id="toggle-password" aria-pressed="false">Hiện</button></div></div><div class="account-options"><label><input type="checkbox" name="remember"> Ghi nhớ đăng nhập</label><a href="/my-account/lost-password/">Quên mật khẩu?</a></div>':''}<button class="button" type="submit">${reset?'Yêu cầu khôi phục':'Đăng nhập'}</button><p id="account-status" role="status"></p></form><a class="text-link" href="${reset?'/my-account/':'/san-pham/'}">${reset?'Quay lại đăng nhập':'Tiếp tục khám phá sản phẩm'} ${arrow}</a></div></section>`;
}
function notFound() {
  return `<section class="container not-found"><span class="eyebrow">404</span><h1>Trang này không còn ở đây</h1><p>Đường dẫn có thể đã thay đổi. Bạn có thể tìm lại sản phẩm trong danh mục.</p><a class="button" href="/san-pham/">Xem sản phẩm ${arrow}</a></section>`;
}

const views={home,catalog,product:productPage,about:aboutPage,dealer:dealerPage,contact:contactPage,login:()=>accountPage(),reset:()=>accountPage(true),'not-found':notFound};
const pageTitles={home:'Nhang thơm cao cấp',catalog:route.category?categoryName(route.category):'Sản phẩm',about:'Giới thiệu',dealer:'Làm đại lý',contact:'Liên hệ',login:'Đăng nhập',reset:'Quên mật khẩu','not-found':'Không tìm thấy trang',product:products.find(p=>p.slug===route.slug)?.name};
document.title=`${pageTitles[route.page]} | Vĩnh Thuận Phát`;
document.getElementById('app').innerHTML=`<div id="top"></div>${header()}<main id="main" tabindex="-1">${views[route.page]()}</main>${footer()}<dialog id="product-modal" aria-labelledby="modal-title"><button class="modal-close icon-button" aria-label="Đóng cửa sổ">${icon('close')}</button><div id="modal-content"></div></dialog><div class="toast" role="status" hidden></div>`;

const modal=document.getElementById('product-modal');
let returnFocus=null;
let modalProduct=null;
function openModal(content,trigger) {
  if (!modal.open) returnFocus=trigger;
  document.getElementById('modal-content').innerHTML=content;
  document.body.classList.add('modal-open');
  if (!modal.open) modal.showModal();
  modal.querySelector('.modal-close').focus();
}
function closeModal() { modal.close(); }
modal.addEventListener('close',()=>{document.body.classList.remove('modal-open');returnFocus?.focus();modalProduct=null;});
modal.addEventListener('click',event=>{if(event.target===modal){const r=modal.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeModal();}});
document.addEventListener('click',async event=>{
  const quick=event.target.closest('[data-quick]');
  const zoom=event.target.closest('[data-zoom]');
  const share=event.target.closest('[data-share]');
  if(event.target.closest('.modal-close')) closeModal();
  if(quick){modalProduct=products.find(p=>p.slug===quick.dataset.quick);openModal(productContent(modalProduct,true),quick);}
  if(zoom){const p=products.find(p=>p.slug===zoom.dataset.zoom);const back=modal.open&&modalProduct;openModal(`<div class="gallery"><h2 id="modal-title">${e(p.name)}</h2><img src="${p.image}" alt="${e(p.name)}">${back?`<button class="button button-outline" data-gallery-back="${p.slug}">Quay lại thông tin</button>`:''}</div>`,zoom);}
  const galleryBack=event.target.closest('[data-gallery-back]');
  if(galleryBack){const p=products.find(p=>p.slug===galleryBack.dataset.galleryBack);openModal(productContent(p,true),returnFocus);}
  if(share){const url=new URL(productUrl(products.find(p=>p.slug===share.dataset.share)),location.origin).href;try{await navigator.clipboard.writeText(url);showToast('Đã sao chép liên kết sản phẩm.');}catch{openModal(`<div class="share-fallback"><h2 id="modal-title">Liên kết sản phẩm</h2><p>Chọn và sao chép liên kết bên dưới.</p><input aria-label="Liên kết sản phẩm" readonly value="${e(url)}"></div>`,share);modal.querySelector('input').select();}}
});
let toastTimer;
function showToast(message){const toast=document.querySelector('.toast');toast.textContent=message;toast.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.hidden=true,3500);}
const menuButton=document.querySelector('.menu-toggle');
const nav=document.getElementById('main-nav');
function closeMenu(){menuButton.setAttribute('aria-expanded','false');nav.classList.remove('is-open');}
menuButton.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')==='true';menuButton.setAttribute('aria-expanded',String(!open));nav.classList.toggle('is-open',!open);});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){document.querySelectorAll('details.nav-products[open]').forEach(d=>d.open=false);if(menuButton.getAttribute('aria-expanded')==='true'){closeMenu();menuButton.focus();}}});
document.addEventListener('click',event=>{if(!event.target.closest('.site-header')){closeMenu();document.querySelector('.nav-products').open=false;}});

document.getElementById('contact-form')?.addEventListener('submit',event=>{
  event.preventDefault();
  const data=new FormData(event.currentTarget);
  const body=`Họ và tên: ${data.get('name')}\nĐiện thoại: ${data.get('phone')}\nEmail: ${data.get('email')}\n\n${data.get('message')}`;
  location.href=`mailto:${business.email}?subject=${encodeURIComponent(data.get('topic'))}&body=${encodeURIComponent(body)}`;
  document.getElementById('contact-status').textContent='Nếu ứng dụng thư chưa mở, vui lòng gọi 0903 007 095 hoặc gửi email đến địa chỉ bên cạnh.';
});
document.getElementById('account-form')?.addEventListener('submit',event=>{
  event.preventDefault();
  const status=document.getElementById('account-status');
  status.textContent='Chưa thể thực hiện vì tài khoản chưa kết nối hệ thống. Vui lòng liên hệ 0903 007 095 để được hỗ trợ.';
  status.tabIndex=-1;status.focus();
});
document.getElementById('toggle-password')?.addEventListener('click',event=>{
  const input=document.getElementById('account-password');const show=input.type==='password';input.type=show?'text':'password';event.currentTarget.textContent=show?'Ẩn':'Hiện';event.currentTarget.setAttribute('aria-pressed',String(show));
});
document.querySelector('audio').addEventListener('error',()=>document.querySelector('.audio-error').hidden=false);
