const spa=/^\/(?:pos|tables|orders|kitchen|waiter|login|platform|admin(?:\/[a-z-]+)?|order\/[a-zA-Z0-9-]+|receipt\/[a-zA-Z0-9-]+)\/?$/;
export function resolvePublicPath(raw){
 let path;try{path=decodeURIComponent(raw.split('?')[0])}catch{return null}
 if(path.includes('..')||path.includes('\\')||path.includes('\0')||path.split('/').some(segment=>segment.startsWith('.')))return null;
 if(path==='/'||path==='/index.html'||spa.test(path))return 'index.html';
 if(/^\/assets\/[a-zA-Z0-9_.-]+\.(?:js|css|woff|woff2|png|svg)$/.test(path))return path.slice(1);
 if(/^\/(?:drinks\.png|icon\.svg|manifest\.webmanifest|registerSW\.js|sw\.js|workbox-[a-zA-Z0-9-]+\.js)$/.test(path))return path.slice(1);
 return null;
}
