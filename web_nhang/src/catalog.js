export const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().trim();

export function filterProducts(products, {q='',group='',form='',category='',sort='default'}={}) {
  const words = normalize(q).split(/\s+/).filter(Boolean);
  const result = products.filter(p => words.every(w => normalize(p.name).includes(w))
    && (!group || p.group === group) && (!form || p.form === form)
    && (!category || p.category === category || p.group === category));
  return sort === 'name' ? result.sort((a,b)=>a.name.localeCompare(b.name,'vi')) : result;
}

export const categorySlugs = [
  'thao-duoc','tram-huong','dan-huong','khac',
  ...['thao-duoc','tram-huong','dan-huong'].flatMap(g=>['cay','khoanh','vien'].map(f=>`nhang-${f}-${g}`)),
  'nhang-que','san-pham-tho-cung','dau-cat-tuong','den-xong-huong',
];
export function resolveRoute(path, products) {
  const clean = path.replace(/\/+$/,'') || '/';
  const pages = {'/':'home','/san-pham':'catalog','/nhang-thom-vinh-thuan-phat':'about','/gioi-thieu':'about','/lam-dai-ly':'dealer','/lien-he':'contact','/my-account':'login','/my-account/lost-password':'reset'};
  if (pages[clean]) return {page:pages[clean]};
  const [,section,slug,...rest] = clean.split('/');
  if (!rest.length && section === 'san-pham' && products.some(p=>p.slug===slug)) return {page:'product',slug};
  if (!rest.length && section === 'danh-muc-san-pham' && categorySlugs.includes(slug)) return {page:'catalog',category:slug};
  return {page:'not-found'};
}
export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}
export function paginate(items, page=1, size=12) {
  const totalPages=Math.max(1,Math.ceil(items.length/size));
  const current=Math.min(totalPages,Math.max(1,Math.trunc(Number(page))||1));
  return {items:items.slice((current-1)*size,current*size),page:current,totalPages,total:items.length};
}
