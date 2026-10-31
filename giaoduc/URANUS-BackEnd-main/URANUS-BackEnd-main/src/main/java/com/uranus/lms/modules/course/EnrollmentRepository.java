package com.uranus.lms.modules.course;

import com.uranus.lms.modules.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, UUID> {
    Page<Enrollment> findByStudent(User student, Pageable pageable);
    long countByStudent(User student);
    Optional<Enrollment> findByStudentAndCourse(User student, Course course);
    boolean existsByStudentAndCourse(User student, Course course);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(DISTINCT e.student) FROM Enrollment e WHERE e.course.teacher = :teacher")
    long countDistinctStudentByCourseTeacher(@org.springframework.data.repository.query.Param("teacher") User teacher);

    @org.springframework.data.jpa.repository.Query(value = "SELECT TO_CHAR(e.enrolled_at, 'YYYY-MM') as month, COUNT(*) as count " +
                   "FROM enrollments e JOIN courses c ON e.course_id = c.id " +
                   "WHERE c.teacher_id = :teacherId " +
                   "GROUP BY TO_CHAR(e.enrolled_at, 'YYYY-MM') " +
                   "ORDER BY month", nativeQuery = true)
    java.util.List<Object[]> countEnrollmentsByMonthForTeacher(@org.springframework.data.repository.query.Param("teacherId") java.util.UUID teacherId);
}
