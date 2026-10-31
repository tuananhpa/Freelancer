-- Safely drop all existing foreign keys for tables that block exam deletion
DO $$
DECLARE
    fk text;
BEGIN
    -- draft_answers -> question_options
    FOR fk IN (SELECT conname FROM pg_constraint WHERE conrelid = 'draft_answers'::regclass AND confrelid = 'question_options'::regclass AND contype = 'f') LOOP
        EXECUTE 'ALTER TABLE draft_answers DROP CONSTRAINT ' || fk;
    END LOOP;

    -- draft_answers -> questions
    FOR fk IN (SELECT conname FROM pg_constraint WHERE conrelid = 'draft_answers'::regclass AND confrelid = 'questions'::regclass AND contype = 'f') LOOP
        EXECUTE 'ALTER TABLE draft_answers DROP CONSTRAINT ' || fk;
    END LOOP;

    -- draft_answers -> student_exam_results
    FOR fk IN (SELECT conname FROM pg_constraint WHERE conrelid = 'draft_answers'::regclass AND confrelid = 'student_exam_results'::regclass AND contype = 'f') LOOP
        EXECUTE 'ALTER TABLE draft_answers DROP CONSTRAINT ' || fk;
    END LOOP;

    -- question_groups -> exams
    FOR fk IN (SELECT conname FROM pg_constraint WHERE conrelid = 'question_groups'::regclass AND confrelid = 'exams'::regclass AND contype = 'f') LOOP
        EXECUTE 'ALTER TABLE question_groups DROP CONSTRAINT ' || fk;
    END LOOP;

    -- questions -> exams
    FOR fk IN (SELECT conname FROM pg_constraint WHERE conrelid = 'questions'::regclass AND confrelid = 'exams'::regclass AND contype = 'f') LOOP
        EXECUTE 'ALTER TABLE questions DROP CONSTRAINT ' || fk;
    END LOOP;

    -- question_options -> questions
    FOR fk IN (SELECT conname FROM pg_constraint WHERE conrelid = 'question_options'::regclass AND confrelid = 'questions'::regclass AND contype = 'f') LOOP
        EXECUTE 'ALTER TABLE question_options DROP CONSTRAINT ' || fk;
    END LOOP;
END $$;

-- Re-add the constraints with ON DELETE CASCADE to allow deleting an exam and cascading the deletions
ALTER TABLE draft_answers
  ADD CONSTRAINT fk_draft_answers_option FOREIGN KEY (selected_option_id) REFERENCES question_options(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_draft_answers_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_draft_answers_result FOREIGN KEY (result_id) REFERENCES student_exam_results(id) ON DELETE CASCADE;

ALTER TABLE question_groups
  ADD CONSTRAINT fk_question_groups_exam FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE;

ALTER TABLE questions
  ADD CONSTRAINT fk_questions_exam FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE;

ALTER TABLE question_options
  ADD CONSTRAINT fk_question_options_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE;
