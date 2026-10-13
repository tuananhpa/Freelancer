import {mkdir,writeFile,cp,rm,lstat} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {renderPage,escape} from '../src/render.js';
import {site,services,process,faqs} from '../src/data.js';
import {getPublicProjects} from '../src/repository.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const out=resolve(root,'dist');
if(out!==join(resolve(root),'dist'))throw new Error('Output must stay within project dist.');
try {if((await lstat(out)).isSymbolicLink())throw new Error('Refusing to replace symlink output.');await rm(out,{recursive:true,force:true});}catch(e){if(e.code!=='ENOENT')throw e;}
await mkdir(out,{recursive:true});
await cp(join(root,'public'),out,{recursive:true});
await cp(join(root,'src'),join(out,'src'),{recursive:true});
const publicProjects=getPublicProjects();
// Browser fixtures are generated from public records, not copied from raw project data.
await writeFile(join(out,'src','data.js'),`export const site=${JSON.stringify(site)};\nexport const projects=${JSON.stringify(publicProjects)};\nexport const services=${JSON.stringify(services)};\nexport const process=${JSON.stringify(process)};\nexport const faqs=${JSON.stringify(faqs)};\n`);
const routes=['/','/du-an/','/dich-vu/','/ve-nhom/','/lien-he/',...publicProjects.map(p=>`/du-an/${p.slug}/`)];
let origin='';if(processEnv('SITE_URL')){const url=new URL(processEnv('SITE_URL'));if(!['https:','http:'].includes(url.protocol))throw Error('SITE_URL must be an HTTP(S) URL');origin=url.origin;}
for(const route of routes){const dir=join(out,route.slice(1));await mkdir(dir,{recursive:true});await writeFile(join(dir,'index.html'),renderPage(route,origin));}
await writeFile(join(out,'404.html'),renderPage('/404/',origin));
await writeFile(join(out,'robots.txt'),`User-agent: *\nAllow: /\n${origin?`Sitemap: ${origin}/sitemap.xml\n`:''}`);
if(origin){await writeFile(join(out,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(r=>`<url><loc>${escape(origin+r)}</loc></url>`).join('')}</urlset>`);}
console.log(`Built ${routes.length} HTML pages + 404 into ${out}`);
console.log(origin?`Canonical/sitemap origin: ${origin}`:'Local preview build. Set SITE_URL to generate production canonical links and sitemap.');
function processEnv(key){return globalThis.process.env[key];}
