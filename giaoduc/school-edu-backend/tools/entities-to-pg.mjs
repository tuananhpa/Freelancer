// Đọc các class @Entity của backend Java (chỉ đọc) và sinh DDL Postgres giống Hibernate ddl-auto.
// Bảng gốc của Uranus do Hibernate tạo (migration V1.1 trống), nên phải lấy từ entity rồi mới áp migration.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';

const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : p.endsWith('.java') ? [p] : []; });
const snake = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/([A-Z])([A-Z][a-z])/g, '$1_$2').toLowerCase();

/** Lấy nội dung trong ngoặc cân bằng bắt đầu tại vị trí `i` (ký tự mở) */
function balanced(s, i, open = '(', close = ')') {
  let depth = 0, j = i, inStr = false;
  for (; j < s.length; j++) {
    const ch = s[j];
    if (ch === '"' && s[j - 1] !== '\\') inStr = !inStr;
    if (inStr) continue;
    if (ch === open) depth++;
    else if (ch === close && --depth === 0) return [s.slice(i + 1, j), j + 1];
  }
  throw new Error('ngoặc không cân bằng');
}
const attr = (args, key) => { const m = (args || '').match(new RegExp(`\\b${key}\\s*=\\s*("(?:[^"\\\\]|\\\\.)*"|[\\w.]+)`)); return m ? m[1].replace(/^"|"$/g, '') : undefined; };

