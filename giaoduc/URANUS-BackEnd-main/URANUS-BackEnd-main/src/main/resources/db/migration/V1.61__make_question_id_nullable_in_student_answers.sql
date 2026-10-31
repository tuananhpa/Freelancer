ALTER TABLE public.student_answers ALTER COLUMN question_id DROP NOT NULL;

ALTER TABLE public.student_answers DROP CONSTRAINT IF EXISTS fk_student_answers_question;

ALTER TABLE public.student_answers
    ADD CONSTRAINT fk_student_answers_question
    FOREIGN KEY (question_id)
    REFERENCES public.questions (id)
    ON DELETE SET NULL;
