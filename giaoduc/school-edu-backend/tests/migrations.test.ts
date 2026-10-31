import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { existsSync, readFileSync, mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { pbkdf2Sync } from 'node:crypto';

const migrations = ['0001_schema.sql', '0002_seed.sql', '0003_new_features.sql', '0004_seed_admin.sql'];
const adminId = '00000000-0000-4000-8000-000000000001';
const adminEmail = 'tuananhha1710@gmail.com';
let db: DatabaseSync;

function assertPassword(password: string, hash: string) {
  const parts = hash.split('$');
  expect(parts.slice(0, 2)).toEqual(['pbkdf2_sha256', '100000']);
  expect(Buffer.from(parts[2], 'base64')).toHaveLength(16);
  expect(parts[3]).toBe(pbkdf2Sync(password, Buffer.from(parts[2], 'base64'), 100000, 32, 'sha256').toString('base64'));
}

beforeEach(() => {
  db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  for (const name of migrations) {
    const path = new URL('../migrations/' + name, import.meta.url);
    expect(existsSync(path), name + ' must exist').toBe(true);
    db.exec(readFileSync(path, 'utf8'));
  }
});
afterEach(() => db?.close());

function addUser(id: string, username: string | null) {
  db.prepare('INSERT INTO users (id,email,full_name,role,status,auth_provider,username) VALUES (?,?,?,?,?,?,?)')
    .run(id, id + '@example.test', 'Test', 'TEACHER', 'ACTIVE', 'LOCAL', username);
}

describe('All four migrations', () => {
  it('seeds only the requested Admin with a hash and required first password change', () => {
    const rows = db.prepare('SELECT * FROM users').all();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: adminId, username: 'Admin', email: adminEmail, role: 'ADMIN', status: 'ACTIVE', auth_provider: 'LOCAL', must_change_password: 1 });
    const password = process.env.ADMIN_INITIAL_PASSWORD || 'admin123@';
    expect(readFileSync(new URL('../migrations/0004_seed_admin.sql', import.meta.url), 'utf8')).not.toContain(password);
    assertPassword(password, rows[0].password as string);
    expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
  });

  it('never overwrites a changed existing admin when the seed is applied again', () => {
    db.prepare('UPDATE users SET username=?,email=?,password=?,must_change_password=0 WHERE id=?')
      .run('Renamed', 'changed@example.test', 'changed-password-hash', adminId);
    db.exec(readFileSync(new URL('../migrations/0004_seed_admin.sql', import.meta.url), 'utf8'));
    expect(db.prepare('SELECT username,email,password,must_change_password FROM users').all()).toEqual([
      { username: 'Renamed', email: 'changed@example.test', password: 'changed-password-hash', must_change_password: 0 },
    ]);
  });

  it('enforces usernames without case sensitivity and allows multiple NULL usernames', () => {
    expect(() => addUser('duplicate', 'aDmIn')).toThrow(/UNIQUE/);
    addUser('one', null);
    addUser('two', null);
    expect(db.prepare('SELECT must_change_password FROM users WHERE id=?').get('one')).toEqual({ must_change_password: 0 });
    expect(() => db.prepare('UPDATE users SET must_change_password=NULL WHERE id=?').run('one')).toThrow(/NOT NULL/);
  });

  it('accepts only TX/GK/CK or NULL assessment types', () => {
    const insert = db.prepare('INSERT INTO exams (id,title,duration_minutes,teacher_id,assessment_type) VALUES (?,?,?,?,?)');
    for (const type of ['TX', 'GK', 'CK', null]) insert.run(type || 'practice', 'Test', 15, adminId, type);
    expect(() => insert.run('invalid', 'Test', 15, adminId, 'OTHER')).toThrow(/CHECK/);
  });

  it('stores one global settings row with editable branding and no seeded key/contact details', () => {
    expect(db.prepare('SELECT * FROM school_settings').all()).toEqual([
      expect.objectContaining({ id: 1, provider: 'GEMINI', model: 'gemini-2.5-flash', api_key_enc: null, key_last4: null, strictness: 'STANDARD', auto_grade_on_submit: 1, require_teacher_review: 1, brand_name: 'Điểm Sáng', logo_url: null, contact_email: null, contact_phone: null, contact_address: null, updated_at: expect.any(String) }),
    ]);
    expect(db.prepare("SELECT name FROM sqlite_master WHERE name='user_ai_settings'").all()).toEqual([]);
    expect(() => db.prepare('INSERT INTO school_settings (id,updated_at) VALUES (?,?)').run(2, new Date().toISOString())).toThrow(/CHECK/);
    expect(() => db.prepare('INSERT INTO school_settings (id,updated_at) VALUES (?,?)').run(1, new Date().toISOString())).toThrow(/UNIQUE/);
    expect(() => db.exec("UPDATE school_settings SET provider='OTHER'")).toThrow(/CHECK/);
    expect(() => db.exec("UPDATE school_settings SET strictness='OTHER'")).toThrow(/CHECK/);
    db.prepare('UPDATE school_settings SET brand_name=?,contact_email=?,logo_url=? WHERE id=1').run('My school', 'contact@example.test', '/logo.png');
    expect(db.prepare('SELECT brand_name,contact_email,logo_url FROM school_settings').get()).toEqual({ brand_name: 'My school', contact_email: 'contact@example.test', logo_url: '/logo.png' });
  });

  it('defaults grade weights to 1/2/3 and cascades them when the classroom is deleted', () => {
    db.prepare('INSERT INTO classrooms (id,name,invite_code,is_admin_group) VALUES (?,?,?,?)').run('class-1', 'Class', 'INVITE', 0);
    db.prepare('INSERT INTO classroom_grade_weights (classroom_id) VALUES (?)').run('class-1');
    expect(db.prepare('SELECT * FROM classroom_grade_weights').all()).toEqual([{ classroom_id: 'class-1', w_tx: 1, w_gk: 2, w_ck: 3 }]);
    expect(() => db.prepare('INSERT INTO classroom_grade_weights (classroom_id) VALUES (?)').run('missing')).toThrow(/FOREIGN KEY/);
    db.prepare('DELETE FROM classrooms WHERE id=?').run('class-1');
    expect(db.prepare('SELECT * FROM classroom_grade_weights').all()).toEqual([]);
  });
});

