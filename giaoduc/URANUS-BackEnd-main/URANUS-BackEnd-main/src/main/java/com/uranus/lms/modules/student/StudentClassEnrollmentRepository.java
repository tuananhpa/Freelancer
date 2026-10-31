package com.uranus.lms.modules.student;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StudentClassEnrollmentRepository extends JpaRepository<StudentClassEnrollment, UUID> {
    List<StudentClassEnrollment> findByStudentProfile(StudentProfile studentProfile);

    @Query("""
            SELECT e FROM StudentClassEnrollment e
            JOIN FETCH e.classroom c
            LEFT JOIN FETCH c.teacher
            WHERE e.studentProfile = :profile
            """)
    List<StudentClassEnrollment> findByStudentProfileWithClassroom(@Param("profile") StudentProfile profile);

    boolean existsByStudentProfileAndClassroom_Id(StudentProfile studentProfile, UUID classroomId);

    @Query("""
            SELECT e FROM StudentClassEnrollment e
            JOIN FETCH e.studentProfile sp
            WHERE e.classroom.id = :classroomId
            ORDER BY sp.fullName ASC
            """)
    List<StudentClassEnrollment> findByClassroomId(@Param("classroomId") UUID classroomId);
}
