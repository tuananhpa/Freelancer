-- Add exam_snapshot column to store the point-in-time state of the exam
ALTER TABLE student_exam_results 
ADD COLUMN IF NOT EXISTS exam_snapshot JSONB;
