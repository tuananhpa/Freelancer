-- De thi dang Phieu tra loi (ANSWER_SHEET, vd bai nghe) can gan 1 file am
-- thanh cho ca de, tuong tu pdf_url. Them cot moi kieu TEXT ngay tu dau, va
-- mo rong luon pdf_url (dang varchar(255), cung loi "value too long" nhu
-- resource_url/thumbnail_url da gap truoc day voi URL Cloudinary dai).
ALTER TABLE exams ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE exams ALTER COLUMN pdf_url TYPE TEXT;
