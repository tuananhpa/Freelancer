DO $$
DECLARE
    fk_name text;
BEGIN
    -- Drop all foreign keys from student_exam_results to exams
    FOR fk_name IN (
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'student_exam_results'::regclass
          AND confrelid = 'exams'::regclass
          AND contype = 'f'
    ) LOOP
        EXECUTE 'ALTER TABLE student_exam_results DROP CONSTRAINT ' || fk_name;
    END LOOP;
    
    -- Drop all foreign keys from student_answers to student_exam_results
    FOR fk_name IN (
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'student_answers'::regclass
          AND confrelid = 'student_exam_results'::regclass
          AND contype = 'f'
    ) LOOP
        EXECUTE 'ALTER TABLE student_answers DROP CONSTRAINT ' || fk_name;
    END LOOP;
END $$;

-- Recreate foreign keys with ON DELETE CASCADE policies
ALTER TABLE student_exam_results 
  ADD CONSTRAINT fk_student_exam_results_exam FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE;

ALTER TABLE student_answers 
  ADD CONSTRAINT fk_student_answers_result FOREIGN KEY (result_id) REFERENCES student_exam_results(id) ON DELETE CASCADE;
