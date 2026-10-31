CREATE TABLE IF NOT EXISTS question_groups (
    id UUID PRIMARY KEY,
    exam_id UUID NOT NULL,
    group_title TEXT,
    passage_text TEXT,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP
);

ALTER TABLE questions ADD COLUMN IF NOT EXISTS sheet_answer_type VARCHAR(20);
ALTER TABLE questions ADD COLUMN IF NOT EXISTS group_id UUID;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS explanation TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS image_url VARCHAR(255);

ALTER TABLE student_exam_results ADD COLUMN IF NOT EXISTS notify_email VARCHAR(255);
