// Áp toàn bộ migration Flyway của backend Java (chỉ đọc) vào Postgres thật chạy bằng PGlite,
// rồi đọc schema cuối cùng và sinh migration SQLite cho Cloudflare D1.
//   node tools/extract-schema.mjs [thư-mục-migration]
// Kết quả: migrations/0001_schema.sql, migrations/0002_seed.sql, tools/schema.json
import { PGlite } from '@electric-sql/pglite';
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { entitiesToPg } from './entities-to-pg.mjs';

const SRC = process.argv[2] || '../URANUS-BackEnd-main/URANUS-BackEnd-main/src/main/resources/db/migration';
const JAVA = process.argv[3] || '../URANUS-BackEnd-main/URANUS-BackEnd-main/src/main/java';

// Tách SQL ngoài chuỗi, identifier, comment và dollar-quoted body của PL/pgSQL.
function statements(sql) {
  const result = [];
  let current = '', quote = null, dollar = null, block = 0, line = false;
  for (let i = 0; i < sql.length; i++) {
    const c = sql[i], next = sql[i + 1];
    if (line) { if (c === '\n') { line = false; current += '\n'; } continue; }
    if (block) {
      if (c === '/' && next === '*') { block++; i++; }
      else if (c === '*' && next === '/') { block--; i++; }
      continue;
    }
    if (dollar) {
      if (sql.startsWith(dollar, i)) { current += dollar; i += dollar.length - 1; dollar = null; }
      else current += c;
      continue;
    }
    if (quote) {
      current += c;
      if (c === quote) {
        if (next === quote) { current += next; i++; }
        else quote = null;
      } else if (c === '\\' && quote === "'" && next) { current += next; i++; }
      continue;
    }
    if (c === '-' && next === '-') { line = true; i++; current += ' '; continue; }
    if (c === '/' && next === '*') { block = 1; i++; current += ' '; continue; }
    if (c === "'" || c === '"') { quote = c; current += c; continue; }
    const tag = c === '$' && sql.slice(i).match(/^(\$[A-Za-z_]\w*\$|\$\$)/);
    if (tag) { dollar = tag[0]; current += dollar; i += dollar.length - 1; continue; }
    if (c === ';') { if (current.trim()) result.push(current.trim()); current = ''; }
    else current += c;
  }
  if (quote || dollar || block) throw new Error('SQL có chuỗi hoặc comment chưa đóng.');
  if (current.trim()) result.push(current.trim());
  return result;
}

// Flyway sắp theo version số: V1.9 < V1.10
const ver = (f) => f.match(/^V([\d.]+)__/)[1].split('.').map(Number);
const cmp = (a, b) => { const x = ver(a), y = ver(b); for (let i = 0; i < Math.max(x.length, y.length); i++) { const d = (x[i] ?? 0) - (y[i] ?? 0); if (d) return d; } return 0; };
const files = readdirSync(SRC).filter((f) => /^V[\d.]+__.*\.sql$/.test(f)).sort(cmp);

