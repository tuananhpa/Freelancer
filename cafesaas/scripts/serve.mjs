import {createServer} from 'node:http';
import {createReadStream} from 'node:fs';
import {stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join,extname} from 'node:path';
import {resolvePublicPath} from './static-path.mjs';
const root=fileURLToPath(new URL('../apps/web/dist/',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json','.woff':'font/woff','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','SAMEORIGIN');
 res.setHeader('Content-Security-Policy',"default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; connect-src 'self'; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'");
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return}
 if(req.url==='/_health'){res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(req.method==='HEAD'?'':JSON.stringify({status:'ok',mode:'browser-local-preview'}));return}
 const target=resolvePublicPath(req.url??'/');if(!target){res.writeHead(404);res.end('Not found');return}
 const file=join(root,target);try{const info=await stat(file);if(!info.isFile())throw new Error('Not a file');res.setHeader('Content-Type',types[extname(file)]??'application/octet-stream');res.setHeader('Content-Length',info.size);res.setHeader('Cache-Control',target.startsWith('assets/')?'public, max-age=31536000, immutable':'no-store');if(req.method==='HEAD'){res.end();return}createReadStream(file).on('error',()=>res.destroy()).pipe(res)}catch{res.writeHead(404);res.end('Not found')}
});
const port=Number(process.env.PORT??4177);server.listen(port,'127.0.0.1',()=>console.log('Coffee POS build running at http://127.0.0.1:'+port));
process.on('SIGTERM',()=>server.close());
