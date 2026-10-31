-- Drop the old unique constraint
ALTER TABLE attendances DROP CONSTRAINT IF EXISTS uq_attendance;

-- Add new columns for week_number and session_number
ALTER TABLE attendances ADD COLUMN week_number INT NOT NULL DEFAULT 1;
ALTER TABLE attendances ADD COLUMN session_number INT NOT NULL DEFAULT 1;

-- Add the new unique constraint
ALTER TABLE attendances ADD CONSTRAINT uq_attendance_week_session UNIQUE (classroom_id, student_id, week_number, session_number);
