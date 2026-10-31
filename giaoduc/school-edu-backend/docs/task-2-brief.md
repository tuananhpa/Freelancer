# Task 2: Features schema and bootstrap admin

Implement PLAN.md §12 step 2 in D:/Freelancer/giaoduc/school-edu-backend. Read AGENTS.md and docs/PROGRESS.md for global decisions. Source Java is read-only. Do not edit frontend. Do not deploy or create remote resources in this task. Do not spawn subagents. No Git commits: checkout is inside an unrelated parent repo and files are untracked; keep changes in the requested workspace.

## Deliverables

- migrations/0003_new_features.sql: users.username and unique lower(username) partial index; users.must_change_password INTEGER NOT NULL DEFAULT 0; exams.assessment_type TEXT NULL CHECK TX/GK/CK; classroom_grade_weights per PLAN §3; school_settings singleton row global AI settings and editable branding, replacing per-teacher user_ai_settings per user's explicit decision. Fields: id INTEGER PRIMARY KEY CHECK(id=1), provider TEXT GEMINI/OPENAI DEFAULT GEMINI, model TEXT DEFAULT gemini-2.5-flash, api_key_enc TEXT, key_last4 TEXT, strictness TEXT LENIENT/STANDARD/STRICT DEFAULT STANDARD, auto_grade_on_submit INTEGER DEFAULT 1, require_teacher_review INTEGER DEFAULT 1, brand_name TEXT DEFAULT 'Điểm Sáng', logo_url TEXT, contact_email TEXT, contact_phone TEXT, contact_address TEXT, updated_at TEXT NOT NULL. Do not seed any AI key or contact details.
- src/lib/password.ts: export async hashPassword(password:string):Promise<string> and verifyPassword(password:string,hash:string):Promise<boolean>. New PBKDF2-SHA256 hashes, 100000 iterations (Workers cap), random 16-byte salt, 32-byte hash, format pbkdf2_sha256$100000$base64salt$base64hash. Web Crypto only for PBKDF2. Constant-time comparison; malformed hashes fail closed. Verify old bcrypt with bcryptjs dependency, do not rehash here (auth route will).
- tools/seed-admin.mjs: requires ADMIN_INITIAL_PASSWORD environment variable; no password literal in saved script. Generate migrations/0004_seed_admin.sql with PBKDF2 hash matching format above, username Admin, role ADMIN, ACTIVE, LOCAL, must_change_password=1; deterministic UUID '00000000-0000-4000-8000-000000000001'; bootstrap email 'admin@school.invalid' is explicitly an internal reserved placeholder, not a contact email or recipient. Never print password. Do not overwrite a changed existing admin on repeated apply. Only Admin account, no demos.
- tests/migrations.test.ts and tests/password.test.ts: TDD. Test all four migrations in SQLite (node:sqlite): unique username insensitive case, assessment CHECK, singleton settings, cascade grade weights, seed exactly one Admin with no plaintext, verify seed hash with required password, must_change_password. Password: correct/wrong, different salts, malformed inputs, legacy bcrypt.

## Validation

Set ADMIN_INITIAL_PASSWORD to user-specified initial password only in process environment for running seed tool; do not persist plaintext or print env. User specified admin123@. Run npm run typecheck and npm test -- tests/migrations.test.ts tests/password.test.ts. Then npm run db:migrate:local and query SELECT username,role,must_change_password FROM users to confirm. Do not modify schema extraction step 1 outputs.

## Report

Write docs/task-2-report.md with files, actual commands/outputs, RED→GREEN evidence and concerns. Return concise status and summary. Controller will review and gate step 3. Raise unknown contracts rather than inventing behavior.
