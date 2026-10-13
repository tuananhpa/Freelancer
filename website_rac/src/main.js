import './styles.css';
import { createRepository } from './repository.js';
import { readBinContext } from './bin-context.js';
import * as views from './views.js';
const app=document.querySelector('#app');
const blockedStorage={getItem(){throw Error('Storage unavailable');},setItem(){throw Error('Storage unavailable');}};
let storage;try{storage=window.localStorage;}catch{storage=blockedStorage;}
const r=createRepository(storage);
let sessionStore;try{sessionStore=window.sessionStorage;}catch{sessionStore=null;}
const bin=readBinContext(location.search,sessionStore);
const ctx={r,bin,route:'home',week:'2026-10-12',type:'all',search:'',adminTab:'overview'};
let toastTimer;
function toast(message){const el=document.querySelector('#toast');el.textContent=message;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),4000);}
function render(focus=false) {
  const parts=location.hash.replace(/^#\/?/,'').split('/');
  ctx.route=parts[0]||'home';ctx.adminTab=parts[1]||'overview';
  if(ctx.route==='admin'&&!['overview','members','points','settings','content'].includes(ctx.adminTab))ctx.adminTab='overview';
  const page={home:views.home,rankings:views.rankings,history:views.history,account:views.account,classes:views.classPage,admin:views.admin,login:c=>views.auth(c),register:c=>views.auth(c,true)}[ctx.route];
  if(!page){location.hash='#/home';return;}
  app.innerHTML=`<div class="site-shell ${ctx.route==='home'?'home-shell':''}">${views.header(ctx)}<main id="main" tabindex="-1">${page(ctx)}</main><footer class="site-footer">${new Date().getFullYear()} <span>•</span> Cùng nhau xây dựng trường học xanh</footer></div>${views.guide()}`;
  document.title=`${{home:'Trang chủ',rankings:'Thi đua',history:'Lịch sử',account:'Tài khoản',classes:'Tham gia lớp',admin:'Quản trị',login:'Đăng nhập',register:'Đăng ký'}[ctx.route]} · Trường học xanh`;
  if(focus){document.querySelector('#main').focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
}
window.addEventListener('hashchange',()=>render(true));
app.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;
  try{
    if(button.dataset.action==='guide')document.querySelector('#guide-dialog').showModal();
    if(button.dataset.action==='close-guide')document.querySelector('#guide-dialog').close();
    if(button.dataset.action==='logout'){r.logout();location.hash='#/login';toast('Bạn đã đăng xuất.');}
    if(button.dataset.action==='preview-student'){r.previewStudent();location.hash='#/home';}
    if(button.dataset.approve){r.approveMember(button.dataset.approve);render();toast('Đã duyệt thành viên.');}
    if(button.dataset.reject){r.rejectMember(button.dataset.reject);render();toast('Đã từ chối yêu cầu gia nhập.');}
    if(button.dataset.filter){ctx.type=button.dataset.filter;render();}
    if(button.dataset.removeImage){r.updateSettings({[button.dataset.removeImage]:''});render();toast('Đã xóa ảnh trên trình duyệt này.');}
  }catch(e){toast(e.message);}
});
app.addEventListener('change',event=>{if(event.target.name==='week'){ctx.week=event.target.value;render();}});
app.addEventListener('input',event=>{
  if(event.target.name==='history-search'){
    const start=event.target.selectionStart;ctx.search=event.target.value;render();const input=document.querySelector('[name="history-search"]');input.focus();input.setSelectionRange(start,start);
  }
});
async function readImage(file) {
  if(!file?.size)return undefined;
  if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('Ảnh cần là PNG, JPG hoặc WebP.');
  if(file.size>2*1024*1024)throw Error('Mỗi ảnh tối đa 2 MB.');
  return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('Không đọc được ảnh.'));reader.readAsDataURL(file);});
}
app.addEventListener('submit',async event=>{
  event.preventDefault();const form=event.target,fields=new FormData(form),data=Object.fromEntries(fields);const error=form.querySelector('.form-error'),submit=form.querySelector('button[type="submit"],button:not([type])');
  if(error)error.textContent='';if(submit)submit.disabled=true;
  try {
    if(form.id==='auth-form'){
      if(form.dataset.mode==='register'){
        if(data.password!==data.confirm)throw Error('Mật khẩu xác nhận không khớp.');
        await r.register(data);location.hash='#/classes';
      }else{await r.login(data.email,data.password);location.hash=r.currentUser().membership==='approved'?'#/home':'#/classes';}
    }
    if(form.id==='class-form'){r.requestClass(data.classId);location.hash='#/home';toast(r.currentUser().membership==='approved'?'Bạn đã tham gia lớp.':'Đã gửi yêu cầu gia nhập lớp.');}
    if(form.id==='settings-form'){r.updateSettings({approvalMode:data.approvalMode,points:{plastic:Number(data.plastic),metal:Number(data.metal)}});render();toast('Đã lưu cài đặt trên trình duyệt này.');}
    if(form.id==='content-form'){
      const patch={};for(const key of ['schoolName','productName','waitingTitle','waitingDescription','footerText']){patch[key]=String(data[key]).trim();if(!patch[key])throw Error('Vui lòng điền đủ nội dung.');}
      for(const key of ['logoImage','schoolImage']){const img=await readImage(fields.get(key));if(img)patch[key]=img;}
      r.updateSettings(patch);render();toast('Đã lưu nội dung trên trình duyệt này.');
    }
    if(form.id==='points-form'){r.adjustPoints(data.userId,Number(data.points),data.reason);render();toast('Đã lưu điều chỉnh điểm.');}
  } catch(e){if(error){error.textContent=e.message;error.focus();}else toast(e.message);}finally{if(submit?.isConnected)submit.disabled=false;}
});
render();if(r.storageError)toast(r.storageError);
