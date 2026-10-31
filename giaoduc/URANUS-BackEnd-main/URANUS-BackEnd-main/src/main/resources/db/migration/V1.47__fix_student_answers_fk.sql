DO $$
DECLARE
    fk_name text;
BEGIN
    -- Drop all foreign keys from student_answers to question_options
    FOR fk_name IN (
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'student_answers'::regclass
          AND confrelid = 'question_options'::regclass
          AND contype = 'f'
    ) LOOP
        EXECUTE 'ALTER TABLE student_answers DROP CONSTRAINT ' || fk_name;
    END LOOP;
    
    -- Drop all foreign keys from student_answers to questions
    FOR fk_name IN (
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'student_answers'::regclass
          AND confrelid = 'questions'::regclass
          AND contype = 'f'
    ) LOOP
        EXECUTE 'ALTER TABLE student_answers DROP CONSTRAINT ' || fk_name;
    END LOOP;
END $$;

-- Recreate foreign keys with ON DELETE policies
ALTER TABLE student_answers 
  ADD CONSTRAINT fk_student_answers_option FOREIGN KEY (selected_option_id) REFERENCES question_options(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_student_answers_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE;
