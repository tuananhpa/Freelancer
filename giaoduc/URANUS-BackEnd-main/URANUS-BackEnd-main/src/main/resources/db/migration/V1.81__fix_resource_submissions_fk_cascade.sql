-- Tren production, cot resource_submissions.resource_id dang co mot rang
-- buoc khoa ngoai KHONG co ON DELETE CASCADE (ten dang hash kieu Hibernate
-- tu sinh, khac voi constraint V1.80 da tao) - khien giao vien khong xoa
-- duoc tai nguyen da co hoc sinh nop bai (loi 500). Xoa moi FK tren
-- resource_id/student_id/graded_by va tao lai dung hanh vi mong muon.
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'resource_submissions'::regclass
          AND contype = 'f'
    LOOP
        EXECUTE format('ALTER TABLE resource_submissions DROP CONSTRAINT %I', r.conname);
    END LOOP;
END $$;

ALTER TABLE resource_submissions
    ADD CONSTRAINT resource_submissions_resource_id_fkey
        FOREIGN KEY (resource_id) REFERENCES content_resources(id) ON DELETE CASCADE,
    ADD CONSTRAINT resource_submissions_student_id_fkey
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    ADD CONSTRAINT resource_submissions_graded_by_fkey
        FOREIGN KEY (graded_by) REFERENCES users(id) ON DELETE SET NULL;
