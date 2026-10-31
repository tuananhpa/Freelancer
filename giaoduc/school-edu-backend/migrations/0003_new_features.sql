ALTER TABLE users ADD COLUMN username TEXT;
CREATE UNIQUE INDEX ux_users_username ON users (lower(username)) WHERE username IS NOT NULL;
ALTER TABLE users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0;
ALTER TABLE exams ADD COLUMN assessment_type TEXT CHECK (assessment_type IN ('TX','GK','CK'));

CREATE TABLE classroom_grade_weights (
  classroom_id TEXT PRIMARY KEY NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  w_tx REAL NOT NULL DEFAULT 1,
  w_gk REAL NOT NULL DEFAULT 2,
  w_ck REAL NOT NULL DEFAULT 3
);

CREATE TABLE school_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  provider TEXT NOT NULL DEFAULT 'GEMINI' CHECK (provider IN ('GEMINI','OPENAI')),
  model TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
  api_key_enc TEXT,
  key_last4 TEXT,
  strictness TEXT NOT NULL DEFAULT 'STANDARD' CHECK (strictness IN ('LENIENT','STANDARD','STRICT')),
  auto_grade_on_submit INTEGER NOT NULL DEFAULT 1,
  require_teacher_review INTEGER NOT NULL DEFAULT 1,
  brand_name TEXT NOT NULL DEFAULT 'Điểm Sáng',
  logo_url TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  contact_address TEXT,
  updated_at TEXT NOT NULL
);

INSERT INTO school_settings (id, updated_at) VALUES (1, strftime('%Y-%m-%dT%H:%M:%fZ','now'));
