package com.uranus.lms.modules.assignment;

import com.uranus.lms.modules.course.Course;
import com.uranus.lms.modules.classroom.Classroom;
import com.uranus.lms.modules.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, UUID> {
    Page<Assignment> findByCourse(Course course, Pageable pageable);
    Page<Assignment> findByClassroom(Classroom classroom, Pageable pageable);
    Page<Assignment> findByTeacher(User teacher, Pageable pageable);

    /** Bài tập của lớp có dueDate trong tương lai (chưa quá hạn) */
    List<Assignment> findByClassroomAndDueDateAfter(Classroom classroom, LocalDateTime now);

    /** Bài tập của lớp có dueDate trong khoảng [now, deadline] */
    @Query("SELECT a FROM Assignment a WHERE a.classroom.id = :classroomId AND a.dueDate IS NOT NULL AND a.dueDate > :now ORDER BY a.dueDate ASC")
    List<Assignment> findUpcomingByClassroomId(@Param("classroomId") UUID classroomId, @Param("now") LocalDateTime now);

    /** Deadline gần nhất của lớp */
    @Query("SELECT MIN(a.dueDate) FROM Assignment a WHERE a.classroom.id = :classroomId AND a.dueDate > :now")
    Optional<LocalDateTime> findNearestDueDateByClassroomId(@Param("classroomId") UUID classroomId, @Param("now") LocalDateTime now);

    /** Đếm số bài tập còn hạn của lớp mà học sinh chưa nộp */
    @Query("SELECT COUNT(a) FROM Assignment a WHERE a.classroom.id = :classroomId AND a.dueDate IS NOT NULL AND a.dueDate > :now AND a.dueDate <= :deadline AND NOT EXISTS (SELECT s FROM AssignmentSubmission s WHERE s.assignment = a AND s.student.id = :userId)")
    long countPendingForStudent(@Param("classroomId") UUID classroomId, @Param("userId") UUID userId, @Param("now") LocalDateTime now, @Param("deadline") LocalDateTime deadline);

    /** Danh sách bài tập còn hạn của lớp mà học sinh chưa nộp (sắp xếp tăng dần theo dueDate) */
    @Query("SELECT a FROM Assignment a WHERE a.classroom.id = :classroomId AND a.dueDate IS NOT NULL AND a.dueDate > :now AND NOT EXISTS (SELECT s FROM AssignmentSubmission s WHERE s.assignment = a AND s.student.id = :userId) ORDER BY a.dueDate ASC")
    List<Assignment> findPendingForStudent(@Param("classroomId") UUID classroomId, @Param("userId") UUID userId, @Param("now") LocalDateTime now);

    /** Đếm tổng số bài tập đang mở (chưa quá hạn) của lớp */
    @Query("SELECT COUNT(a) FROM Assignment a WHERE a.classroom.id = :classroomId AND (a.dueDate IS NULL OR a.dueDate > :now)")
    long countActiveByClassroomId(@Param("classroomId") UUID classroomId, @Param("now") LocalDateTime now);

    /** Tìm các bài tập sắp hết hạn trong khoảng [now, threshold] */
    @Query("SELECT a FROM Assignment a WHERE a.dueDate IS NOT NULL AND a.dueDate > :now AND a.dueDate <= :threshold")
    List<Assignment> findAllDueBetween(@Param("now") LocalDateTime now, @Param("threshold") LocalDateTime threshold);
}

