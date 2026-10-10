export function validateRequest(customer,selection,products){
 const e={}; const name=String(customer.name||'').trim(),phone=String(customer.phone||'').replace(/[\s()+.-]/g,''),email=String(customer.email||'').trim();
 if(name.length<2||name.length>120)e.name='name';
 if(!/^\d{8,15}$/.test(phone))e.phone='phone';
 if(email&&(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254))e.email='email';
 if(String(customer.message||'').length>4000)e.message='message';
 if(!selection.length)e.items='empty';
 for(const item of selection){const p=products.find(p=>p.id===item.productId);if(!p||!p.published){e.items='unavailable';break}if(!Number.isInteger(Number(item.quantity))||Number(item.quantity)<1||Number(item.quantity)>1000000){e.items='quantity';break}}
 return e;
}
export function buildRequest(customer,selection,products){
 const errors=validateRequest(customer,selection,products);if(Object.keys(errors).length)throw new Error('Invalid request');
 return {id:crypto.randomUUID(),code:'YC-'+Date.now().toString(36).toUpperCase(),createdAt:new Date().toISOString(),status:'new',notes:'',customer:{name:String(customer.name).trim(),company:String(customer.company||'').trim(),phone:String(customer.phone).trim(),email:String(customer.email||'').trim(),message:String(customer.message||'').trim()},items:selection.map(item=>{const p=products.find(p=>p.id===item.productId);return {productId:p.id,name:structuredClone(p.name),unit:p.unit,image:p.image,quantity:Number(item.quantity)}})};
}
const hosts={facebook:['facebook.com','www.facebook.com','m.facebook.com'],tiktok:['tiktok.com','www.tiktok.com'],youtube:['youtube.com','www.youtube.com','youtu.be'],instagram:['instagram.com','www.instagram.com'],linkedin:['linkedin.com','www.linkedin.com']};
export function safeUrl(value,kind='link'){
 if(typeof value!=='string'||!value.trim())return '';
 const v=value.trim();if(kind==='image'&&(/^\/assets\/[\w./-]+$/.test(v)||/^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(v)))return v;
 try{const u=new URL(v);if(u.protocol!=='https:'||u.username||u.password)return '';if(kind==='map')return ['www.google.com','maps.google.com'].includes(u.hostname)&&u.pathname==='/maps/embed'?u.href:'';if(hosts[kind])return hosts[kind].includes(u.hostname)?u.href:'';return u.href;}catch{return ''}
}
export function mapLinks(f){const q=encodeURIComponent(f.name+', '+f.address);return {search:'https://www.google.com/maps/search/?api=1&query='+q,directions:'https://www.google.com/maps/dir/?api=1&destination='+q,embed:safeUrl(f.mapUrl,'map')||'https://maps.google.com/maps?q='+q+'&output=embed'};}
export function youtubeId(url){try{const u=new URL(url);const id=u.hostname==='youtu.be'?u.pathname.slice(1):u.searchParams.get('v')||u.pathname.split('/').filter(Boolean).at(-1);return /^[\w-]{11}$/.test(id||'')?id:''}catch{return ''}}
export function tiktokId(url){return url.match(/\/video\/(\d{6,30})(?:[/?#]|$)/)?.[1]||'';}
export function validateWidget(w){if(!hosts[w.platform])return 'platform';if(!safeUrl(w.url,w.platform))return 'url';if(w.mode==='embed'&&((w.platform==='tiktok'&&!tiktokId(w.url))||(w.platform==='youtube'&&!youtubeId(w.url))||!['facebook','tiktok','youtube'].includes(w.platform)))return 'embed';return '';}
export function widgetEmbed(w){if(validateWidget(w)||w.mode!=='embed')return '';if(w.platform==='facebook')return 'https://www.facebook.com/plugins/page.php?href='+encodeURIComponent(w.url)+'&tabs=timeline&width=500&height=500&small_header=true&adapt_container_width=true';if(w.platform==='tiktok')return 'https://www.tiktok.com/player/v1/'+tiktokId(w.url);if(w.platform==='youtube')return 'https://www.youtube-nocookie.com/embed/'+youtubeId(w.url);return '';}
export function csvCell(value){const s=String(value??'');const protectedValue=/^[=+@\-\t\r]/.test(s)?"'"+s:s;return '"'+protectedValue.replaceAll('"','""')+'"';}

