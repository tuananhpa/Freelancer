-- lessons.resource_url va courses.thumbnail_url deu la VARCHAR(255).
-- URL that (Cloudinary co token ky, hoac YouTube kem tham so) rat de vuot
-- qua 255 ky tu, khi do UPDATE nem "value too long for type character
-- varying(255)" va nguoi dung khong luu duoc bai hoc/anh bia.
-- Doi sang TEXT (khong gioi han) giong cach content/description da lam.
ALTER TABLE lessons ALTER COLUMN resource_url TYPE TEXT;
ALTER TABLE courses ALTER COLUMN thumbnail_url TYPE TEXT;
