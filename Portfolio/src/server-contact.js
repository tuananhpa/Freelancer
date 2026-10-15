import {icon} from './icons.js';
export function serverContact(form){
 let nonce='',issued=0,ready;
 const submit=form.querySelector('button[type="submit"]');submit.innerHTML=`Gửi yêu cầu ${icon('arrow')}`;
 const note=document.querySelector('.contact-info .local-notice p');if(note)note.innerHTML='<strong>Gửi yêu cầu đến nhóm.</strong><br>Thông tin được lưu trong hệ thống quản trị, chỉ người có quyền mới xem được.';
 document.querySelector('.form-footnote').textContent='Chỉ cung cấp thông tin cần để trao đổi dự án. Không nhập mật khẩu hoặc thông tin bí mật.';
 const trap=document.createElement('input');trap.type='text';trap.name='website';trap.tabIndex=-1;trap.autocomplete='off';trap.className='contact-honeypot';trap.setAttribute('aria-hidden','true');form.append(trap);
 async function refresh(){try{const r=await fetch('/api/contact-token');const data=await r.json();if(!r.ok)throw Error(data.error);nonce=data.token;issued=Date.now();return true;}catch{nonce='';return false;}}
 ready=refresh();
 return {async send(data){const enabled=[...form.querySelectorAll('button,input,select,textarea')].filter(el=>!el.disabled);enabled.forEach(el=>el.disabled=true);submit.disabled=true;document.querySelector('#form-status').textContent='Đang gửi yêu cầu…';try{await ready;if(!nonce&&!(await refresh()))throw Error('Không tạo được phiên gửi. Vui lòng thử lại sau.');const wait=Math.max(0,1300-(Date.now()-issued));if(wait)await new Promise(resolve=>setTimeout(resolve,wait));const response=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...data,token:nonce})});const result=await response.json();if(!response.ok)throw Error(result.error);form.reset();return result;}finally{ready=refresh();enabled.forEach(el=>el.disabled=false);submit.disabled=false;}}};
}
