CREATE TABLE class_post_likes (
    id UUID PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES class_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_post_user_like UNIQUE (post_id, user_id)
);
