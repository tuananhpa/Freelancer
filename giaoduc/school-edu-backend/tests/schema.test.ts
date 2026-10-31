import { describe, it, expect } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { fileURLToPath, URL } from 'node:url';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { entitiesToPg } from '../tools/entities-to-pg.mjs';

const javaRoot = fileURLToPath(new URL('../../URANUS-BackEnd-main/URANUS-BackEnd-main/src/main/java/', import.meta.url));
const extractor = fileURLToPath(new URL('../tools/extract-schema.mjs', import.meta.url));

function extract(migrations?: Record<string, string>) {
  const root = mkdtempSync(join(tmpdir(), 'uranus-schema-'));
  const source = join(root, 'flyway');
  mkdirSync(source);
  for (const [name, sql] of Object.entries(migrations || {})) writeFileSync(join(source, name), sql);
  const migrationRoot = migrations ? source : fileURLToPath(new URL('../../URANUS-BackEnd-main/URANUS-BackEnd-main/src/main/resources/db/migration/', import.meta.url));
  const run = spawnSync(process.execPath, [extractor, migrationRoot, javaRoot], { cwd: root, encoding: 'utf8' });
  return { root, run };
}

describe('Schema từ entity Java', () => {
  it('dựng đủ 58 bảng, kể cả quan hệ dùng chung cột khóa chính', async () => {
    const generated = entitiesToPg(javaRoot);
    expect(generated.count).toBe(58);
    const db = new PGlite();
    try {
      await db.exec(generated.sql);
      const result = await db.query("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='user_gamification'");
      expect(result.rows.filter((r: any) => r.column_name === 'user_id')).toHaveLength(1);
      const tables = await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'");
      expect(tables.rows).toHaveLength(58);
      const derived = await db.query("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='student_code'");
      expect(derived.rows, '@Formula đọc student_profiles, không phải cột vật lý của users').toHaveLength(0);
    } finally {
      await db.close();
    }
  }, 30000);
});

