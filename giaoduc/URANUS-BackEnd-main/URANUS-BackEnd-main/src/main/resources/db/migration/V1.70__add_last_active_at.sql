-- V1.67: Add last_active_at to users table for real-time activity tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP NULL;