const db = new PGlite();
try {
const entitySchema = entitiesToPg(JAVA);
await db.exec(entitySchema.sql);
console.log(`Đã dựng ${entitySchema.count} bảng entity, ${Object.values(entitySchema.columns).flat().length} cột.`);
const report = { entityCount: entitySchema.count, migrations: [], duplicates: [], errors: [], repairs: [], exclusions: [] };
const duplicateCodes = new Set(['42701', '42P07', '42710']);
for (const f of files) {
  const original = readFileSync(join(SRC, f), 'utf8');
  let source = original;
  if (f === 'V1.51__fix_user_activity_log_fk.sql' && /^DO\s+DECLARE\b/m.test(source)) {
    // Bản nguồn thiếu dấu dollar-quote; chỉ bổ sung dấu bao, không đổi thân PL/pgSQL.
    source = source.replace(/^DO\s+(DECLARE\b[\s\S]*?^END\s*;)/m, (_, body) => `DO $uranus_v151$\n${body}\n$uranus_v151$;`);
    report.repairs.push({ file: f, sha256: createHash('sha256').update(original).digest('hex'), reason: 'Bổ sung dollar-quote bị thiếu quanh thân DO; không sửa nguồn Java.' });
    console.log(`Đã sửa cú pháp trong bộ nhớ: ${f} (thiếu dollar-quote).`);
  }
  if (f === 'V1.53__cascade_delete_users_reliable.sql') {
    const drop = "EXECUTE 'ALTER TABLE ' || r.table_name || ' DROP CONSTRAINT ' || r.constraint_name;";
    const lookup = 'WHERE a.attnum = ANY(c2.conkey) AND a.attrelid = c2.conrelid;';
    if (!source.includes(drop) || !source.includes(lookup)) throw new Error(`Nguồn ${f} đã thay đổi; cần kiểm tra lại sửa thứ tự tra metadata.`);
    source = source.replace(drop, '').replace(lookup, `${lookup}\n            ${drop}`);
    report.repairs.push({ file: f, sha256: createHash('sha256').update(original).digest('hex'), reason: 'Tra cột FK trước khi DROP constraint để tránh EXECUTE NULL; giữ ON DELETE CASCADE.' });
    console.log(`Đã sửa thứ tự tra metadata trong bộ nhớ: ${f}.`);
  }
  const sql = statements(source);
  await db.exec('BEGIN');
  for (let i = 0; i < sql.length; i++) {
    if (f === 'V1.74__create_content_resources_tables.sql' && /^INSERT INTO content_resources\b/i.test(sql[i])) {
      report.exclusions.push({ file: f, statement: i + 1, reason: 'Bỏ học liệu demo phụ thuộc tài khoản cũ; cài mới chỉ seed Admin theo PLAN §3.' });
      continue;
    }
    await db.exec('SAVEPOINT migration_statement');
    try { await db.exec(sql[i]); }
    catch (e) {
      await db.exec('ROLLBACK TO SAVEPOINT migration_statement');
      const issue = { file: f, statement: i + 1, code: e.code, message: e.message, sql: sql[i] };
      if (duplicateCodes.has(e.code)) report.duplicates.push(issue);
      else { report.errors.push(issue); console.error(`✗ ${f} #${i + 1} [${e.code}]: ${e.message}`); }
    }
    await db.exec('RELEASE SAVEPOINT migration_statement');
  }
  await db.exec('COMMIT');
  report.migrations.push({ file: f, statements: sql.length });
}
mkdirSync('tools', { recursive: true });
writeFileSync('tools/migration-report.json', JSON.stringify(report, null, 2) + '\n');
if (report.errors.length) throw new Error(`${report.errors.length} lỗi migration cần kiểm tra; không xuất schema chưa hoàn chỉnh.`);
console.log(`Đã áp ${files.length} migration (${files[0]} → ${files[files.length - 1]})`);
console.log(`Bỏ qua ${report.duplicates.length} câu lệnh trùng (42701/42P07/42710); 0 lỗi khác.`);

const q = async (sql) => (await db.query(sql)).rows;
const tables = (await q(`select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE' and table_name <> 'flyway_schema_history' order by table_name`)).map((r) => r.table_name);
const cols = await q(`select table_name, column_name, data_type, udt_name, is_nullable, column_default, ordinal_position from information_schema.columns where table_schema='public' order by table_name, ordinal_position`);
const cons = await q(`select c.conname, t.relname as table_name, c.contype, pg_get_constraintdef(c.oid) as def from pg_constraint c join pg_class t on t.oid=c.conrelid join pg_namespace n on n.oid=t.relnamespace where n.nspname='public' order by t.relname, c.contype, c.conname`);
const idx = await q(`select tablename, indexname, indexdef from pg_indexes where schemaname='public' order by tablename, indexname`);
const missing = [], migrationOnly = [];
for (const [table, fields] of Object.entries(entitySchema.columns)) {
  for (const field of fields) if (!cols.some((c) => c.table_name === table && c.column_name === field.name)) missing.push(`${table}.${field.name} (${field.field})`);
}
for (const c of cols) if (!entitySchema.columns[c.table_name]?.some((f) => f.name === c.column_name)) migrationOnly.push(`${c.table_name}.${c.column_name}`);
report.migrationOnlyColumns = migrationOnly;
report.missingEntityColumns = missing;
writeFileSync('tools/migration-report.json', JSON.stringify(report, null, 2) + '\n');
if (missing.length) throw new Error(`Thiếu cột entity: ${missing.join(', ')}`);
console.log(`Đối chiếu entity: 0 cột thiếu. Cột chỉ có ở migration (${migrationOnly.length}):\n${migrationOnly.join('\n')}`);

const typeMap = (c) => {
  const t = c.udt_name;
  if (['int2', 'int4', 'int8', 'bool'].includes(t)) return 'INTEGER';
  if (['float4', 'float8', 'numeric'].includes(t)) return 'REAL';
  if (t === 'bytea') return 'BLOB';
  return 'TEXT'; // uuid, varchar, text, timestamp, date, json/jsonb, mảng -> TEXT (mảng/json lưu JSON)
};
const defMap = (d, c) => {
  if (d == null) return null;
  if (/gen_random_uuid|uuid_generate/.test(d)) return null; // ứng dụng tự sinh crypto.randomUUID()
  if (/nextval\(/.test(d)) return null; // INTEGER PRIMARY KEY tự tăng
  if (/^(now\(\)|CURRENT_TIMESTAMP|LOCALTIMESTAMP)/i.test(d)) return `(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`;
  if (/^CURRENT_DATE/i.test(d)) return `(date('now'))`;
  if (d === 'true') return '1';
  if (d === 'false') return '0';
  const lit = d.match(/^'((?:[^']|'')*)'(::[\w\s"\[\]]+)*$/);
  if (lit) return c.udt_name === 'bool' ? (lit[1] === 'true' ? '1' : '0') : `'${lit[1]}'`;
  const num = d.match(/^\(?(-?[\d.]+)\)?(::[\w\s]+)?$/);
  if (num) return num[1];
  return `NULL /* pg default: ${d} */`;
};
const checkMap = (def) => {
  // CHECK (((status)::text = ANY ((ARRAY['A'::character varying, 'B'::character varying])::text[])))
  const m = def.match(/^CHECK \(+\(?(\w+)\)?(?:::\w+(?: \w+)?)? = ANY \(+ARRAY\[(.+?)\]\)?(?:::[\w\s]+\[\])?\)+$/);
  if (m) return `CHECK (${m[1]} IN (${[...m[2].matchAll(/'((?:[^']|'')*)'/g)].map((x) => `'${x[1]}'`).join(', ')}))`;
  const simple = def.replace(/::[\w ]+(\[\])?/g, '');
  return /ARRAY|ANY|~|::/.test(simple) ? null : simple;
};

