-- Refactor Assignments to support Classrooms as well as Courses
ALTER TABLE assignments ALTER COLUMN course_id DROP NOT NULL;
ALTER TABLE assignments ADD COLUMN classroom_id UUID REFERENCES classrooms(id);

-- Create class_exams junction table
CREATE TABLE class_exams (
    id UUID PRIMARY KEY,
    classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    open_time TIMESTAMP,
    close_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_class_exams_classroom_id ON class_exams(classroom_id);
CREATE INDEX idx_assignments_classroom_id ON assignments(classroom_id);
