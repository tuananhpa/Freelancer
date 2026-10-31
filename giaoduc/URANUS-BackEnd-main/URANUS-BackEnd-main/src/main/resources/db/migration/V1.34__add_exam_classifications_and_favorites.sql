ALTER TABLE exams
    ADD COLUMN subject VARCHAR(255),
    ADD COLUMN grade VARCHAR(255);

CREATE TABLE user_favorite_exams (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    exam_id UUID NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_favorite_exam_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_favorite_exam_exam FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    CONSTRAINT uq_user_favorite_exam UNIQUE (user_id, exam_id)
);
