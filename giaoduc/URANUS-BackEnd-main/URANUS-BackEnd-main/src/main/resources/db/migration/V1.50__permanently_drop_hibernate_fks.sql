-- Drop the generated Hibernate foreign keys AGAIN because Flyway V1.49 ran BEFORE the Java code fix,
-- meaning Hibernate recreated them after V1.49 dropped them.
-- Now that the Java code explicitly names the constraints, dropping them here will permanently remove them!

ALTER TABLE student_answers DROP CONSTRAINT IF EXISTS fk8dhrgyyw99oyj0q650s1x2xo3;
ALTER TABLE student_exam_results DROP CONSTRAINT IF EXISTS fksqsdqb9r24js1ylry8bg78ybu;

-- Just to be absolutely safe, let's also remove any other weird hash constraints that might have been recreated.
DO $$
DECLARE
    fk text;
BEGIN
    FOR fk IN (SELECT conname FROM pg_constraint WHERE conrelid = 'student_answers'::regclass AND confrelid = 'questions'::regclass AND contype = 'f' AND conname NOT LIKE 'fk_student_answers_%') LOOP
        EXECUTE 'ALTER TABLE student_answers DROP CONSTRAINT IF EXISTS ' || fk;
    END LOOP;
    
    FOR fk IN (SELECT conname FROM pg_constraint WHERE conrelid = 'student_answers'::regclass AND confrelid = 'student_exam_results'::regclass AND contype = 'f' AND conname NOT LIKE 'fk_student_answers_%') LOOP
        EXECUTE 'ALTER TABLE student_answers DROP CONSTRAINT IF EXISTS ' || fk;
    END LOOP;
END $$;
