-- Chu de trong lop truoc day chi co mot cap phang. Them parent_id de long nhieu
-- cap, vi du: CHUONG I - DAO DONG / BAI 01 - DAO DONG DIEU HOA / LUYEN TAP.
--
-- Bang class_folders khong duoc tao boi migration nao trong repo (co tu truoc khi
-- Flyway quan ly), nen dung IF NOT EXISTS de chay duoc tren moi moi truong.
ALTER TABLE class_folders ADD COLUMN IF NOT EXISTS parent_id UUID;

-- ON DELETE CASCADE: xoa mot chu de cha thi cac chu de con ben trong bi xoa theo.
-- Bai tap KHONG bi xoa - chung chi mat lien ket va roi ve muc "Chua phan loai",
-- dung nhu hanh vi cu khi xoa mot chu de phang.
ALTER TABLE class_folders DROP CONSTRAINT IF EXISTS fk_class_folders_parent;
ALTER TABLE class_folders
    ADD CONSTRAINT fk_class_folders_parent
    FOREIGN KEY (parent_id) REFERENCES class_folders(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_class_folders_parent ON class_folders(parent_id);
