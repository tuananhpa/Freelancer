import {loadDocument} from './admin-model.js';
import {renderPage} from './render.js';
import {escape} from './utils.js';
export function rewritePreviewLinks(){if(location.pathname!=='/xem-thu/')return;document.querySelectorAll('a[href]').forEach(a=>{if(a.hasAttribute('data-exit-preview')||a.target==='_blank'||a.getAttribute('href').startsWith('#'))return;const u=new URL(a.href,location.origin);const portfolioRoute=['/','/du-an/','/dich-vu/','/ve-nhom/','/lien-he/'].includes(u.pathname)||/^\/du-an\/[a-z0-9-]+\/$/.test(u.pathname);if(u.origin!==location.origin||!portfolioRoute)return;a.href=`/xem-thu/?path=${encodeURIComponent(u.pathname)}${u.hash}`;});}
export function preparePreview(){
 if(location.pathname!=='/xem-thu/')return null;
 let storage=null;try{storage=localStorage;}catch{}
 const {document:doc,recovered}=window.__SERVER_MODE__?{document:window.__PORTFOLIO_DATA__,recovered:false}:loadDocument(storage);
 const path=new URLSearchParams(location.search).get('path')||'/';
 const parsed=new DOMParser().parseFromString(renderPage(path,'',doc,Boolean(window.__SERVER_MODE__)),'text/html');
 document.body.innerHTML=parsed.body.innerHTML;
 document.title=`${window.__SERVER_MODE__?'Xem bản nháp':'Xem thử cục bộ'} — ${parsed.title}`;
 let robots=document.querySelector('meta[name="robots"]');if(!robots){robots=document.createElement('meta');robots.name='robots';document.head.append(robots);}robots.content='noindex,nofollow';
 const banner=document.createElement('div');banner.className='local-preview-bar';banner.innerHTML=`<span><strong>${window.__SERVER_MODE__?'Xem bản nháp trên server':'Xem thử trên thiết bị này'}</strong> · ${recovered?'Không đọc được cấu hình đã lưu; đang dùng bản ban đầu.':'Chỉnh sửa chưa được công khai.'}</span><a href="/admin/" data-exit-preview>Về admin</a><a href="/" data-exit-preview>${window.__SERVER_MODE__?'Xem website công khai':'Xem bản gốc'}</a>`;
 document.querySelector('.site-header').after(banner);
 rewritePreviewLinks();return doc;
}
