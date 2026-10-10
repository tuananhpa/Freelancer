export const STORAGE_KEY='cec.frontend.v1';
const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
const localized=v=>object(v)&&typeof v.vi==='string'&&typeof v.en==='string';
const strings=(v,keys)=>object(v)&&keys.every(k=>typeof v[k]==='string');
const content=v=>strings(v,['title','subtitle','body','heroImage','buttonLabel','buttonLink'])&&Array.isArray(v.sections)&&v.sections.every(i=>strings(i,['id','title','body','image','link'])&&typeof i.visible==='boolean');
const pageMap=v=>object(v)&&Object.values(v).every(p=>object(p)&&content(p.vi)&&content(p.en));
const customer=v=>strings(v,['name','phone'])&&['company','email','message'].every(k=>v[k]===undefined||typeof v[k]==='string');
export function validState(s){
 if(!object(s)||!pageMap(s.pages)||!pageMap(s.drafts)||!Array.isArray(s.contacts)||!s.contacts.every(c=>strings(c,['id','createdAt','status'])&&customer(c.customer)))return false;
 if(!Array.isArray(s.products)||!s.products.every(p=>localized(p.description))||!Array.isArray(s.facilities)||!s.facilities.every(f=>localized(f.description))||!Array.isArray(s.articles)||!s.articles.every(a=>localized(a.summary)))return false;
 return object(s)&&s.version===1&&['products','orders','articles','widgets','facilities','cart','contacts'].every(k=>Array.isArray(s[k]))&&object(s.pages)&&object(s.drafts)&&s.products.every(p=>object(p)&&typeof p.id==='string'&&localized(p.name)&&typeof p.unit==='string'&&typeof p.image==='string'&&typeof p.published==='boolean')&&s.articles.every(a=>object(a)&&typeof a.id==='string'&&localized(a.title)&&localized(a.body))&&s.facilities.every(f=>object(f)&&typeof f.id==='string'&&typeof f.name==='string'&&typeof f.address==='string')&&s.widgets.every(w=>object(w)&&typeof w.id==='string'&&typeof w.platform==='string'&&typeof w.url==='string')&&s.orders.every(o=>object(o)&&typeof o.id==='string'&&object(o.customer)&&Array.isArray(o.items)&&o.items.every(i=>object(i)&&localized(i.name)&&typeof i.quantity==='number'))&&s.cart.every(i=>object(i)&&typeof i.productId==='string'&&Number.isFinite(Number(i.quantity)));
}
export function loadState(storage,seed){try{const raw=storage.getItem(STORAGE_KEY);if(!raw)return {state:structuredClone(seed),warning:''};const s=JSON.parse(raw);if(!validState(s))throw new Error('Invalid storage');return {state:s,warning:''};}catch{return {state:structuredClone(seed),warning:'Không đọc được dữ liệu đã lưu. Nội dung gốc đã được khôi phục để xem; dữ liệu lỗi chưa bị ghi đè.'}};}
export function saveState(storage,next){if(!validState(next))throw new Error('Dữ liệu không hợp lệ.');try{storage.setItem(STORAGE_KEY,JSON.stringify(next));}catch{throw new Error('Không thể lưu trong trình duyệt. Kiểm tra dung lượng hoặc quyền lưu dữ liệu; thay đổi chưa được ghi.');}}