export function parseEntities(javaRoot) {
  const files = walk(javaRoot);
  const src = Object.fromEntries(files.map((f) => [basename(f, '.java'), readFileSync(f, 'utf8')]));
  const enums = new Set(Object.entries(src).filter(([, s]) => /\benum\s+\w+/.test(s)).map(([n]) => n));
  // enum lồng trong class (vd. User.Role)
  for (const s of Object.values(src)) for (const m of s.matchAll(/\benum\s+(\w+)/g)) enums.add(m[1]);
  const entities = {};
  for (const [name, raw] of Object.entries(src)) {
    if (!/@Entity\b/.test(raw) || !/\bclass\s+\w+/.test(raw)) continue;
    const s = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
    const tableAnn = s.match(/@Table\s*\(/);
    let table = snake(name), tableArgs = '';
    if (tableAnn) { [tableArgs] = balanced(s, tableAnn.index + tableAnn[0].length - 1); table = attr(tableArgs, 'name') || table; }
    const clsIdx = s.search(new RegExp(`class\\s+${name}\\b`));
    const bodyStart = s.indexOf('{', clsIdx);
    const [body] = balanced(s, bodyStart, '{', '}');
    // Duyệt thân class: gom annotation, gặp khai báo field thì ghi nhận, gặp method/khối thì bỏ qua
    const fields = [];
    let i = 0, anns = [];
    while (i < body.length) {
      const rest = body.slice(i);
      const ws = rest.match(/^\s+/); if (ws) { i += ws[0].length; continue; }
      if (rest[0] === '@') {
        const m = rest.match(/^@([\w.]+)\s*/);
        let args = null, len = m[0].length;
        if (rest[len] === '(') { const [a, end] = balanced(rest, len); args = a; len = end; }
        anns.push({ name: m[1].split('.').pop(), args }); i += len; continue;
      }
      if (rest[0] === '{' ) { const [, end] = balanced(rest, 0, '{', '}'); i += end; anns = []; continue; }
      // khai báo đến ; hoặc {  (method / class lồng)
      const semi = rest.indexOf(';'), brace = rest.indexOf('{');
      if (brace >= 0 && (semi < 0 || brace < semi)) {
        const [, end] = balanced(rest, brace, '{', '}'); i += end; anns = []; continue;
      }
      const decl = rest.slice(0, semi).replace(/\s+/g, ' ').trim();
      i += semi + 1;
      const fm = decl.match(/^(?:(?:private|protected|public|final|transient)\s+)*([\w.<>,?\[\] ]+?)\s+(\w+)(?:\s*=.*)?$/);
      if (fm && !/\bstatic\b/.test(decl)) fields.push({ type: fm[1].replace(/\s+/g, ''), name: fm[2], anns });
      anns = [];
    }
    entities[name] = { name, table, tableArgs, fields };
  }
  return { entities, enums };
}

const pgType = (f, col, enums) => {
  const def = attr(col?.args, 'columnDefinition');
  if (def) return def.replace(/\s+DEFAULT\s+.*$/i, '');
  const t = f.type.replace(/^java\.\w+\./, '');
  const len = attr(col?.args, 'length');
  if (f.anns.some((a) => a.name === 'JdbcTypeCode')) return 'jsonb';
  if (f.anns.some((a) => a.name === 'Lob')) return t === 'byte[]' ? 'bytea' : 'text';
  const enumAnn = f.anns.find((a) => a.name === 'Enumerated');
  const base = t.split('.').pop();
  if (enumAnn || enums.has(base)) return enumAnn && /ORDINAL/.test(enumAnn.args || '') ? 'smallint' : `varchar(${len || 255})`;
  switch (base) {
    case 'UUID': return 'uuid';
    case 'String': return `varchar(${len || 255})`;
    case 'Integer': case 'int': return 'integer';
    case 'Long': case 'long': return 'bigint';
    case 'Short': case 'short': return 'smallint';
    case 'Double': case 'double': return 'float8';
    case 'Float': case 'float': return 'float4';
    case 'Boolean': case 'boolean': return 'boolean';
    case 'BigDecimal': return `numeric(${attr(col?.args, 'precision') || 38},${attr(col?.args, 'scale') || 2})`;
    case 'LocalDateTime': case 'Instant': case 'OffsetDateTime': case 'ZonedDateTime': case 'Date': case 'Timestamp': return 'timestamp(6)';
    case 'LocalDate': return 'date';
    case 'LocalTime': return 'time(6)';
    case 'byte[]': return 'bytea';
    default: return `varchar(255) /* ${t} */`;
  }
};

export function entitiesToPg(javaRoot) {
  const { entities, enums } = parseEntities(javaRoot);
  const byName = entities;
  const creates = [], fks = [], extras = [];
  const columns = {};
  for (const e of Object.values(entities)) {
    const cols = [];
    const seenColumns = new Set();
    columns[e.table] = [];
    const addColumn = (name, ddl, field) => {
      if (seenColumns.has(name)) {
        // Hibernate cho phép quan hệ chỉ đọc dùng chung cột với field khóa chính.
        const column = field.anns.find((a) => a.name === 'JoinColumn');
        if (attr(column?.args, 'insertable') === 'false' && attr(column?.args, 'updatable') === 'false') return;
        throw new Error(`Cột trùng chưa xử lý: ${e.table}.${name}`);
      }
      seenColumns.add(name);
      columns[e.table].push({ name, field: field.name });
      cols.push(ddl);
    };
    for (const f of e.fields) {
      const has = (n) => f.anns.find((a) => a.name === n);
      if (has('Transient') || has('Formula') || has('OneToMany') || has('ManyToMany')) continue;
      const rel = has('ManyToOne') || has('OneToOne');
      if (rel && attr(rel.args, 'mappedBy')) continue;
      if (/^(List|Set|Collection)</.test(f.type) && !has('JdbcTypeCode')) continue;
      const col = has('Column');
      if (rel) {
        const jc = has('JoinColumn');
        const cname = attr(jc?.args, 'name') || `${snake(f.name)}_id`;
        const target = byName[f.type.split('.').pop()];
        const notNull = attr(jc?.args, 'nullable') === 'false' || attr(rel.args, 'optional') === 'false';
        addColumn(cname, `"${cname}" uuid${notNull ? ' NOT NULL' : ''}${attr(jc?.args, 'unique') === 'true' || has('OneToOne') ? ' UNIQUE' : ''}`, f);
        const od = has('OnDelete');
        const onDel = od ? ` ON DELETE ${/CASCADE/.test(od.args) ? 'CASCADE' : /SET_NULL/.test(od.args) ? 'SET NULL' : 'NO ACTION'}` : '';
        if (target) fks.push(`ALTER TABLE "${e.table}" ADD FOREIGN KEY ("${cname}") REFERENCES "${target.table}"("id")${onDel};`);
        continue;
      }
      const cname = attr(col?.args, 'name') || snake(f.name);
      let l = `"${cname}" ${pgType(f, col, enums)}`;
      if (has('Id')) l += ' PRIMARY KEY';
      else {
        if (attr(col?.args, 'nullable') === 'false' || /^(int|long|boolean|double|float|short)$/.test(f.type)) l += ' NOT NULL';
        if (attr(col?.args, 'unique') === 'true') l += ' UNIQUE';
      }
      const cd = attr(col?.args, 'columnDefinition');
      const dm = cd && cd.match(/\s+DEFAULT\s+(.+)$/i);
      if (dm) l += ` DEFAULT ${dm[1]}`;
      if (has('Id') && has('GeneratedValue')) l += ' DEFAULT gen_random_uuid()';
      addColumn(cname, l, f);
    }
    for (const uc of (e.tableArgs.match(/@UniqueConstraint\s*\(([^)]*)\)/g) || [])) {
      const names = [...uc.matchAll(/"(\w+)"/g)].map((m) => m[1]);
      const cn = attr(uc.slice(uc.indexOf('(') + 1), 'name');
      const colsU = cn ? names.filter((n) => n !== cn) : names;
      if (colsU.length) cols.push(`${cn ? `CONSTRAINT "${cn}" ` : ''}UNIQUE (${colsU.map((x) => `"${x}"`).join(', ')})`);
    }
    for (const ix of (e.tableArgs.match(/@Index\s*\(([^)]*)\)/g) || [])) {
      const nm = attr(ix.slice(7), 'name'), list = attr(ix.slice(7), 'columnList'), uniq = attr(ix.slice(7), 'unique') === 'true';
      if (list) extras.push(`CREATE ${uniq ? 'UNIQUE ' : ''}INDEX IF NOT EXISTS "${nm || `idx_${e.table}_${list.replace(/\W+/g, '_')}`}" ON "${e.table}" (${list.split(',').map((x) => `"${x.trim().split(' ')[0]}"`).join(', ')});`);
    }
    creates.push(`CREATE TABLE IF NOT EXISTS "${e.table}" (\n  ${cols.join(',\n  ')}\n);`);
  }
  return { sql: [...creates, ...fks, ...extras].join('\n'), count: Object.keys(entities).length, tables: Object.values(entities).map((e) => e.table), columns };
}
