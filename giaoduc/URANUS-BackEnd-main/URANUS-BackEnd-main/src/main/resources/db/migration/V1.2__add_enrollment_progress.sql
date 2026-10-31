CREATE TABLE enrollments (
    id UUID PRIMARY KEY,
    student_id UUID NOT NULL,
    course_id UUID NOT NULL,
    enrolled_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_enrollment_student_course UNIQUE (student_id, course_id),
    CONSTRAINT fk_enrollment_student FOREIGN KEY (student_id) REFERENCES users(id),
    CONSTRAINT fk_enrollment_course FOREIGN KEY (course_id) REFERENCES courses(id)
);

CREATE TABLE lesson_progress (
    id UUID PRIMARY KEY,
    student_id UUID NOT NULL,
    lesson_id UUID NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMP,
    CONSTRAINT uk_lessonprogress_student_lesson UNIQUE (student_id, lesson_id),
    CONSTRAINT fk_lessonprogress_student FOREIGN KEY (student_id) REFERENCES users(id),
    CONSTRAINT fk_lessonprogress_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id)
);
