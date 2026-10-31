-- Add pending_student_code to users table
ALTER TABLE users ADD COLUMN pending_student_code VARCHAR(20);

-- Make user_id in student_profiles unique
ALTER TABLE student_profiles ADD CONSTRAINT uk_student_profiles_user_id UNIQUE (user_id);
