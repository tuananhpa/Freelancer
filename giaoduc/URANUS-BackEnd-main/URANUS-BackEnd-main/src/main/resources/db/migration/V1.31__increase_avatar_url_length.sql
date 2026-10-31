-- Increase avatar_url column length to accommodate long Cloudinary URLs (default 255 is too short)
ALTER TABLE public.users ALTER COLUMN avatar_url TYPE VARCHAR(1000);
