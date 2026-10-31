-- Drop the generated Hibernate foreign keys AGAIN because Flyway V1.59 ran BEFORE the Java code explicitly named the constraints,
-- meaning Hibernate might have recreated random hash constraints (e.g. fki43f5sx7firgb48quv4qq99ch) after V1.59 dropped them.
-- Now that the Java code explicitly names the constraints, dropping them here will permanently remove them!

DO $$
DECLARE
    fk text;
BEGIN
    -- For draft_answers
    FOR fk IN (SELECT conname FROM pg_constraint WHERE conrelid = 'draft_answers'::regclass AND contype = 'f' AND conname NOT LIKE 'fk_draft_answers_%') LOOP
        EXECUTE 'ALTER TABLE draft_answers DROP CONSTRAINT IF EXISTS ' || fk;
    END LOOP;

    -- For question_groups
    FOR fk IN (SELECT conname FROM pg_constraint WHERE conrelid = 'question_groups'::regclass AND contype = 'f' AND conname NOT LIKE 'fk_question_groups_%') LOOP
        EXECUTE 'ALTER TABLE question_groups DROP CONSTRAINT IF EXISTS ' || fk;
    END LOOP;

    -- For questions
    FOR fk IN (SELECT conname FROM pg_constraint WHERE conrelid = 'questions'::regclass AND contype = 'f' AND conname NOT LIKE 'fk_questions_%') LOOP
        EXECUTE 'ALTER TABLE questions DROP CONSTRAINT IF EXISTS ' || fk;
    END LOOP;

    -- For question_options
    FOR fk IN (SELECT conname FROM pg_constraint WHERE conrelid = 'question_options'::regclass AND contype = 'f' AND conname NOT LIKE 'fk_question_options_%') LOOP
        EXECUTE 'ALTER TABLE question_options DROP CONSTRAINT IF EXISTS ' || fk;
    END LOOP;
END $$;
