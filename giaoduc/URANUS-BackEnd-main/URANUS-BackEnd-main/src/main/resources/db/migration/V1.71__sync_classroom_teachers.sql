-- V1.68: Synchronize classroom teacher_id from class_members where admin created the class
UPDATE classrooms c
SET teacher_id = sub.user_id
FROM (
    SELECT DISTINCT ON (cm.classroom_id) cm.classroom_id, cm.user_id
    FROM class_members cm
    JOIN users u ON cm.user_id = u.id
    WHERE cm.role = 'TEACHER'
    ORDER BY cm.classroom_id, (u.role = 'TEACHER') DESC, cm.joined_at ASC
) sub
WHERE c.id = sub.classroom_id
  AND (
      c.teacher_id IS NULL 
      OR c.teacher_id IN (SELECT id FROM users WHERE role IN ('ADMIN', 'OFFICE'))
      OR c.teacher_id NOT IN (SELECT cm2.user_id FROM class_members cm2 WHERE cm2.classroom_id = c.id AND cm2.role = 'TEACHER')
  );
