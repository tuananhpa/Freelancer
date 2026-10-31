-- V1.83: Add AI Writing Assessment System tables and assignment writing configuration columns

-- 1. Extend assignments table with writing task parameters
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS assignment_type VARCHAR(30) DEFAULT 'WRITING';
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS instructions TEXT;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS min_word_count INT;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS max_word_count INT;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS expected_answer TEXT;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS language_level VARCHAR(10);
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS rubric_config TEXT;

-- 2. Create writing_assessments table
CREATE TABLE IF NOT EXISTS writing_assessments (
    id UUID PRIMARY KEY,
    submission_id UUID NOT NULL UNIQUE,
    assignment_id UUID NOT NULL,
    student_id UUID NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'NOT_GRADED',
    overall_score DOUBLE PRECISION,
    max_score DOUBLE PRECISION,
    word_count INT,
    expected_level VARCHAR(20),
    estimated_level VARCHAR(20),
    original_ai_result_json TEXT,
    current_result_json TEXT,
    version INT NOT NULL DEFAULT 1,
    ai_model VARCHAR(50),
    prompt_version VARCHAR(20),
    schema_version VARCHAR(20) DEFAULT '1.0',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    last_edited_at TIMESTAMP,
    last_edited_by UUID,
    CONSTRAINT fk_writing_assessments_submission FOREIGN KEY (submission_id) REFERENCES assignment_submissions (id) ON DELETE CASCADE,
    CONSTRAINT fk_writing_assessments_assignment FOREIGN KEY (assignment_id) REFERENCES assignments (id) ON DELETE CASCADE,
    CONSTRAINT fk_writing_assessments_student FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_writing_assessments_editor FOREIGN KEY (last_edited_by) REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_writing_assessments_assignment ON writing_assessments (assignment_id);
CREATE INDEX IF NOT EXISTS idx_writing_assessments_student ON writing_assessments (student_id);
CREATE INDEX IF NOT EXISTS idx_writing_assessments_status ON writing_assessments (status);

-- 3. Create writing_assessment_versions table for audit trail & version preservation
CREATE TABLE IF NOT EXISTS writing_assessment_versions (
    id UUID PRIMARY KEY,
    assessment_id UUID NOT NULL,
    version INT NOT NULL,
    source VARCHAR(20) NOT NULL, -- 'AI' or 'TEACHER'
    result_json TEXT NOT NULL,
    overall_score DOUBLE PRECISION,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    note TEXT,
    CONSTRAINT fk_writing_versions_assessment FOREIGN KEY (assessment_id) REFERENCES writing_assessments (id) ON DELETE CASCADE,
    CONSTRAINT fk_writing_versions_creator FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_writing_versions_assessment ON writing_assessment_versions (assessment_id, version);