describe('Seed generator', () => {
  it('requires a process password, generates a valid seed, and never prints the password', () => {
    const tool = fileURLToPath(new URL('../tools/seed-admin.mjs', import.meta.url));
    expect(existsSync(tool), 'seed generator must exist').toBe(true);
    const temporaryParent = realpathSync(tmpdir());
    const root = mkdtempSync(join(temporaryParent, 'school-seed-'));
    const env = { ...process.env };
    delete env.ADMIN_INITIAL_PASSWORD;
    try {
      const missing = spawnSync(process.execPath, [tool], { cwd: root, env, encoding: 'utf8' });
      expect(missing.status).not.toBe(0);
      expect(existsSync(join(root, 'migrations/0004_seed_admin.sql'))).toBe(false);
      const password = 'test-only-bootstrap-password';
      const generated = spawnSync(process.execPath, [tool], { cwd: root, env: { ...env, ADMIN_INITIAL_PASSWORD: password }, encoding: 'utf8' });
      expect(generated.status, generated.stderr).toBe(0);
      expect(generated.stdout + generated.stderr).not.toContain(password);
      const sql = readFileSync(join(root, 'migrations/0004_seed_admin.sql'), 'utf8');
      expect(sql).not.toContain(password);
      db.exec('DELETE FROM users');
      db.exec(sql);
      const rows = db.prepare('SELECT username,password,email FROM users').all();
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ username: 'Admin', email: adminEmail });
      assertPassword(password, rows[0].password as string);
    } finally {
      const resolvedRoot = realpathSync(root);
      if (dirname(resolvedRoot) !== temporaryParent || !basename(resolvedRoot).startsWith('school-seed-')) {
        throw new Error('Refusing cleanup outside the seed test temporary directory');
      }
      rmSync(resolvedRoot, { recursive: true, force: true });
    }
  });
});