const out = ['-- Schema D1 sinh tự động từ 58 entity + migration Flyway của backend Java (tools/extract-schema.mjs).', '-- Kiểu: uuid/varchar/timestamp/json -> TEXT, bool -> INTEGER 0/1. Không sửa tay; chạy lại script.', 'PRAGMA foreign_keys = ON;', ''];
const schema = {};
for (const t of tables) {
  const tc = cols.filter((c) => c.table_name === t);
  const tcons = cons.filter((c) => c.table_name === t);
  schema[t] = { columns: tc.map((c) => ({ name: c.column_name, pgType: c.udt_name, nullable: c.is_nullable === 'YES', default: c.column_default })), constraints: tcons.map((c) => ({ type: c.contype, def: c.def })) };
  const pk = tcons.find((c) => c.contype === 'p');
  const pkCols = pk ? pk.def.match(/\((.+)\)/)[1].split(',').map((s) => s.trim()) : [];
  const lines = tc.map((c) => {
    let l = `  "${c.column_name}" ${typeMap(c)}`;
    if (pkCols.length === 1 && pkCols[0] === c.column_name) l += ' PRIMARY KEY' + (/nextval/.test(c.column_default || '') ? ' AUTOINCREMENT' : '');
    if (c.is_nullable === 'NO') l += ' NOT NULL';
    const d = defMap(c.column_default, c);
    if (d) l += ` DEFAULT ${d}`;
    return l;
  });
  if (pkCols.length > 1) lines.push(`  PRIMARY KEY (${pkCols.map((x) => `"${x}"`).join(', ')})`);
  for (const c of tcons.filter((x) => x.contype === 'u')) lines.push(`  ${c.def.replace(/\((.+)\)/, (_, a) => `(${a.split(',').map((x) => `"${x.trim()}"`).join(', ')})`)}`);
  for (const c of tcons.filter((x) => x.contype === 'f')) {
    const m = c.def.match(/FOREIGN KEY \((.+?)\) REFERENCES (\w+)\((.+?)\)(.*)/);
    lines.push(`  FOREIGN KEY (${m[1].split(',').map((x) => `"${x.trim()}"`).join(', ')}) REFERENCES "${m[2]}"(${m[3].split(',').map((x) => `"${x.trim()}"`).join(', ')})${m[4].replace(/ DEFERRABLE.*$/, '')}`);
  }
  for (const c of tcons.filter((x) => x.contype === 'c')) {
    const ck = checkMap(c.def);
    lines.push(ck ? `  ${ck}` : `  -- bỏ CHECK không chuyển được: ${c.def}`);
  }
  // dòng comment không được có dấu phẩy treo: ghép cẩn thận
  const body = lines.map((l, i) => (l.trim().startsWith('--') || i === lines.length - 1 || lines.slice(i + 1).every((x) => x.trim().startsWith('--')) ? l : l + ',')).join('\n');
  out.push(`CREATE TABLE "${t}" (\n${body}\n);`);
  for (const i of idx.filter((x) => x.tablename === t && !tcons.some((c) => c.conname === x.indexname))) {
    const m = i.indexdef.match(/CREATE (UNIQUE )?INDEX (\w+) ON public\.(\w+) USING \w+ \((.+?)\)( WHERE .+)?$/);
    if (!m) { out.push(`-- bỏ index không chuyển được: ${i.indexdef}`); continue; }
    const where = (m[5] || '').replace(/::[\w ]+/g, '').replace(/\btrue\b/g, '1').replace(/\bfalse\b/g, '0');
    out.push(`CREATE ${m[1] || ''}INDEX "${m[2]}" ON "${m[3]}" (${m[4].split(',').map((x) => x.trim().replace(/^(\w+)/, '"$1"')).join(', ')})${where};`);
  }
  out.push('');
}

