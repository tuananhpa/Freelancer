ALTER TABLE content_resources
    ADD COLUMN writing_prompt TEXT;

CREATE TABLE resource_submissions (
    id UUID PRIMARY KEY,
    resource_id UUID NOT NULL REFERENCES content_resources(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT,
    score DOUBLE PRECISION,
    feedback TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    graded_at TIMESTAMP,
    graded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uk_resource_submission_student UNIQUE (resource_id, student_id)
);

CREATE INDEX idx_resource_submissions_resource ON resource_submissions(resource_id);
CREATE INDEX idx_resource_submissions_student ON resource_submissions(student_id);
