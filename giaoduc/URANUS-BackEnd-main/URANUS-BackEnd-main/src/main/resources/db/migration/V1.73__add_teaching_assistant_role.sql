ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role::text = ANY (ARRAY['ADMIN'::text, 'TEACHER'::text, 'STUDENT'::text, 'OFFICE'::text, 'TEACHING_ASSISTANT'::text]));
