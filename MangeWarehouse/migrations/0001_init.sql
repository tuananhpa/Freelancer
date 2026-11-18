-- Accounts: no public sign-up. The first owner is created with the SETUP_CODE secret; after that only owner / nhaplieu create accounts.
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'nhaplieu', 'staff')),
  employee_id TEXT,
  pass_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_by TEXT,
  created_at INTEGER NOT NULL
);

-- token = SHA-256 of the cookie value, so a database leak does not leak live sessions.
CREATE TABLE sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires INTEGER NOT NULL,
  remember INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX sessions_user ON sessions(user_id);

CREATE TABLE login_fail (username TEXT PRIMARY KEY, count INTEGER NOT NULL, until INTEGER NOT NULL DEFAULT 0);

-- Factory data, one row per record (order, task, message…). ver grows on every write so clients pull only what changed.
CREATE TABLE records (
  col TEXT NOT NULL,
  id TEXT NOT NULL,
  data TEXT,
  ver INTEGER NOT NULL,
  del INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (col, id)
);
CREATE INDEX records_ver ON records(ver);

CREATE TABLE kv (k TEXT PRIMARY KEY, v INTEGER NOT NULL);
INSERT INTO kv (k, v) VALUES ('ver', 0);

CREATE TABLE photos (id TEXT PRIMARY KEY, type TEXT NOT NULL, data BLOB NOT NULL, created_by TEXT, created_at INTEGER NOT NULL);
