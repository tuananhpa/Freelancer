import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,join,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
await import('./build.mjs');
const root=fileURLToPath(new URL('../dist/',import.meta.url));
const port=Number(process.env.PORT||5173);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.xml':'application/xml','.txt':'text/plain; charset=utf-8'};
const server=http.createServer(async(req,res)=>{
 try{if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});res.end();return;}
 const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let target=resolve(root,'.'+path);
 if(target!==resolve(root)&&!target.startsWith(resolve(root)+sep)){res.writeHead(403);res.end('Forbidden');return;}
 let status=200;try{if((await stat(target)).isDirectory())target=join(target,'index.html');await stat(target);}catch{target=join(root,'404.html');status=404;}
 const body=await readFile(target);res.writeHead(status,{'Content-Type':mime[extname(target)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:body);
 }catch{res.writeHead(400);res.end('Bad request');}
});
server.listen(port,'127.0.0.1',()=>console.log(`Portfolio preview: http://127.0.0.1:${port}`));
