import {seed} from './seed.js';
import {createStore,safeUrl} from './store.js';
import {storefront} from './storefront.js';
import {admin,editor,readFields} from './admin.js';
import {toast,attachImageFallback,money,sorted} from './ui.js';
const store=createStore(localStorage,seed);const app=document.querySelector('#app');const dialog=document.querySelector('#editor');
if(location.pathname==='/admin'&&!location.hash)location.hash='admin';
function render(){const data=store.get();const route=location.hash.slice(1)||'home';const isAdmin=route.startsWith('admin');document.body.classList.toggle('is-admin',isAdmin);document.documentElement.style.setProperty('--primary',/^#[\da-f]{6}$/i.test(data.settings.primary)?data.settings.primary:'#c8102e');document.title=isAdmin?`Quản trị | ${data.settings.name}`:data.settings.seoTitle||data.settings.name;document.querySelector('meta[name="description"]').content=data.settings.seoDescription||'';let favicon=document.querySelector('link[rel="icon"]');if(!favicon){favicon=document.createElement('link');favicon.rel='icon';document.head.append(favicon);}favicon.href=safeUrl(data.settings.favicon)||'/assets/empty.svg';app.innerHTML=isAdmin?admin(data,route):storefront(data,route);attachImageFallback();}
store.subscribe(render);window.addEventListener('storage',e=>{if(e.key==='mobile-store:v1')store.reload();});window.addEventListener('hashchange',()=>{dialog.close();render();window.scrollTo(0,0);});render();if(store.warning)toast(store.warning,true);
function attempt(action){try{action();}catch(error){toast(error.message,true);}}
function openEditor(key,id){dialog.innerHTML=editor(store.get(),key,id);dialog.showModal();attachImageFallback();}
function addToCart(productId,quantity=1,variant){const data=store.get();const p=data.products.find(p=>p.id===productId&&p.active!==false);if(!p)throw Error('Sản phẩm không còn hiển thị.');const v=p.variants?.find(v=>v.name===(variant||p.variants[0]?.name));const name=v?.name||'Tiêu chuẩn';const stock=v?.stock??p.stock;const cart=data.cart;const line=cart.find(l=>l.productId===productId&&l.variant===name);if((line?.quantity||0)+quantity>Math.min(stock,99))throw Error('Số lượng vượt quá tồn kho hoặc giới hạn 99 sản phẩm.');if(line)line.quantity+=quantity;else cart.push({productId,variant:name,quantity});store.setCart(cart);toast('Đã thêm sản phẩm vào giỏ hàng.');}
document.addEventListener('click',event=>{
 const button=event.target.closest('button,[data-add],[data-clear-image]');if(!button)return;
 if(button.dataset.create)openEditor(button.dataset.create);
 if(button.dataset.edit)openEditor(button.dataset.edit,button.dataset.id);
 if(button.hasAttribute('data-close-editor'))dialog.close();
 if(button.dataset.delete)attempt(()=>{const key=button.dataset.delete;const item=store.get()[key].find(i=>i.id===button.dataset.id);if(confirm(`Xóa “${item.name||item.title}”? Thao tác này sẽ xóa nội dung khỏi cửa hàng.`)){store.remove(key,item.id);toast('Đã xóa nội dung.');}});
 if(button.dataset.toggle)attempt(()=>{const key=button.dataset.toggle;const item=store.get()[key].find(i=>i.id===button.dataset.id);store.upsert(key,{...item,active:item.active===false});toast(item.active===false?'Đã bật hiển thị.':'Đã ẩn nội dung.');});
 if(button.dataset.move)attempt(()=>{const key=button.dataset.move;const list=sorted(store.get()[key]);const i=list.findIndex(x=>x.id===button.dataset.id);const j=i+Number(button.dataset.dir);if(j<0||j>=list.length)return;[list[i],list[j]]=[list[j],list[i]];const backup=store.get();backup[key]=list.map((x,n)=>({...x,order:n}));store.import(JSON.stringify(backup));});
 if(button.dataset.add)attempt(()=>addToCart(button.dataset.add));
 if(button.hasAttribute('data-cart-remove'))attempt(()=>{const data=store.get();data.cart.splice(Number(button.dataset.cartRemove),1);store.setCart(data.cart);});
 if(button.dataset.gallery)document.querySelector('.main-product-image').src=button.dataset.gallery;
 if(button.hasAttribute('data-slide-select')){document.querySelectorAll('[data-slide]').forEach(el=>el.classList.toggle('selected',el.dataset.slide===button.dataset.slideSelect));document.querySelectorAll('[data-slide-select]').forEach(el=>el.classList.toggle('selected',el===button));}
 if(button.id==='preview-toggle')document.querySelector('.preview-panel').hidden=false;
 if(button.id==='preview-close')document.querySelector('.preview-panel').hidden=true;
 if(button.id==='export-data'){const url=URL.createObjectURL(new Blob([store.export()],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='mobile-store-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Đã xuất bản sao lưu.');}
 if(button.dataset.copyImage)navigator.clipboard.writeText(button.dataset.copyImage).then(()=>toast('Đã sao chép URL ảnh.')).catch(()=>toast('Không thể sao chép. Hãy mở Sửa để lấy URL ảnh.',true));
 if(button.dataset.clearImage){const container=button.closest('.image-field');container.querySelector('input[name]').value='';container.querySelector('img').src='/assets/empty.svg';}
});
document.addEventListener('submit',event=>{const form=event.target;event.preventDefault();
 if(form.id==='search-form'||form.id==='filter-form'){const params=new URLSearchParams(new FormData(form));location.hash='catalog?'+params.toString();}
 if(form.id==='admin-search-form')location.hash=`admin/${form.dataset.key}?q=${encodeURIComponent(form.elements.q.value)}`;
 if(form.id==='purchase-form')attempt(()=>addToCart(form.dataset.product,Number(form.elements.quantity.value),form.elements.variant.value));
 if(form.id==='settings-form')attempt(()=>{const values=readFields(form);validateUrls(values);store.updateSettings(values);toast('Đã lưu cài đặt. Cửa hàng đã cập nhật.');});
 if(form.id==='entity-form'){try{const values=readFields(form);validateUrls(values);if(values.limit!==undefined&&(values.limit<1||values.limit>50))throw Error('Số sản phẩm hiển thị phải từ 1 đến 50.');const key=form.dataset.key;const previous=store.get()[key].find(x=>x.id===form.dataset.id);store.upsert(key,{...previous,...values,id:form.dataset.id||undefined});dialog.close();toast('Đã lưu nội dung. Cửa hàng đã cập nhật.');}catch(error){form.querySelector('.form-error').textContent=error.message;}}
});
function validateUrls(values){for(const key of ['image','logo','favicon','link','heroLink','socialFacebook','socialYoutube'])if(values[key]&&!safeUrl(values[key]))throw Error('Liên kết hoặc URL ảnh không hợp lệ. Dùng https://, đường dẫn /assets/..., #trang hoặc tel:.');if(values.gallery&&values.gallery.split('\n').some(u=>u.trim()&&!safeUrl(u)))throw Error('URL ảnh bổ sung không hợp lệ.');}
document.addEventListener('change',async event=>{const el=event.target;
 if(el.matches('#filter-form select'))el.form.requestSubmit();
 if(el.name==='variant'&&el.form?.id==='purchase-form'){document.querySelector('#variant-price').textContent=money(el.selectedOptions[0].dataset.price);const stock=Number(el.selectedOptions[0].dataset.stock);el.form.elements.quantity.max=Math.min(99,stock);el.form.elements.quantity.value=stock>0?Math.min(Number(el.form.elements.quantity.value)||1,stock):1;const button=el.form.querySelector('.buy-button');button.disabled=stock<1;button.textContent=stock<1?'Hết hàng':'Thêm vào giỏ hàng';}
 if(el.hasAttribute('data-cart-index'))attempt(()=>{const data=store.get();const line=data.cart[Number(el.dataset.cartIndex)];const p=data.products.find(p=>p.id===line.productId);const stock=p.variants?.find(v=>v.name===line.variant)?.stock??p.stock;const quantity=Number(el.value);if(quantity>stock){el.value=line.quantity;throw Error('Số lượng vượt quá tồn kho.');}line.quantity=quantity;store.setCart(data.cart);});
 if(el.hasAttribute('data-media-field')){if(el.value){const container=el.closest('.image-field');container.querySelector('input[name]').value=el.value;container.querySelector('img').src=el.value;}}
 if(el.hasAttribute('data-upload-field')){const file=el.files[0];if(!file)return;try{const src=await resizeImage(file);const container=el.closest('.image-field');container.querySelector('input[name]').value=src;container.querySelector('img').src=src;toast('Ảnh đã được chọn. Bấm Lưu để áp dụng.');}catch(error){toast(error.message,true);el.value='';}}
 if(el.id==='import-data'&&el.files[0]){try{const raw=await el.files[0].text();if(confirm('Thay thế toàn bộ dữ liệu hiện tại bằng bản sao lưu này?')){store.import(raw);toast('Đã khôi phục dữ liệu.');}}catch(error){toast(error.message,true);}el.value='';}
});
export async function resizeImage(file){if(!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type))throw Error('Chỉ hỗ trợ ảnh PNG, JPG, WebP và GIF.');if(file.size>12*1024*1024)throw Error('Ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 12 MB.');const url=URL.createObjectURL(file);try{const img=new Image();img.src=url;await img.decode();const scale=Math.min(1,1600/Math.max(img.width,img.height));const canvas=document.createElement('canvas');canvas.width=img.width*scale;canvas.height=img.height*scale;canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);return canvas.toDataURL('image/webp',0.82);}finally{URL.revokeObjectURL(url);}}
