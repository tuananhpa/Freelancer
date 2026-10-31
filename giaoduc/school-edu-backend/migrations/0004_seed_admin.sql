-- Bootstrap only: an existing account is never reset by applying this seed again.
INSERT INTO users (id, email, password, full_name, role, status, auth_provider, username, must_change_password, created_at, updated_at)
VALUES ('00000000-0000-4000-8000-000000000001', 'tuananhha1710@gmail.com', 'pbkdf2_sha256$100000$g81qbkEAWGbrawXDijaG0A==$CjIF35D+pEJ92Tf/HuwDOy6+L6TvGAhGJeiZDqplqew=', 'Admin', 'ADMIN', 'ACTIVE', 'LOCAL', 'Admin', 1, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now'))
ON CONFLICT DO NOTHING;
