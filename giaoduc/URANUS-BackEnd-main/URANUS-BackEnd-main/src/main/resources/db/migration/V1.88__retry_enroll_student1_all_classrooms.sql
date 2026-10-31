-- V1.87 khong bao phu het lop (thieu Tieng Anh 10/11 cua Chau Nguyen Hoang An).
-- Thu lai voi dieu kien status noi long hon (trim + khong phan biet hoa/thuong,
-- phong truong hop status bi khoang trang thua hoac sai hoa/thuong) va bo qua
-- rieng dieu kien status neu no NULL (coi nhu ACTIVE, vi cot co DEFAULT 'ACTIVE'
-- tu luc tao bang nhung van co the co du lieu cu khong dung default).
DO $$
DECLARE
  v_user_id UUID;
  v_profile_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM users WHERE email = 'student1@uranus.com';

  IF v_user_id IS NOT NULL THEN
    SELECT id INTO v_profile_id FROM student_profiles WHERE user_id = v_user_id;

    IF v_profile_id IS NOT NULL THEN
      INSERT INTO student_class_enrollments (id, student_profile_id, classroom_id, created_at)
      SELECT gen_random_uuid(), v_profile_id, c.id, now()
      FROM classrooms c
      WHERE (c.status IS NULL OR UPPER(TRIM(c.status)) = 'ACTIVE')
        AND NOT EXISTS (
          SELECT 1 FROM student_class_enrollments sce
          WHERE sce.student_profile_id = v_profile_id AND sce.classroom_id = c.id
        );
    END IF;

    INSERT INTO class_members (id, classroom_id, user_id, role, joined_at)
    SELECT gen_random_uuid(), c.id, v_user_id, 'STUDENT', now()
    FROM classrooms c
    WHERE (c.status IS NULL OR UPPER(TRIM(c.status)) = 'ACTIVE')
      AND NOT EXISTS (
        SELECT 1 FROM class_members cm
        WHERE cm.classroom_id = c.id AND cm.user_id = v_user_id
      );
  END IF;
END $$;
