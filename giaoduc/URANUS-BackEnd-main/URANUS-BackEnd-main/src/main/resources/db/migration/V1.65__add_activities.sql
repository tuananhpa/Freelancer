CREATE TABLE activities (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(280) NOT NULL UNIQUE,
    summary TEXT,
    content TEXT,
    cover_image_url VARCHAR(1000),
    images jsonb,
    category VARCHAR(30) NOT NULL DEFAULT 'NEWS',
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    pinned BOOLEAN NOT NULL DEFAULT FALSE,
    author_id UUID NOT NULL,
    reviewed_by UUID,
    review_note TEXT,
    published_at TIMESTAMP,
    view_count BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_activities_author FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_activities_reviewer FOREIGN KEY (reviewed_by) REFERENCES users (id) ON DELETE SET NULL
);

-- Truy vấn chính của landing page: lọc theo status, ưu tiên bài ghim, mới nhất trước.
CREATE INDEX idx_activities_public ON activities (status, pinned DESC, published_at DESC);
CREATE INDEX idx_activities_category ON activities (category);
