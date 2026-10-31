-- Make teacher_id nullable in classrooms table to support admin groups
ALTER TABLE classrooms ALTER COLUMN teacher_id DROP NOT NULL;
