CREATE TABLE IF NOT EXISTS mistake_vault_items (
    id UUID PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_type VARCHAR(20) NOT NULL,
    question_id UUID,
    flashcard_id UUID,
    content TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    wrong_answer TEXT,
    skill_tag VARCHAR(50),
    source_title VARCHAR(500),
    wrong_count INT NOT NULL DEFAULT 1,
    repetitions INT NOT NULL DEFAULT 0,
    interval_days INT NOT NULL DEFAULT 1,
    ease_factor DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    next_review_date DATE NOT NULL,
    last_reviewed_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mistake_vault_student_review ON mistake_vault_items(student_id, next_review_date);
CREATE UNIQUE INDEX IF NOT EXISTS uk_mistake_vault_exam_question ON mistake_vault_items(student_id, question_id) WHERE question_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uk_mistake_vault_vocab ON mistake_vault_items(student_id, flashcard_id) WHERE flashcard_id IS NOT NULL;
