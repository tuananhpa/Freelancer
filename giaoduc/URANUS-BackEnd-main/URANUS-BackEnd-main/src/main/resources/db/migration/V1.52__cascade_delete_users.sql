DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT
            tc.table_name,
            tc.constraint_name,
            kcu.column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE constraint_type = 'FOREIGN KEY'
          AND ccu.table_name = 'users'
          AND ccu.column_name = 'id'
    LOOP
        -- Check if it already has ON DELETE CASCADE (optional, but good practice)
        -- Actually, just drop and recreate is fine.
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.table_name) ||
                ' DROP CONSTRAINT ' || quote_ident(r.constraint_name);

        EXECUTE 'ALTER TABLE public.' || quote_ident(r.table_name) ||
                ' ADD CONSTRAINT ' || quote_ident(r.constraint_name) ||
                ' FOREIGN KEY (' || quote_ident(r.column_name) || ') REFERENCES public.users(id) ON DELETE CASCADE';
    END LOOP;
END;
$$;
