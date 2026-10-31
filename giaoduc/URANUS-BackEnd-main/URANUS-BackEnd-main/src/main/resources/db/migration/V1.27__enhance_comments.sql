-- Add parent_id for nested comments
ALTER TABLE class_post_comments ADD COLUMN parent_id UUID REFERENCES class_post_comments(id) ON DELETE CASCADE;

-- Create class_post_comment_likes table
CREATE TABLE class_post_comment_likes (
    id UUID PRIMARY KEY,
    comment_id UUID NOT NULL REFERENCES class_post_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_comment_user_like UNIQUE (comment_id, user_id)
);
