# Step 2 — features schema and bootstrap Admin

Completed locally on 2026-10-29. No deployment, remote resource, email, Git commit, Java edit, frontend edit, or schema-extraction output change.

## Files

- `migrations/0003_new_features.sql`: nullable username with unique `lower(username)` partial index; non-null `must_change_password` default 0; nullable TX/GK/CK assessment type; classroom grade weights default 1/2/3 with cascade deletion; singleton school AI/branding settings seeded without a key, logo, or contact details.
- `src/lib/password.ts`: Web Crypto PBKDF2-SHA256 at exactly 100,000 iterations, random 16-byte salt, 32-byte derived key; canonical Base64 parsing; fixed-length XOR comparison; malformed hashes fail closed; legacy bcrypt verification through bcryptjs without rehashing.
- `tools/seed-admin.mjs`: requires `ADMIN_INITIAL_PASSWORD` in its process environment, reuses the password helper, generates `0004_seed_admin.sql`, and never prints or saves the plaintext password. Requires the available Node 24 runtime, which supports importing the TypeScript helper directly.
- `migrations/0004_seed_admin.sql`: exactly one Admin, deterministic ID `00000000-0000-4000-8000-000000000001`, ACTIVE/LOCAL, forced first password change, hashed password only. `ON CONFLICT DO NOTHING` preserves an existing account, including an Admin whose username/email/password have subsequently changed.
- `package.json`, `package-lock.json`: required production dependency `bcryptjs` 3.0.3.
- `tests/password.test.ts`, `tests/migrations.test.ts`: 11 tests exercising the real password algorithms, real generator process, and all four migrations in real `node:sqlite` databases.

The controller relayed the user's actual Admin email during implementation: `tuananhha1710@gmail.com`. That instruction supersedes the reserved placeholder in the original brief. This address is only the bootstrap account email; `school_settings.contact_email` remains NULL. No email was sent.

## RED → GREEN evidence

1. Wrote both test files before implementation and ran:

   `npm test -- tests/migrations.test.ts tests/password.test.ts`

   RED output in `tools/step2-red-output.log`: migrations failed with `0003_new_features.sql must exist: expected false to be true`; password suite failed with `password helper must exist: expected false to be true`. Test summary: 2 failed files; 7 failed tests, 4 not executed because the helper did not exist.

2. Installed bcryptjs, implemented migrations/helper/generator, and generated the seed using the operator-specified password only through process environment. The generator output was:

   `Generated migrations/0004_seed_admin.sql with a password hash.`

3. The first functional test run passed 11/11. Type checking then identified a Node/Worker global `URL` type mismatch in the new tests. Fixed the root cause by importing `URL` from `node:url`, following the existing schema test.

4. Fresh final verification:

   | Command | Actual result |
   | --- | --- |
   | `npm run typecheck` | Exit 0; `tsc --noEmit` produced no errors. |
   | `npm test -- tests/migrations.test.ts tests/password.test.ts` | Exit 0; password 4/4, migrations 7/7; 2 files and 11 tests passed. |
   | `npm run db:migrate:local` | Exit 0; `0003_new_features.sql`: 8 commands successful; `0004_seed_admin.sql`: 2 commands successful. Existing 0001/0002 had already been applied in step 1. |
   | `npx wrangler d1 execute school-edu-db --local --command 'SELECT username,role,must_change_password FROM users; SELECT id,provider,brand_name,api_key_enc,contact_email FROM school_settings; PRAGMA foreign_key_check;' --json` | Exit 0; all three statements returned `success:true`; results below. |
   | `npm test` | Exit 1; 18 tests passed, contract setup failed, its 12 tests not executed. Details below. |

   Logs: `tools/step2-green-output.log`, `tools/step2-typecheck-output.log`, `tools/step2-d1-migrate-output.log`, `tools/step2-d1-query-output.log`, `tools/step2-suite-output.log`.

The migration test verifies the saved bootstrap hash independently using Node's `pbkdf2Sync`. Following review, it uses the publicly specified bootstrap credential already present in the original contract tests as a test-only default, with an optional `ADMIN_INITIAL_PASSWORD` override. The generator still requires the process variable and has no password literal. The generator's temporary environment was removed in a `finally` block and was not written to an env file. Generator tests also run without that variable to prove missing-password failure and with a separate test-only password to prove successful, non-leaking output. Temporary test cleanup resolves and checks that its target is a direct `school-seed-*` child of the system temporary directory before recursive removal.

Review-fix RED → GREEN: with `ADMIN_INITIAL_PASSWORD` removed, the first run failed exactly one bootstrap hash test because the variable was required (10 passed, 1 failed; `tools/step2-env-red-output.log`). After adding the test-only default, the final targeted run with that variable removed passed all 11 tests. No extra environment setup is required for ordinary test runs.

## Actual local D1 results

```json
[{"username":"Admin","role":"ADMIN","must_change_password":1}]
```

```json
[{"id":1,"provider":"GEMINI","brand_name":"Điểm Sáng","api_key_enc":null,"contact_email":null}]
```

`PRAGMA foreign_key_check` returned `[]`.

## Test coverage and remaining concerns

- Password interoperability is checked independently with Node PBKDF2; correct/wrong passwords, Unicode, independent salts, malformed encoding/length/scheme/iterations, and bcrypt 2a/2b/2y are covered.
- SQLite tests cover username case-insensitive uniqueness and NULLs, forced password change/default/non-null behavior, TX/GK/CK/NULL validation, singleton defaults and provider/strictness checks, editable branding, no per-teacher AI table, grade-weight defaults and cascade/FK integrity, exact single Admin, no plaintext in the seed, and repeat application preserving a changed Admin.
- Full suite: `tests/schema.test.ts` 7/7 and step 2 tests 11/11 passed. `tests/contract.test.ts` failed in its existing `beforeAll` login with `ECONNREFUSED` on `localhost:8787` (both IPv6 and IPv4); its 12 tests did not execute. The runtime/auth routes belong to later steps. No tests were removed or suppressed to change this result.
- `npm install bcryptjs` reported the existing 3 dependency advisories (1 moderate, 2 critical) already recorded in step 1. No unrelated major dependency upgrade was performed.
- Forced password change is stored and tested in the database; enforcement belongs to the auth route in step 4.
- No production Workers runtime or remote D1 verification was performed in this local-only task. The controller's next-step review remains the integration gate.
