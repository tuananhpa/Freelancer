ALTER TABLE public.classrooms ADD COLUMN IF NOT EXISTS is_admin_group boolean DEFAULT false;
