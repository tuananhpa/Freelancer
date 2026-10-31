// Liệt kê toàn bộ endpoint của backend Java (chỉ đọc) -> docs/ENDPOINTS.md
//   node tools/list-endpoints.mjs [thư-mục-java]
import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, basename, relative } from 'node:path';

const ROOT = process.argv[2] || '../URANUS-BackEnd-main/URANUS-BackEnd-main/src/main/java';
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : p.endsWith('Controller.java') ? [p] : []; });
const pathOf = (args) => { const m = (args || '').match(/(?:value\s*=\s*|path\s*=\s*)?\{?\s*"([^"]*)"/); return m ? m[1] : ''; };

const rows = [];
for (const f of walk(ROOT)) {
  const s = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  const base = pathOf(s.match(/@RequestMapping\s*\(([^)]*)\)/)?.[1]);
  const classAuth = s.slice(0, s.search(/\bclass\b/)).match(/@PreAuthorize\s*\(\s*"([^"]+)"/)?.[1];
  // Mỗi @XxxMapping: đọc tham số bằng ngoặc cân bằng, @PreAuthorize ngay phía trên, tên method phía dưới
  const mre = /@(Get|Post|Put|Patch|Delete)Mapping\b/g;
  let m, prevEnd = 0;
  while ((m = mre.exec(s))) {
    let args = '', j = m.index + m[0].length;
    while (s[j] === ' ') j++;
    if (s[j] === '(') { let d = 0, k = j, inStr = false; for (; k < s.length; k++) { if (s[k] === '"' && s[k - 1] !== '\\') inStr = !inStr; if (inStr) continue; if (s[k] === '(') d++; else if (s[k] === ')' && --d === 0) break; } args = s.slice(j + 1, k); }
    const before = s.slice(Math.max(prevEnd, s.lastIndexOf(';', m.index), s.lastIndexOf('}', m.index)), m.index);
    const after = s.slice(m.index);
    const name = after.match(/public\s+[^(]*?\s(\w+)\s*\(/)?.[1] || '?';
    const auth = (before + after.slice(0, after.search(/public\s/))).match(/@PreAuthorize\s*\(\s*"([^"]+)"/)?.[1] || classAuth || '';
    rows.push({ method: m[1].toUpperCase(), path: (base + pathOf(args)).replace(/\/+/g, '/') || '/', handler: `${basename(f, '.java')}.${name}`, auth, file: relative(ROOT, f).replace(/\\/g, '/') });
    prevEnd = m.index;
  }
}
rows.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));
const md = [
  '# Danh sách endpoint của backend Java gốc',
  '',
  `Sinh tự động bằng \`node tools/list-endpoints.mjs\` từ ${new Set(rows.map((r) => r.file)).size} controller — **${rows.length} endpoint**. Backend Cloudflare phải trả đúng các path này (frontend gọi \`/api/...\`).`,
  'Cột "Quyền" là `@PreAuthorize` trong Java (trống = chỉ cần đăng nhập, hoặc công khai nếu SecurityConfig cho phép — xem PLAN.md §5).',
  '',
  '| Method | Path | Quyền | Handler Java |',
  '|---|---|---|---|',
  ...rows.map((r) => `| ${r.method} | \`${r.path}\` | ${r.auth.replace(/\|/g, '\\|')} | \`${r.handler}\` |`),
  '',
];
mkdirSync('docs', { recursive: true });
writeFileSync('docs/ENDPOINTS.md', md.join('\n'));
console.log(`${rows.length} endpoint -> docs/ENDPOINTS.md`);
