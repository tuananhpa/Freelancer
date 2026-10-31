-- V1.64__migrate_visibility.sql

-- 1. Thêm cột visibility và access_code cho bảng exams (nếu chưa có)
ALTER TABLE exams ADD COLUMN IF NOT EXISTS visibility VARCHAR(20);
ALTER TABLE exams ADD COLUMN IF NOT EXISTS access_code VARCHAR(100);

-- Migrate data cho exams: chuyển từ is_public sang visibility
UPDATE exams 
SET visibility = CASE 
    WHEN is_public = true THEN 'PUBLIC'
    WHEN is_public = false THEN 'HIDDEN'
    ELSE 'PUBLIC'
END
WHERE visibility IS NULL;

-- 2. Thêm cột visibility và access_code cho bảng flashcard_decks (nếu chưa có)
ALTER TABLE flashcard_decks ADD COLUMN IF NOT EXISTS visibility VARCHAR(20);
ALTER TABLE flashcard_decks ADD COLUMN IF NOT EXISTS access_code VARCHAR(100);

-- Migrate data cho flashcard_decks: 
-- Vì bảng flashcard_decks có thể không có cột is_public (tùy version schema hiện tại), ta dùng khối DO để kiểm tra an toàn.
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcard_decks' AND column_name='is_public') THEN
    EXECUTE 'UPDATE flashcard_decks 
    SET visibility = CASE 
        WHEN is_public = true THEN ''PUBLIC''
        WHEN is_public = false THEN ''HIDDEN''
        ELSE ''PUBLIC''
    END
    WHERE visibility IS NULL';
  ELSE
    UPDATE flashcard_decks SET visibility = 'PUBLIC' WHERE visibility IS NULL;
  END IF;
END $$;
