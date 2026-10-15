import './styles.css';
import './student-styles.css';
import './decorations.css';
import './home-visuals.css';
import './page-visuals.css';
import './school-branding.css';
import { createRepository } from './repository.js';
import { readBinContext } from './bin-context.js';
import { generateBinQR } from './qr.js';
import { qrOutput } from './qr-panel.js';
import * as views from './views.js';
const app=document.querySelector('#app');
const blockedStorage={getItem(){throw Error('Storage unavailable');},setItem(){throw Error('Storage unavailable');}};
let storage;try{storage=window.localStorage;}catch{storage=blockedStorage;}
const r=createRepository(storage);
let sessionStore;try{sessionStore=window.sessionStorage;}catch{sessionStore=null;}
const bin=readBinContext(location.search,sessionStore);
const ctx={r,bin,route:'home',week:'2026-10-12',type:'all',search:'',adminTab:'overview'};
ctx.qr={base:location.origin+location.pathname,binId:bin||'R01',result:null};
ctx.students={classId:'all',search:'',preview:null};
ctx.registration={student:null,code:'',name:''};
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
app.addEventListener('click',async event=>{
  const button=event.target.closest('button');if(!button)return;
  try{
    if(button.dataset.removeClass){r.removeClass(button.dataset.removeClass);if(ctx.students.classId===button.dataset.removeClass)ctx.students.classId='all';ctx.students.preview=null;render();toast('Đã xóa lớp trống.');}
    if(button.dataset.action==='change-student'){ctx.registration.student=null;render();}
    if(button.dataset.action==='cancel-import'){ctx.students.preview=null;render();}
    if(button.dataset.action==='student-template'){
      const excel=await import('./student-excel.js');excel.downloadWorkbook(excel.templateWorkbook(),'mau-danh-sach-hoc-sinh.xlsx');
    }
    if(button.dataset.action==='confirm-import'&&ctx.students.preview){
      const result=r.importStudents(ctx.students.preview.students);ctx.students.preview=null;render();toast(`Đã nhập ${result.added} học sinh${result.newClasses.length?`, tạo ${result.newClasses.length} lớp mới`:''}, bỏ qua ${result.skipped} mã đã có.`);
    }
    if(button.dataset.action==='export-students'){
      const excel=await import('./student-excel.js');excel.downloadWorkbook(excel.makeStudentWorkbook(r.students(),ctx.students.classId),`ma-hoc-sinh-${ctx.students.classId==='all'?'tat-ca-lop':ctx.students.classId}.xlsx`);
    }
    if(button.dataset.action==='copy-qr'&&ctx.qr.result){
      try{await navigator.clipboard.writeText(ctx.qr.result.url);toast('Đã sao chép link của mã QR.');}
      catch{const input=document.querySelector('#qr-result-url');input?.focus();input?.select();toast('Hãy sao chép link đang được chọn.');}
    }
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
app.addEventListener('change',event=>{
  if(event.target.name==='week'){ctx.week=event.target.value;render();}
  if(event.target.name==='rosterClass'){ctx.students.classId=event.target.value;render();}
  if(event.target.name==='studentFile'){ctx.students.preview=null;document.querySelector('.import-preview')?.remove();}
});
app.addEventListener('input',event=>{
  if(event.target.name==='rosterSearch'){
    const position=event.target.selectionStart;ctx.students.search=event.target.value;render();const input=document.querySelector('[name="rosterSearch"]');input.focus();input.setSelectionRange(position,position);
  }
  if(['qrBaseUrl','qrBinId'].includes(event.target.name)){
    ctx.qr[event.target.name==='qrBaseUrl'?'base':'binId']=event.target.value;ctx.qr.result=null;
    const output=document.querySelector('.qr-output');if(output)output.innerHTML=qrOutput(ctx.qr);
  }
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
    if(form.id==='class-add-form'){r.addClass(data.className);ctx.students.preview=null;render();toast('Đã thêm lớp.');}
    if(form.classList.contains('class-rename-form')){
      const oldId=form.dataset.classId,newId=r.renameClass(oldId,data.className);if(ctx.students.classId===oldId)ctx.students.classId=newId;
      ctx.students.preview=null;ctx.registration.student=null;render();toast('Đã đổi tên lớp và cập nhật dữ liệu liên quan.');
    }
    if(form.id==='student-import-form'){
      ctx.students.preview=null;
      const file=fields.get('studentFile');if(!file?.size)throw Error('Vui lòng chọn file danh sách học sinh.');
      if(!/\.(xlsx|xls)$/i.test(file.name))throw Error('Chọn file Excel .xlsx hoặc .xls.');
      if(file.size>10*1024*1024)throw Error('File Excel tối đa 10 MB.');
      const excel=await import('./student-excel.js');const rows=excel.parseStudentWorkbook(await file.arrayBuffer());
      ctx.students.preview={...r.previewStudents(rows),filename:file.name};render();
      document.querySelector('.import-preview')?.scrollIntoView({block:'start',behavior:'instant'});
    }
    if(form.id==='student-verify-form'){
      const student=r.verifyStudent(data.studentCode,data.name);ctx.registration={student,code:data.studentCode,name:data.name};render();
      document.querySelector('[name="email"]')?.focus({preventScroll:true});
    }
    if(form.id==='qr-form'){
      const base=data.qrBaseUrl,binId=data.qrBinId;
      const result=await generateBinQR(base,binId);
      if(ctx.qr.base!==base||ctx.qr.binId!==binId)throw Error('Thông tin đã thay đổi. Hãy bấm tạo mã QR lại.');
      ctx.qr.result=result;
      const output=document.querySelector('.qr-output');if(output)output.innerHTML=qrOutput(ctx.qr);
      toast('Đã tạo mã QR cho thùng '+result.binId+'.');
    }
    if(form.id==='auth-form'){
      if(form.dataset.mode==='register'){
        if(data.password!==data.confirm)throw Error('Mật khẩu xác nhận không khớp.');
        await r.register(data);ctx.registration={student:null,code:'',name:''};location.hash='#/home';
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
