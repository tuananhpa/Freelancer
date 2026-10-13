export const KEY = 'mobile-store:v1';
const collections = ['products','categories','brands','banners','sections','articles','pages','menus','widgets','media','cart'];
export function safeUrl(value='') {
  const s=String(value).trim();
  if (/^(https?:\/\/|tel:[+\d]|mailto:|#|\/[^/])/.test(s)) return s;
  if (/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(s)) return s;
  return '';
}
export function stockOf(p,variant){return p.variants?.length?(variant?p.variants.find(v=>v.name===variant)?.stock||0:p.variants.reduce((n,v)=>n+v.stock,0)):(p.stock||0);}
export function cartTotal(cart, products) { return reconcileCart(cart,products).reduce((sum,line)=>{const p=products.find(p=>p.id===line.productId); const v=p?.variants?.find(v=>v.name===line.variant); return sum+(v?.price??p.price)*line.quantity;},0); }
export function reconcileCart(cart,products){return cart.flatMap(line=>{const p=products.find(p=>p.id===line.productId&&p.active!==false);if(!p||p.variants?.length&&!p.variants.some(v=>v.name===line.variant))return [];const stock=stockOf(p,line.variant);return stock>0?[{...line,quantity:Math.min(line.quantity,stock,99)}]:[];});}
function validate(data){
  if (!data||!data.settings||typeof data.settings!=='object'||typeof data.settings.name!=='string'||!data.settings.name.trim()||Object.values(data.settings).some(v=>!['string','boolean'].includes(typeof v))||collections.some(k=>!Array.isArray(data[k]))) throw Error('Tệp dữ liệu không hợp lệ.');
  for(const key of collections.filter(k=>k!=='cart'))for(const item of data[key]){
    if(!item||typeof item!=='object'||Array.isArray(item))throw Error('Nội dung dữ liệu không hợp lệ.');
    for(const [field,value] of Object.entries(item)){
      if(field==='variants'){if(!Array.isArray(value)||value.some(v=>!v||typeof v.name!=='string'||!v.name.trim()||!Number.isFinite(v.price)||v.price<0||!Number.isInteger(v.stock)||v.stock<0)||new Set(value.map(v=>v.name)).size!==value.length)throw Error('Dữ liệu phiên bản không hợp lệ.');}
      else if(['price','oldPrice','stock','order','limit'].includes(field)){if(!Number.isFinite(value)||value<0||['stock','order','limit'].includes(field)&&!Number.isInteger(value))throw Error('Giá, tồn kho hoặc thứ tự không hợp lệ.');}
      else if(['active','featured','flash'].includes(field)){if(typeof value!=='boolean')throw Error('Trạng thái dữ liệu không hợp lệ.');}
      else if(typeof value!=='string')throw Error('Nội dung dữ liệu không hợp lệ.');
    }
  }
  for(const p of data.products) { if(typeof p.name!=='string'||!p.name.trim()||!Number.isFinite(p.price)||p.price<0) throw Error('Tên và giá sản phẩm không hợp lệ.'); if(p.category&&!data.categories.some(c=>c.id===p.category)) throw Error('Danh mục sản phẩm không tồn tại.'); }
  for(const line of data.cart)if(!line||typeof line.productId!=='string'||line.variant!==undefined&&typeof line.variant!=='string'||!Number.isInteger(line.quantity)||line.quantity<1||line.quantity>99)throw Error('Dữ liệu giỏ hàng không hợp lệ.');
  for(const key of collections.filter(k=>k!=='cart')) {const ids=data[key].map(v=>v.id);if(ids.some(id=>typeof id!=='string')||new Set(ids).size!==ids.length)throw Error('ID dữ liệu không hợp lệ hoặc trùng lặp.');}
  return data;
}
export function createStore(storage, initial){
  let data=structuredClone(initial), warning='';const listeners=new Set();
  const normalize=next=>{validate(next);next.settings={...initial.settings,...next.settings};next.cart=reconcileCart(next.cart,next.products);return next;};
  try{const raw=storage.getItem(KEY);if(raw)data=normalize(JSON.parse(raw));}catch{warning='Dữ liệu lưu bị lỗi. Đang sử dụng dữ liệu khởi tạo; hãy nhập lại bản sao lưu nếu có.';}
  const commit=next=>{normalize(next);try{storage.setItem(KEY,JSON.stringify(next));}catch{throw Error('Không thể lưu dữ liệu. Bộ nhớ trình duyệt có thể đã đầy; hãy giảm kích thước ảnh hoặc xuất bản sao lưu.');}data=next;listeners.forEach(f=>f());};
  return {
    warning, get:()=>structuredClone(data),subscribe:f=>{listeners.add(f);return()=>listeners.delete(f);},
    upsert:(key,item)=>{if(!collections.includes(key)||key==='cart')throw Error('Mục quản lý không hợp lệ.');const next=structuredClone(data);const value={...item,id:item.id||crypto.randomUUID()};const i=next[key].findIndex(x=>x.id===value.id);if(i<0)next[key].push(value);else next[key][i]=value;commit(next);return value.id;},
    remove:(key,id)=>{if(!collections.includes(key)||key==='cart')throw Error('Mục quản lý không hợp lệ.');if(['categories','brands'].includes(key)&&data.products.some(p=>p[key==='categories'?'category':'brand']===id))throw Error('Hãy chuyển hoặc xóa sản phẩm đang sử dụng mục này trước.');const next=structuredClone(data);next[key]=next[key].filter(x=>x.id!==id);if(key==='products')next.cart=next.cart.filter(x=>x.productId!==id);if(key==='categories')next.sections=next.sections.map(s=>s.category===id?{...s,category:''}:s);commit(next);},
    updateSettings:patch=>commit({...structuredClone(data),settings:{...data.settings,...patch}}),
    setCart:cart=>{if(cart.some(l=>!Number.isInteger(l.quantity)||l.quantity<1||l.quantity>99))throw Error('Số lượng phải từ 1 đến 99.');if(cart.some(l=>{const p=data.products.find(p=>p.id===l.productId);return !p||l.quantity>stockOf(p,l.variant);}))throw Error('Số lượng vượt quá tồn kho hoặc phiên bản không còn tồn tại.');commit({...structuredClone(data),cart});},
    export:()=>JSON.stringify(data,null,2),import:raw=>{let next;try{next=JSON.parse(raw);}catch{throw Error('Tệp dữ liệu không hợp lệ.');}commit(validate(next));},
    reload:()=>{try{const raw=storage.getItem(KEY);if(raw){data=normalize(JSON.parse(raw));listeners.forEach(f=>f());}}catch{listeners.forEach(f=>f());}}
  };
}
