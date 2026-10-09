'use strict';

const iconPaths = {
  arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>', down:'<path d="M12 4v16m-6-6 6 6 6-6"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>', close:'<path d="m6 6 12 12M18 6 6 18"/>',
  bolt:'<path d="m13 2-9 12h7l-1 8 10-13h-7l1-7Z"/>',
  shield:'<path d="M12 3 4 6v6c0 4 4 7 8 9 4-2 8-5 8-9V6l-8-3Z"/><path d="m8 12 3 3 5-6"/>',
  wallet:'<path d="M20 8H5a2 2 0 0 1 0-4h13v4M4 6v13a1 1 0 0 0 1 1h15V8M20 12h-5v4h5"/><path d="M17 14h.1"/>',
  leaf:'<path d="M20 3c-8 0-15 3-15 10a6 6 0 0 0 6 6c7 0 9-8 9-16ZM3 21l12-12"/>',
  wrench:'<path d="M14 4a6 6 0 0 0-7 8L3 17a2.8 2.8 0 0 0 4 4l5-5a6 6 0 0 0 8-7l-4 3-4-4 2-4Z"/>',
  steering:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="m3 10 6 1m6 0 6-1m-9 5v6"/>',
  battery:'<rect x="2" y="6" width="18" height="12" rx="2"/><path d="M22 10v4M6 10v4m4-4v4m4-4v4"/>',
  gift:'<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v9h14v-9M12 8v13M12 8H8a3 3 0 1 1 3-3l1 3Zm0 0h4a3 3 0 1 0-3-3l-1 3Z"/>',
  pin:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  'check-circle':'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.1"/>',
  chat:'<path d="M21 11a9 9 0 0 1-9 9 10 10 0 0 1-4-1l-5 2 1-5a9 9 0 1 1 17-5Z"/><path d="M8 11h8m-8 4h5"/>',
  gauge:'<path d="M4 18a9 9 0 1 1 16 0H4Z"/><path d="m12 14 4-6M7 11h.1M12 6v1m6 4h.1"/>'
};
function icon(name) { return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${iconPaths[name] || iconPaths.arrow}</svg>`; }
function renderIcons(root = document) { root.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); }); }

const products = [
  { id:'evo-grand', name:'Evo Grand', brand:'VINFAST', image:'evo-grand.webp', tag:'Được yêu thích', category:'work', price:19500000, range:'200 km', speed:'70 km/h', colors:['#b82732','#e8e1cf','#32383b'], description:'Thiết kế thanh lịch với đèn tròn đặc trưng. Một lựa chọn để bắt đầu ngày làm việc, ghé quán quen và tận hưởng những chuyến dạo phố.', fit:'Đi làm và di chuyển hằng ngày' },
  { id:'evo-lite', name:'Evo Grand Lite', brand:'VINFAST', image:'evo-lite.webp', tag:'Nhẹ nhàng mỗi ngày', category:'school', price:14500000, range:'180 km', speed:'49 km/h', colors:['#e6ddbd','#8da7a0','#343638'], description:'Kiểu dáng gần gũi, gọn gàng và dễ làm quen. Hãy ngồi thử để kiểm tra chiều cao yên, tầm với tay lái và sự thoải mái của bạn.', fit:'Đi học và các hành trình trong phố' },
  { id:'feliz', name:'Feliz 2025', brand:'VINFAST', image:'feliz.webp', tag:'Linh hoạt dạo phố', category:'work', price:23000000, range:'200 km', speed:'70 km/h', colors:['#f0efe9','#253f55','#a6373d'], description:'Đường nét hiện đại dành cho nhịp sống năng động. Khám phá không gian để chân, chỗ ngồi và các tiện ích trong buổi trải nghiệm thực tế.', fit:'Đi làm, dạo phố và chở thêm người' },
  { id:'evo-premia', name:'Evo Grand Premia', brand:'VINFAST', image:'evo-premia.webp', tag:'Phong cách nổi bật', category:'premium', price:24900000, range:'200 km', speed:'70 km/h', colors:['#afc4b9','#ede4ca','#35373b'], description:'Sắc màu tinh tế cùng những chi tiết mang cảm hứng cổ điển. Dành cho người thích một chiếc xe vừa tiện dụng, vừa thể hiện phong cách riêng.', fit:'Yêu thích thiết kế và sự thanh lịch' }
];
const money = value => value.toLocaleString('vi-VN');
const grid = document.getElementById('product-grid');
function renderProducts(category = 'all') {
  if (!grid) return;
  const items = products.filter(p => category === 'all' || p.category === category);
  grid.innerHTML = items.map(p => `<article class="product-card"><div class="product-image"><span class="product-badge ${p.category==='school'?'green':''}">${p.tag}</span><img src="assets/${p.image}" alt="Xe máy điện VinFast ${p.name}" loading="lazy"></div><div class="product-info"><small>XE MÁY ĐIỆN ${p.brand}</small><h3>${p.name}</h3><div class="color-dots" aria-label="Một số màu xe minh họa">${p.colors.map(c=>`<i style="background:${c}"></i>`).join('')}</div><span class="price-label">Giá demo từ</span><div class="price">${money(p.price)} <small>đ</small></div><div class="product-specs"><span>${icon('battery')} ${p.range}/sạc*</span><span>${icon('gauge')} ${p.speed}*</span></div><div class="product-action"><button class="text-link" data-product="${p.id}">Khám phá xe ${icon('arrow')}</button><button data-model="VinFast ${p.name}" aria-label="Đăng ký lái thử VinFast ${p.name}">${icon('steering')}</button></div></div></article>`).join('');
  document.getElementById('product-count').textContent = `${items.length} mẫu xe`;
}
renderProducts();

document.getElementById('footer').innerHTML = `<div class="footer"><div class="container footer-grid"><div><a class="brand" href="index.html"><span class="brand-mark">H<span></span></span><span>HÀ THÀNH<small>E L E C T R I C</small></span></a><p>Đồng hành cùng bạn trên hành trình chuyển sang xe điện. Một khởi đầu xanh cho nhịp sống mỗi ngày.</p></div><div><h3>Khám phá Hà Thành</h3><div class="footer-links"><a href="index.html#dong-xe">Các dòng xe</a><a href="index.html#uu-dai">Ưu đãi & chương trình</a><a href="index.html#dich-vu">Dịch vụ đồng hành</a><a href="index.html#tin-tuc">Kinh nghiệm sử dụng xe</a></div></div><div><h3>Hẹn bạn một buổi trải nghiệm</h3><div class="footer-links"><a href="index.html#showroom">Không gian showroom</a><a href="#" data-booking>Đăng ký tư vấn & lái thử</a><span>Thông tin liên hệ sẽ được cập nhật<br>theo showroom của bạn.</span></div></div></div><div class="container footer-bottom"><span>© 2026 Hà Thành Electric · Website demo</span><span>Giá, thông số & ưu đãi minh họa · Form không gửi dữ liệu</span></div></div>`;

const bookingDialog = document.getElementById('booking-dialog');
const detailDialog = document.getElementById('detail-dialog');
const form = document.getElementById('booking-form');
function openBooking(model, purpose) {
  if (detailDialog?.open) detailDialog.close();
  form.querySelector('.form-status').textContent = '';
  form.querySelector('button[type="submit"]').textContent = 'Đăng ký trải nghiệm';
  form.querySelectorAll('.field-error').forEach(el => { el.textContent=''; });
  form.querySelectorAll('[aria-invalid]').forEach(el => { el.removeAttribute('aria-invalid'); });
  if (model) form.elements.model.value = model;
  if (purpose) form.elements.purpose.value = purpose;
  bookingDialog.showModal();
}
function showProduct(id) {
  const p = products.find(item=>item.id===id);
  if (!p || !detailDialog) return;
  document.getElementById('detail-content').innerHTML=`<div class="detail-layout"><img src="assets/${p.image}" alt="VinFast ${p.name}"><div><div class="eyebrow">XE MÁY ĐIỆN VINFAST</div><h2>${p.name}</h2><p>${p.description}</p><div class="price">${money(p.price)} <small>đ · Giá demo</small></div><ul class="detail-spec-list"><li>Quãng đường minh họa<strong>${p.range}/sạc</strong></li><li>Tốc độ minh họa<strong>${p.speed}</strong></li><li>Phù hợp với<strong>${p.fit}</strong></li></ul><p class="fine-print">Các số liệu là dữ liệu mẫu. Quãng đường thực tế phụ thuộc điều kiện vận hành, tải trọng và cấu hình pin.</p><button class="button full-width" data-model="VinFast ${p.name}">Trải nghiệm chiếc xe này ${icon('arrow')}</button></div></div>`;
  detailDialog.showModal();
}
document.addEventListener('click', e=>{
  const filter=e.target.closest('[data-filter]');
  if(filter){document.querySelectorAll('[data-filter]').forEach(b=>{const selected=b===filter;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));});renderProducts(filter.dataset.filter);}
  const product=e.target.closest('[data-product]');if(product)showProduct(product.dataset.product);
  const booking=e.target.closest('[data-booking], [data-model]');if(booking){e.preventDefault();openBooking(booking.dataset.model,booking.dataset.purpose);}
  const close=e.target.closest('[data-close]');if(close)close.closest('dialog').close();
  const service=e.target.closest('[data-service]');if(service && detailDialog){document.getElementById('detail-content').innerHTML=`<div class="service-detail"><div class="eyebrow">DỊCH VỤ ĐỒNG HÀNH</div><h2>Chăm sóc xe để mỗi ngày an tâm.</h2><p>Buổi tư vấn bảo dưỡng giúp bạn hiểu lịch kiểm tra phù hợp với chiếc xe đang sử dụng.</p><ul><li>Kiểm tra lốp, hệ thống phanh và đèn chiếu sáng.</li><li>Tìm hiểu lịch bảo dưỡng theo hướng dẫn của nhà sản xuất.</li><li>Trao đổi về pin, bộ sạc và những dấu hiệu cần kiểm tra.</li></ul><p>Lịch hẹn và phạm vi dịch vụ trong demo chỉ dùng để trải nghiệm giao diện.</p><button class="button" data-booking data-purpose="Tư vấn bảo dưỡng">Hẹn tư vấn bảo dưỡng ${icon('arrow')}</button></div>`;detailDialog.showModal();}
});
document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}}));
form.addEventListener('submit', e=>{
  e.preventDefault();
  const name=form.elements.name, phone=form.elements.phone;
  const nameValid=name.value.trim().length>=2, phoneValid=/^(0\d{9}|\+84\d{9})$/.test(phone.value.replace(/[\s.()-]/g,''));
  name.setAttribute('aria-describedby','name-error');phone.setAttribute('aria-describedby','phone-error');
  name.setAttribute('aria-invalid',String(!nameValid));phone.setAttribute('aria-invalid',String(!phoneValid));
  document.getElementById('name-error').textContent=nameValid?'':'Vui lòng nhập tên của bạn (ít nhất 2 ký tự).';
  document.getElementById('phone-error').textContent=phoneValid?'':'Nhập số điện thoại Việt Nam gồm 10 số, bắt đầu bằng 0.';
  if(!nameValid || !phoneValid){(nameValid?phone:name).focus();return;}
  const status=form.querySelector('.form-status');status.textContent='Bạn đã hoàn tất thao tác đăng ký demo. Không có lịch hẹn thực tế được tạo và thông tin chưa được gửi đi.';
  status.focus();form.querySelector('button[type="submit"]').textContent='Thử đăng ký lại';
  name.value='';phone.value='';
});
const menuButton=document.querySelector('.menu-toggle'), nav=document.getElementById('main-nav');
menuButton?.addEventListener('click',()=>{const open=nav.classList.toggle('open');menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Đóng menu':'Mở menu');});
nav?.addEventListener('click',e=>{if(e.target.closest('a')){nav.classList.remove('open');menuButton?.setAttribute('aria-expanded','false');menuButton?.setAttribute('aria-label','Mở menu');}});
document.addEventListener('keydown',e=>{if(e.key==='Escape' && nav?.classList.contains('open')){nav.classList.remove('open');menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Mở menu');menuButton.focus();}});
renderIcons();
