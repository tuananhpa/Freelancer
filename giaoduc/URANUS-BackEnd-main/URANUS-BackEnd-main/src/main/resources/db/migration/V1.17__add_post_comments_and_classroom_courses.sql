-- Class post comments
CREATE TABLE IF NOT EXISTS class_post_comments (
    id UUID PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES class_posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_class_post_comments_post ON class_post_comments(post_id);

-- Link courses to classrooms
CREATE TABLE IF NOT EXISTS classroom_courses (
    id UUID PRIMARY KEY,
    classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    linked_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_classroom_course UNIQUE (classroom_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_classroom_courses_classroom ON classroom_courses(classroom_id);
