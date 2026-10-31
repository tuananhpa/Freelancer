import { mkdir, writeFile } from 'node:fs/promises';
import { hashPassword } from '../src/lib/password.ts';

const password = process.env.ADMIN_INITIAL_PASSWORD;
if (!password) {
  console.error('ADMIN_INITIAL_PASSWORD is required. Set it only in the process environment.');
  process.exit(1);
}

const hash = await hashPassword(password);
const sql = `-- Bootstrap only: an existing account is never reset by applying this seed again.
INSERT INTO users (id, email, password, full_name, role, status, auth_provider, username, must_change_password, created_at, updated_at)
VALUES ('00000000-0000-4000-8000-000000000001', 'tuananhha1710@gmail.com', '${hash}', 'Admin', 'ADMIN', 'ACTIVE', 'LOCAL', 'Admin', 1, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now'))
ON CONFLICT DO NOTHING;
`;
await mkdir('migrations', { recursive: true });
await writeFile('migrations/0004_seed_admin.sql', sql, 'utf8');
console.log('Generated migrations/0004_seed_admin.sql with a password hash.');
