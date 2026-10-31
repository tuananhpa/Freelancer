CREATE TABLE lesson_comments (
    id UUID PRIMARY KEY,
    content VARCHAR(1000) NOT NULL,
    lesson_id UUID NOT NULL,
    user_id UUID NOT NULL,
    parent_id UUID,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_lesson_comments_lesson FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE,
    CONSTRAINT fk_lesson_comments_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_lesson_comments_parent FOREIGN KEY (parent_id) REFERENCES lesson_comments (id) ON DELETE CASCADE
);
