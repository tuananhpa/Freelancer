import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.webp':'image/webp','.ico':'image/x-icon','.woff2':'font/woff2'};
export function createStaticServer(root) {
  const base=resolve(root);
  return createServer(async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('X-Robots-Tag','noindex, nofollow');
    res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
    const fail=code=>{res.writeHead(code,{'Content-Type':'text/plain; charset=utf-8'});res.end(req.method==='HEAD'?'':String(code));};
    if(!['GET','HEAD'].includes(req.method)){res.setHeader('Allow','GET, HEAD');return fail(405);}
    let path;
    try{path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{return fail(400);}
    if(path.includes('\\')||path.includes('\0')||path.split('/').some(s=>s.startsWith('.')))return fail(403);
    const candidate=resolve(base,`.${path}`);
    if(candidate!==base&&!candidate.startsWith(base+sep))return fail(403);
    const extension=extname(path);
    if(extension&&!types[extension])return fail(404);
    const file=extension?candidate:resolve(base,'index.html');
    try{
      const bytes=await readFile(file);
      res.writeHead(200,{'Content-Type':types[extension||'.html'],'Content-Length':bytes.length,'Cache-Control':extension&&path.startsWith('/assets/')?'public, max-age=31536000, immutable':'no-cache'});
      res.end(req.method==='HEAD'?undefined:bytes);
    }catch(error){if(['ENOENT','EISDIR','ENOTDIR'].includes(error.code))return fail(404);console.error('Preview file read failed:',error.code);fail(500);}
  });
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const root=fileURLToPath(new URL('../dist/',import.meta.url));
  const port=Number(process.env.PORT||5173);
  const server=createStaticServer(root);
  server.on('error',error=>{console.error(error.message);process.exitCode=1;});
  server.listen(port,'127.0.0.1',()=>console.log(`Vĩnh Thuận Phát preview: http://127.0.0.1:${port}`));
}
