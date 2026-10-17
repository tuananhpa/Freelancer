import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import * as pages from '../src/pages.js';
import { products, articles } from '../src/data.js';

const template = readFileSync('dist/index.html', 'utf8');
const routes = [
  ['/', 'Giải pháp vật liệu cho sản xuất điện tử', () => pages.home()],
  ['/gioi-thieu', 'Giới thiệu', () => pages.about()],
  ['/san-pham', 'Sản phẩm', () => pages.catalog(new URL('https://tensan.example/san-pham'))],
  ['/ung-dung', 'Ứng dụng', () => pages.applicationPage()],
  ['/tin-tuc', 'Kiến thức & tin tức', () => pages.news()],
  ['/lien-he', 'Liên hệ', () => pages.contact(new URL('https://tensan.example/lien-he'))],
  ['/tuyen-dung', 'Tuyển dụng', () => pages.recruitment()],
  ...products.map(p => ['/san-pham/' + p.id, p.name, () => pages.productDetail(p.id)]),
  ...articles.map(a => ['/tin-tuc/' + a.id, a.title, () => pages.article(a.id)]),
];
for (const [path, title, render] of routes) {
  const directory = join('dist', path.slice(1));
  mkdirSync(directory, { recursive: true });
  const content = template.replace('<div id="app"></div>', `<div id="app">${pages.shell(render(), path)}</div>`)
    .replace(/<title>.*?<\/title>/, `<title>${pages.escapeHtml(title)} — TENSAN Việt Nam</title>`)
    .replace('</head>', `<link rel="canonical" href="${path}"><meta property="og:title" content="${pages.escapeHtml(title)} — TENSAN Việt Nam"><meta property="og:type" content="website"></head>`);
  if (!content.includes('<h1')) throw new Error('Missing rendered page: ' + path);
  writeFileSync(join(directory, 'index.html'), content);
}
writeFileSync('dist/404.html', template.replace('<div id="app"></div>', `<div id="app">${pages.shell(pages.notFound(), '/404')}</div>`).replace('</head>', '<meta name="robots" content="noindex"></head>'));
console.log(`Prerendered ${routes.length} pages with real content for direct links and search engines.`);
