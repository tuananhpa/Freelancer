DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT 
            c.conname AS constraint_name,
            c.conrelid::regclass::text AS table_name
        FROM pg_constraint c
        WHERE c.confrelid = 'users'::regclass
          AND c.contype = 'f'
    LOOP
        EXECUTE 'ALTER TABLE ' || r.table_name || ' DROP CONSTRAINT ' || r.constraint_name;
        
        -- Since we know all these tables reference users(id), we can easily recreate them
        -- We just need the local column name. We can get it from pg_attribute.
        DECLARE
            col_name text;
        BEGIN
            SELECT a.attname INTO col_name
            FROM pg_attribute a
            JOIN pg_constraint c2 ON c2.conname = r.constraint_name
            WHERE a.attnum = ANY(c2.conkey) AND a.attrelid = c2.conrelid;
            
            EXECUTE 'ALTER TABLE ' || r.table_name || 
                    ' ADD CONSTRAINT ' || r.constraint_name || 
                    ' FOREIGN KEY (' || col_name || ') REFERENCES users(id) ON DELETE CASCADE';
        END;
    END LOOP;
END;
$$;
