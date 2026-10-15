import {site,projects} from './data.js';
export const CONTENT_KEY='portfolio.content.v1';
export const BLOCK_TYPES={hero:'Mở đầu / Hero',projects:'Dự án',services:'Dịch vụ',process:'Quy trình',about:'Giới thiệu nhóm',faq:'Câu hỏi thường gặp',cta:'Liên hệ / CTA',gallery:'Thư viện ảnh',text:'Nội dung văn bản'};
const clone=value=>JSON.parse(JSON.stringify(value));
export function newSection(type){
 if(!Object.hasOwn(BLOCK_TYPES,type))throw Error('Loại khối không được hỗ trợ.');
 const defaults={hero:{title:'Thiết kế tốt.\nSản phẩm chạy tốt.',description:'Chúng tôi thiết kế và phát triển website, web app cho ý tưởng của bạn.'},projects:{title:'Dự án nổi bật',description:'',useFeatured:true,projectSlugs:[]},services:{title:'Dịch vụ của chúng tôi',description:'Từ ý tưởng đến sản phẩm hoàn thiện.'},process:{title:'Quy trình làm việc',description:'Rõ ràng từng bước, từ ý tưởng đến bàn giao.'},about:{title:'Một nhóm,\nnhiều chuyên môn.',description:'Cùng kết hợp thiết kế, công nghệ và tư duy sản phẩm để tạo nên trải nghiệm phù hợp với từng dự án.'},faq:{title:'Một vài điều bạn có thể muốn biết',description:''},cta:{title:'Cùng làm dự án tiếp theo.',description:'Chia sẻ ý tưởng của bạn để cùng tìm giải pháp phù hợp.',buttonLabel:'Liên hệ báo giá',buttonHref:'/lien-he/'},gallery:{title:'Hình ảnh dự án',description:'',images:[]},text:{title:'Một câu chuyện mới',description:'Viết nội dung của bạn tại đây.'}};
 return {id:`block-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`,type,enabled:true,props:defaults[type]};
}
export function createDocument(){return {version:1,site:clone(site),projects:clone(projects),sections:['hero','projects','services','process','about','cta'].map(type=>newSection(type))};}
export function safeLinkUrl(value,{internal=false}={}){
 if(typeof value!=='string')return false;if(value==='')return true;
 if(internal&&/^\/(?!\/)/.test(value)&&!value.includes('\\')&&!/[\x00-\x20]/.test(value))return true;
 try{const u=new URL(value);return ['http:','https:'].includes(u.protocol)&&!/[\x00-\x20]/.test(value);}catch{return false;}
}
export function safeMediaUrl(value){return typeof value==='string'&&(safeLinkUrl(value,{internal:true})||/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(value));}
export function validateDocument(doc){
 const errors=[];const text=(v,max=5000)=>typeof v==='string'&&v.length<=max;
 if(!doc||typeof doc!=='object'||Array.isArray(doc))return ['Cấu hình phải là một đối tượng JSON.'];
 if(doc.version!==1)errors.push('Phiên bản cấu hình không được hỗ trợ.');
 if(!doc.site||!text(doc.site.name,150)||!doc.site.name.trim()||!text(doc.site.description))errors.push('Tên nhóm và mô tả không hợp lệ.');
 if(doc.site){for(const k of ['zalo','facebook','booking'])if(!safeLinkUrl(doc.site[k]??''))errors.push(`Link ${k} không hợp lệ.`);if(doc.site.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(doc.site.email))errors.push('Email nhóm không hợp lệ.');}
 if(!Array.isArray(doc.projects)||doc.projects.length>200)errors.push('Danh sách dự án không hợp lệ (tối đa 200).');
 else{const slugs=new Set();for(const p of doc.projects){
   if(!p||typeof p!=='object'){errors.push('Dự án không hợp lệ.');continue;}
   if(!text(p.slug,120)||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug)||slugs.has(p.slug))errors.push('Slug dự án phải duy nhất, gồm chữ thường, số và dấu gạch ngang.');slugs.add(p.slug);
   if(!text(p.title,150)||!p.title.trim()||!text(p.subtitle,200)||!text(p.description))errors.push('Tên hoặc mô tả dự án không hợp lệ.');
   if(!['Website','App','UI/UX','Khác'].includes(p.category)||!['draft','published'].includes(p.status)||!['sage','blue','lilac'].includes(p.color)||!['store','booking','dashboard','image'].includes(p.preview)||typeof p.featured!=='boolean')errors.push(`Thiết lập dự án ${p.slug} không hợp lệ.`);
   for(const k of ['problem','solution','duration','result','kind'])if(p[k]!==undefined&&!text(p[k]))errors.push(`Nội dung ${k} không hợp lệ.`);
   for(const k of ['live','github','video'])if(!safeLinkUrl(p[k]??''))errors.push(`Link ${k} của ${p.slug} không hợp lệ.`);
   if(!safeMediaUrl(p.cover??'')||(p.cover??'').length>1500000)errors.push('Ảnh đại diện không hợp lệ hoặc quá lớn.');
   for(const k of ['tech','scope','roles'])if(!Array.isArray(p[k])||p[k].length>50||p[k].some(v=>!text(v,1500)))errors.push(`Danh sách ${k} không hợp lệ.`);
   if(!Array.isArray(p.images)||p.images.length>30||p.images.some(i=>!i||!safeMediaUrl(i.src)||!i.src||!text(i.alt,300)||!text(i.caption??'',1000)))errors.push('Gallery dự án không hợp lệ.');
 }}
 if(!Array.isArray(doc.sections)||doc.sections.length>40)errors.push('Trang chủ tối đa 40 khối.');
 else{const ids=new Set();for(const s of doc.sections){
  if(!s||!text(s.id,150)||!s.id||ids.has(s.id)||!Object.hasOwn(BLOCK_TYPES,s.type)||typeof s.enabled!=='boolean'||!s.props||typeof s.props!=='object'||Array.isArray(s.props)){errors.push('Khối trang chủ không hợp lệ.');continue;}ids.add(s.id);
  const p=s.props;for(const k of ['title','description','buttonLabel'])if(p[k]!==undefined&&!text(p[k]))errors.push('Nội dung khối không hợp lệ.');
  if(p.buttonHref!==undefined&&!safeLinkUrl(p.buttonHref,{internal:true}))errors.push('Link nút trong khối không hợp lệ.');
  if(p.items!==undefined&&(!Array.isArray(p.items)||p.items.length>30||p.items.some(i=>!i||!text(i.title,300)||!text(i.description))))errors.push('Danh sách nội dung trong khối không hợp lệ.');
  if((s.type==='gallery'||p.images!==undefined)&&(!Array.isArray(p.images)||p.images.length>30||p.images.some(i=>!i||!safeMediaUrl(i.src)||!i.src||!text(i.alt,300)||!text(i.caption??'',1000))))errors.push('Ảnh trong khối không hợp lệ.');
  if(p.projectSlugs!==undefined&&(!Array.isArray(p.projectSlugs)||p.projectSlugs.some(v=>!text(v,120))||new Set(p.projectSlugs).size!==p.projectSlugs.length))errors.push('Lựa chọn dự án trong khối không hợp lệ.');
  if(p.useFeatured!==undefined&&typeof p.useFeatured!=='boolean')errors.push('Cách chọn dự án không hợp lệ.');
 }}return [...new Set(errors)];
}
export function upsertProject(doc,project,originalSlug=''){
 const next=clone(doc);const index=next.projects.findIndex(p=>p.slug===originalSlug);
 if(next.projects.some((p,i)=>p.slug===project.slug&&i!==index))throw Error('Slug này đã được dùng cho một dự án khác.');
 if(index<0)next.projects.push(clone(project));else next.projects[index]=clone(project);
 if(originalSlug&&originalSlug!==project.slug)for(const s of next.sections)if(s.props.projectSlugs)s.props.projectSlugs=s.props.projectSlugs.map(v=>v===originalSlug?project.slug:v);
 const errors=validateDocument(next);if(errors.length)throw Error(errors.join(' '));return next;
}
export function moveItem(items,index,offset){const next=items.slice();const target=index+offset;if(index<0||target<0||index>=next.length||target>=next.length)return next;[next[index],next[target]]=[next[target],next[index]];return next;}
export function saveDocument(doc,storage){const errors=validateDocument(doc);if(errors.length)return {saved:false,error:errors.join(' ')};try{storage.setItem(CONTENT_KEY,JSON.stringify(doc));return {saved:true};}catch{return {saved:false,error:'Không thể lưu trên trình duyệt (hết dung lượng hoặc bị chặn). Hãy xuất JSON để giữ chỉnh sửa, hoặc dùng link ảnh thay cho tệp lớn.'};}}
export function loadDocument(storage){try{const raw=storage?.getItem(CONTENT_KEY);if(!raw)return {document:createDocument(),recovered:false};const doc=JSON.parse(raw);if(validateDocument(doc).length)throw Error('Invalid');return {document:doc,recovered:false};}catch{return {document:createDocument(),recovered:true};}}
