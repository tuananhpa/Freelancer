-- Format all existing user full_names to Title Case
UPDATE users 
SET full_name = INITCAP(LOWER(full_name)) 
WHERE full_name IS NOT NULL;

-- Format all student profile full_names to Title Case
UPDATE student_profiles
SET full_name = INITCAP(LOWER(full_name))
WHERE full_name IS NOT NULL;
