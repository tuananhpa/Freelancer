-- Nhip 2: go module Hop thu (tin nhan 1-1) sau khi thay bang chat ho tro.
--
-- KHONG xoa thang: sao luu toan bo sang messages_archived truoc roi moi drop.
-- Ly do: khong kiem tra duoc truoc production con bao nhieu tin nhan that giua
-- giao vien va hoc vien, va du lieu da xoa thi khong lay lai duoc. Ban archive
-- giu nguyen noi dung de con doi chieu hoac khoi phuc.
--
-- Khi da chac chan khong con can, xoa bang archive bang mot migration rieng:
--   DROP TABLE IF EXISTS messages_archived;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'messages'
    ) THEN
        EXECUTE 'CREATE TABLE IF NOT EXISTS messages_archived AS TABLE messages';
        EXECUTE 'DROP TABLE messages';
    END IF;
END $$;