describe('Áp migration an toàn', () => {
  it('áp đủ 86 migration thật, xuất SQLite đủ cột, unique, check và cascade', () => {
    const { root, run } = extract();
    const db = new DatabaseSync(':memory:');
    try {
      expect(run.status, run.stderr + run.stdout).toBe(0);
      const report = JSON.parse(readFileSync(join(root, 'tools/migration-report.json'), 'utf8'));
      const schema = JSON.parse(readFileSync(join(root, 'tools/schema.json'), 'utf8'));
      expect(report.migrations).toHaveLength(86);
      expect(report.errors).toEqual([]);
      expect(report.missingEntityColumns).toEqual([]);
      expect(report.migrationOnlyColumns).toHaveLength(10);
      const ddl = readFileSync(join(root, 'migrations/0001_schema.sql'), 'utf8');
      expect(ddl).not.toMatch(/bỏ CHECK|bỏ index|pg default/);
      db.exec(ddl);
      db.exec(readFileSync(join(root, 'migrations/0002_seed.sql'), 'utf8'));
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      expect(tables).toHaveLength(59);
      let columns = 0;
      for (const [table, definition] of Object.entries(schema) as [string, { columns: { name: string }[] }][]) {
        const actual = db.prepare('SELECT name FROM pragma_table_info(?)').all(table).map((c) => c.name);
        expect(actual).toEqual(definition.columns.map((c) => c.name));
        columns += actual.length;
      }
      expect(columns).toBe(518);
      const insert = db.prepare('INSERT INTO users (id,email,full_name,role,status,auth_provider) VALUES (?,?,?,?,?,?)');
      insert.run('user-1', 'one@example.test', 'Test', 'ADMIN', 'ACTIVE', 'LOCAL');
      expect(() => insert.run('user-2', 'one@example.test', 'Test', 'ADMIN', 'ACTIVE', 'LOCAL')).toThrow(/UNIQUE/);
      expect(() => insert.run('user-3', 'three@example.test', 'Test', 'INVALID', 'ACTIVE', 'LOCAL')).toThrow(/CHECK/);
      db.prepare('INSERT INTO user_gamification (user_id) VALUES (?)').run('user-1');
      db.prepare('DELETE FROM users WHERE id=?').run('user-1');
      expect(db.prepare('SELECT * FROM user_gamification').all()).toEqual([]);
      expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
    } finally { db.close(); rmSync(root, { recursive: true, force: true }); }
  }, 30000);

  it('giữ DO, chuỗi chứa dấu chấm phẩy, version số và câu lệnh sau lỗi trùng', () => {
    const { root, run } = extract({
      'V1.2__duplicates.sql': `-- ; comment\nALTER TABLE users ADD COLUMN email TEXT;\nALTER TABLE users ADD COLUMN migration_only TEXT DEFAULT 'https://example.test/a;b';`,
      'V1.9__block.sql': `/* comment ; /* nested ; */ */ DO $body$ BEGIN UPDATE users SET migration_only = 'x;y'; END $body$;\nALTER TABLE users ADD COLUMN sort_check TEXT DEFAULT 'before';`,
      'V1.10__order.sql': "ALTER TABLE users ALTER COLUMN sort_check SET DEFAULT 'after';",
    });
    try {
      expect(run.status, run.stderr + run.stdout).toBe(0);
      const schema = JSON.parse(readFileSync(join(root, 'tools/schema.json'), 'utf8'));
      expect(Object.keys(schema)).toHaveLength(58);
      expect(schema.users.columns.find((c: any) => c.name === 'migration_only').default).toContain('https://example.test/a;b');
      expect(schema.users.columns.find((c: any) => c.name === 'sort_check').default).toContain('after');
      expect(run.stdout).toContain('users.migration_only');
    } finally { rmSync(root, { recursive: true, force: true }); }
  }, 30000);

  it('báo rõ lỗi khác trùng và không xuất schema chưa hoàn chỉnh', () => {
    const { root, run } = extract({ 'V1.2__broken.sql': 'ALTER TABLE definitely_missing ADD COLUMN x TEXT;' });
    try {
      expect(run.status).not.toBe(0);
      expect(run.stderr).toContain('42P01');
      expect(run.stderr).toContain('V1.2__broken.sql');
    } finally { rmSync(root, { recursive: true, force: true }); }
  }, 30000);

  it('sửa riêng dấu bao thân DO bị thiếu của V1.51 và ghi dấu vết', () => {
    const original = readFileSync(new URL('../../URANUS-BackEnd-main/URANUS-BackEnd-main/src/main/resources/db/migration/V1.51__fix_user_activity_log_fk.sql', import.meta.url), 'utf8');
    const { root, run } = extract({ 'V1.51__fix_user_activity_log_fk.sql': original });
    try {
      expect(run.status, run.stderr + run.stdout).toBe(0);
      const report = JSON.parse(readFileSync(join(root, 'tools/migration-report.json'), 'utf8'));
      expect(report.repairs).toHaveLength(1);
      expect(report.repairs[0].file).toBe('V1.51__fix_user_activity_log_fk.sql');
      expect(report.errors).toHaveLength(0);
    } finally { rmSync(root, { recursive: true, force: true }); }
  }, 30000);

  it('đọc metadata FK của V1.53 trước khi xóa constraint', () => {
    const original = readFileSync(new URL('../../URANUS-BackEnd-main/URANUS-BackEnd-main/src/main/resources/db/migration/V1.53__cascade_delete_users_reliable.sql', import.meta.url), 'utf8');
    const { root, run } = extract({ 'V1.53__cascade_delete_users_reliable.sql': original });
    try {
      expect(run.status, run.stderr + run.stdout).toBe(0);
      const schema = JSON.parse(readFileSync(join(root, 'tools/schema.json'), 'utf8'));
      expect(schema.courses.constraints.some((c: any) => c.type === 'f' && c.def.includes('users(id) ON DELETE CASCADE'))).toBe(true);
    } finally { rmSync(root, { recursive: true, force: true }); }
  }, 30000);

  it('không tạo học liệu mẫu V1.74 phụ thuộc tài khoản demo trên DB mới', () => {
    const original = readFileSync(new URL('../../URANUS-BackEnd-main/URANUS-BackEnd-main/src/main/resources/db/migration/V1.74__create_content_resources_tables.sql', import.meta.url), 'utf8');
    const { root, run } = extract({ 'V1.74__create_content_resources_tables.sql': original });
    try {
      expect(run.status, run.stderr + run.stdout).toBe(0);
      const report = JSON.parse(readFileSync(join(root, 'tools/migration-report.json'), 'utf8'));
      expect(report.exclusions).toHaveLength(1);
      expect(readFileSync(join(root, 'migrations/0002_seed.sql'), 'utf8')).not.toContain('INSERT INTO');
    } finally { rmSync(root, { recursive: true, force: true }); }
  }, 30000);
});
