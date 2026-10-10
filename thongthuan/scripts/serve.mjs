import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.ico':'image/x-icon','.woff2':'font/woff2'};
http.createServer(async(req,res)=>{try{
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end()}
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const target=path.resolve(root,'.'+pathname);
 if(!target.startsWith(root+path.sep)&&target!==root||pathname.split('/').some(s=>s.startsWith('.'))){res.writeHead(404);return res.end()}
 let file=target;try{if(!(await stat(file)).isFile())throw Error()}catch{if(path.extname(pathname)||pathname.startsWith('/assets/')){res.writeHead(404);return res.end()}file=path.join(root,'index.html')}
 const data=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:data);
 }catch{res.writeHead(400);res.end()}
}).listen(4180,'127.0.0.1',()=>console.log('CEC preview http://127.0.0.1:4180'));