// Dữ liệu có sẵn sau migration (vd. tài khoản/seed) -> 0002_seed.sql
const seed = ['-- Dữ liệu do migration Java chèn sẵn.', 'PRAGMA defer_foreign_keys = ON;'];
const esc = (v, c) => v == null ? 'NULL' : typeof v === 'boolean' ? (v ? '1' : '0') : typeof v === 'number' ? String(v) : v instanceof Date ? `'${v.toISOString()}'` : typeof v === 'object' ? `'${JSON.stringify(v).replace(/'/g, "''")}'` : `'${String(v).replace(/'/g, "''")}'`;
let seedRows = 0;
for (const t of tables) {
  const rows = await q(`select * from "${t}"`);
  for (const r of rows) { seed.push(`INSERT INTO "${t}" (${Object.keys(r).map((k) => `"${k}"`).join(', ')}) VALUES (${Object.values(r).map(esc).join(', ')});`); seedRows++; }
}

mkdirSync('migrations', { recursive: true });
writeFileSync('migrations/0001_schema.sql', out.join('\n'));
writeFileSync('migrations/0002_seed.sql', seed.join('\n') + '\n');
writeFileSync('tools/schema.json', JSON.stringify(schema, null, 2));
console.log(`${tables.length} bảng, ${cols.length} cột, ${cons.filter((c) => c.contype === 'f').length} khóa ngoại, ${idx.length} index, ${seedRows} dòng seed`);
} catch (e) {
  console.error(`✗ [${e.code || 'SCHEMA_ERROR'}] ${e.message}`);
  process.exitCode = 1;
} finally {
  await db.close();
}
