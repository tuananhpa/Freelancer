import {api} from './api.js';
import {ApiError,authenticate,session} from './security.js';
import {readContent} from './content.js';
import {renderPage} from '../src/render.js';
import {renderAdminPage} from '../src/admin-render.js';
function page(html,doc=null,status=200,extra={}){const nonce=crypto.randomUUID().replaceAll('-','');const state=`<script>window.__SERVER_MODE__=true;window.__PORTFOLIO_DATA__=${doc?JSON.stringify(doc).replace(/</g,'\\u003c'): 'null'};</script>`;html=html.replace('<script',state+'<script').replaceAll('<script',`<script nonce="${nonce}"`);return new Response(html,{status,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Content-Security-Policy':`default-src 'self'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' https: http: data:; media-src 'self' https: http:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'`,...extra}});}
const references=(doc,path,origin)=>{const visit=value=>typeof value==='string'?(()=>{try{const u=new URL(value,origin);return u.origin===origin&&u.pathname===path;}catch{return false;}})():Array.isArray(value)?value.some(visit):value&&typeof value==='object'?Object.values(value).some(visit):false;return visit(doc);};
export default {async scheduled(controller,env,ctx){const now=Date.now();await env.DB.batch([env.DB.prepare('DELETE FROM sessions WHERE expires_at<?').bind(now),env.DB.prepare('DELETE FROM contact_tokens WHERE expires_at<?').bind(now),env.DB.prepare('DELETE FROM rate_limits WHERE expires_at<?').bind(now)]);},async fetch(request,env,ctx){const url=new URL(request.url);try{
 if(url.protocol==='http:'&&!['127.0.0.1','localhost'].includes(url.hostname)){url.protocol='https:';return Response.redirect(url.href,308);}
 if(url.pathname.startsWith('/api/'))return await api(request,env);
 if(/^\/media\/[a-f0-9-]{36}$/.test(url.pathname)){if(!['GET','HEAD'].includes(request.method))throw new ApiError(405,'Phương thức không hợp lệ.');const content=await readContent(env),isPublic=references(JSON.parse(content.published),url.pathname,url.origin);if(!isPublic&&!(await session(request,env)))throw new ApiError(404,'Không tìm thấy ảnh.');const row=await env.DB.prepare('SELECT mime,bytes FROM media WHERE id=?').bind(url.pathname.split('/').at(-1)).first();if(!row)throw new ApiError(404,'Không tìm thấy ảnh.');return new Response(request.method==='HEAD'?null:new Uint8Array(row.bytes),{headers:{'Content-Type':row.mime,'X-Content-Type-Options':'nosniff','Cache-Control':'no-store'}});}
 if(!['GET','HEAD'].includes(request.method))throw new ApiError(405,'Phương thức không hợp lệ.');
 if(url.pathname.startsWith('/assets/')||url.pathname.startsWith('/src/'))return env.ASSETS.fetch(request);
 if(url.pathname==='/admin'||url.pathname==='/xem-thu')return Response.redirect(url.origin+url.pathname+'/',308);
 if(url.pathname==='/admin/')return page(renderAdminPage());
 const content=await readContent(env);
 if(url.pathname==='/xem-thu/'){try{await authenticate(request,env);}catch{return Response.redirect(url.origin+'/admin/',303);}return page(renderPage(url.searchParams.get('path')||'/',url.origin,JSON.parse(content.draft),true),JSON.parse(content.draft),200,{'X-Robots-Tag':'noindex'});}
 const doc=JSON.parse(content.published);const routes=['/','/du-an/','/dich-vu/','/ve-nhom/','/lien-he/',...doc.projects.map(p=>`/du-an/${p.slug}/`)];
 if(url.pathname==='/robots.txt')return new Response(`User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /xem-thu/\nSitemap: ${url.origin}/sitemap.xml\n`,{headers:{'Content-Type':'text/plain'}});
 if(url.pathname==='/sitemap.xml')return new Response(`<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(r=>`<url><loc>${url.origin}${r}</loc></url>`).join('')}</urlset>`,{headers:{'Content-Type':'application/xml'}});
 if(!url.pathname.endsWith('/')&&routes.includes(url.pathname+'/'))return Response.redirect(url.origin+url.pathname+'/',308);
 return page(renderPage(url.pathname,url.origin,doc,true),doc,routes.includes(url.pathname)?200:404);
 }catch(e){if(!(e instanceof ApiError))console.error('Worker request failed',e.name);return Response.json({error:e instanceof ApiError?e.message:'Máy chủ gặp lỗi. Vui lòng thử lại.'},{status:e.status??500,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}}};
