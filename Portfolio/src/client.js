import {searchProjects,validateContact,saveDraft,loadDraft} from './repository.js';
import {projectCard} from './render.js';
import {icon} from './icons.js';
const themeButton=document.querySelector('#theme-toggle');
function updateTheme(){const dark=document.documentElement.dataset.theme==='dark';themeButton.setAttribute('aria-pressed',String(dark));themeButton.setAttribute('aria-label',dark?'Chuyển sang giao diện sáng':'Chuyển sang giao diện tối');themeButton.innerHTML=icon(dark?'sun':'moon');}
updateTheme();
themeButton.addEventListener('click',()=>{const value=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=value;try{localStorage.setItem('portfolio.theme.v1',value);}catch{} updateTheme();});
const menuButton=document.querySelector('#menu-toggle');
const nav=document.querySelector('#main-nav');
function closeMenu(){nav.classList.remove('is-open');menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Mở menu');}
menuButton.addEventListener('click',()=>{const opened=nav.classList.toggle('is-open');menuButton.setAttribute('aria-expanded',String(opened));menuButton.setAttribute('aria-label',opened?'Đóng menu':'Mở menu');});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('is-open')){closeMenu();menuButton.focus();}});
document.addEventListener('click',e=>{if(!nav.contains(e.target)&&!menuButton.contains(e.target))closeMenu();});
window.matchMedia('(min-width:761px)').addEventListener('change',e=>{if(e.matches)closeMenu();});

const search=document.querySelector('#project-search');
if(search){let category='all';const buttons=[...document.querySelectorAll('[data-filter]')];function update(){const results=searchProjects({query:search.value,category});document.querySelector('#project-results').innerHTML=results.map(p=>projectCard(p)).join('');document.querySelector('#result-count').textContent=`${results.length} dự án`;document.querySelector('#project-empty').hidden=results.length>0;buttons.forEach(b=>{const active=b.dataset.filter===category;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});bindImageErrors();}search.addEventListener('input',update);buttons.forEach(b=>b.addEventListener('click',()=>{category=b.dataset.filter;update();}));document.querySelector('#reset-search').addEventListener('click',()=>{category='all';search.value='';update();search.focus();});}

const form=document.querySelector('#contact-form');
if(form){
 const status=document.querySelector('#form-status');const summary=document.querySelector('#form-summary');
 let storage=null;try{storage=window.localStorage;}catch{}
 const draft=loadDraft(storage);
 if(draft){for(const key of ['name','contact','service','budget','deadline','message']){const el=form.elements.namedItem(key);if(el&&typeof draft[key]==='string')el.value=draft[key];}status.textContent='Đã khôi phục bản nháp trên trình duyệt này. Bản nháp chưa được gửi.';}
 const data=()=>Object.fromEntries(new FormData(form));
 function valid(){const errors=validateContact(data());for(const key of ['name','contact','service','message']){const el=form.elements.namedItem(key);el.setAttribute('aria-invalid',String(Boolean(errors[key])));document.getElementById(`${key}-error`).textContent=errors[key]??'';}const keys=Object.keys(errors);summary.hidden=keys.length===0;if(keys.length){summary.textContent=`Cần kiểm tra ${keys.length} thông tin trước khi lưu bản nháp.`;status.textContent='';form.elements.namedItem(keys[0]).focus();return false;}return true;}
 form.addEventListener('submit',e=>{e.preventDefault();if(!valid())return;const result=saveDraft(data(),storage);status.textContent=result.saved?'Đã lưu bản nháp trên trình duyệt này. Yêu cầu chưa được gửi đến nhóm.':'Trình duyệt không cho phép lưu bản nháp. Bạn có thể tải yêu cầu .txt để giữ nội dung.';});
 document.querySelector('#download-brief').addEventListener('click',()=>{if(!valid())return;const d=data();const text=`YÊU CẦU DỰ ÁN — CHƯA GỬI\n\nTên: ${d.name}\nLiên hệ: ${d.contact}\nDịch vụ: ${d.service}\nNgân sách: ${d.budget||'Chưa xác định'}\nThời hạn: ${d.deadline||'Chưa xác định'}\n\nMô tả:\n${d.message}\n`;const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='yeu-cau-du-an.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent='Đã tải yêu cầu để bạn lưu hoặc gửi qua kênh liên hệ. Website chưa gửi thông tin này.';});
 // Only enable local actions after their handlers are installed.
 form.querySelector('button[type="submit"]').disabled=false;
 document.querySelector('#download-brief').disabled=false;
}
function bindImageErrors(){document.querySelectorAll('img').forEach(img=>{if(img.dataset.errorBound)return;img.dataset.errorBound='1';const show=()=>{const fallback=document.createElement('div');fallback.className='media-error';fallback.textContent='Ảnh chưa tải được. Vui lòng tải lại trang.';fallback.setAttribute('role','img');fallback.setAttribute('aria-label',img.alt);img.replaceWith(fallback);};img.addEventListener('error',show,{once:true});if(img.complete&&img.naturalWidth===0)show();});}
bindImageErrors();
