import { describe, expect, it } from 'vitest';
import { pbkdf2Sync } from 'node:crypto';
import { hashPassword, verifyPassword } from '../src/lib/password';

describe('Password hashing', () => {
  it('creates interoperable PBKDF2-SHA256 hashes and verifies correct/wrong passwords', async () => {
    const password = 'Test mật khẩu 🔐';
    const hash = await hashPassword(password);
    const parts = hash.split('$');
    expect(parts).toHaveLength(4);
    expect(parts.slice(0, 2)).toEqual(['pbkdf2_sha256', '100000']);
    const salt = Buffer.from(parts[2], 'base64');
    expect(salt).toHaveLength(16);
    expect(Buffer.from(parts[3], 'base64')).toHaveLength(32);
    expect(parts[3]).toBe(pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('base64'));
    expect(await verifyPassword(password, hash)).toBe(true);
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });

  it('uses a different random salt for each hash', async () => {
    const first = await hashPassword('same password');
    const second = await hashPassword('same password');
    expect(first.split('$')[2]).not.toBe(second.split('$')[2]);
    expect(await verifyPassword('same password', second)).toBe(true);
  });

  it('fails closed for malformed hashes, invalid encoding, or unsupported iteration counts', async () => {
    const hash = await hashPassword('test');
    const [scheme, iterations, salt, digest] = hash.split('$');
    for (const malformed of [
      '', 'unknown', hash + '$extra', `${scheme}$0$${salt}$${digest}`,
      `${scheme}$999999999$${salt}$${digest}`, `${scheme}$0100000$${salt}$${digest}`,
      `${scheme}$${iterations}$!${salt.slice(1)}$${digest}`,
      `${scheme}$${iterations}$${salt.slice(4)}$${digest}`,
      `${scheme}$${iterations}$${salt}$${digest.slice(4)}`,
      '$2b$03$' + 'a'.repeat(53), '$2b$10$short', null, undefined, 123,
    ]) expect(await verifyPassword('test', malformed as string)).toBe(false);
  });

  it('verifies legacy bcrypt hashes without changing their format', async () => {
    const { hashSync } = await import('bcryptjs');
    const legacy = hashSync('legacy password', 4);
    for (const prefix of ['$2a$', '$2b$', '$2y$']) {
      const hash = prefix + legacy.slice(4);
      expect(await verifyPassword('legacy password', hash)).toBe(true);
      expect(await verifyPassword('wrong', hash)).toBe(false);
    }
  });
});
