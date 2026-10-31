-- Drop the old constraint to allow ON DELETE CASCADE
ALTER TABLE user_activity_log DROP CONSTRAINT IF EXISTS fkg0a6abtwa2f8ofixbxfi2f6yd;

DO 
DECLARE
    fk text;
BEGIN
    -- Drop any other auto-generated constraint for user_id in user_activity_log
    FOR fk IN (SELECT conname FROM pg_constraint WHERE conrelid = 'user_activity_log'::regclass AND confrelid = 'users'::regclass AND contype = 'f') LOOP
        EXECUTE 'ALTER TABLE user_activity_log DROP CONSTRAINT IF EXISTS ' || fk;
    END LOOP;
END ;

-- Add the named constraint with ON DELETE CASCADE
ALTER TABLE user_activity_log ADD CONSTRAINT fk_user_activity_log_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;
