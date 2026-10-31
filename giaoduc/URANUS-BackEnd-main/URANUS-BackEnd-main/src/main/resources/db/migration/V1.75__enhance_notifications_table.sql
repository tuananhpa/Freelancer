-- Migration V1.75: Enhance notifications table with type, actor, entity references and indices
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'SYSTEM',
ADD COLUMN IF NOT EXISTS actor_id UUID NULL,
ADD COLUMN IF NOT EXISTS actor_name VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS actor_avatar VARCHAR(500) NULL,
ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50) NULL,
ADD COLUMN IF NOT EXISTS entity_id VARCHAR(255) NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_dedup ON notifications(user_id, entity_type, entity_id, type);
