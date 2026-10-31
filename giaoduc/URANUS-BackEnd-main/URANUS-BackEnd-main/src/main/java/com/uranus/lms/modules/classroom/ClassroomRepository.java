package com.uranus.lms.modules.classroom;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.uranus.lms.modules.student.StudentClassEnrollment;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ClassroomRepository extends JpaRepository<Classroom, UUID> {
    Optional<Classroom> findByInviteCode(String inviteCode);
    List<Classroom> findByTeacherId(UUID teacherId);
    Page<Classroom> findByTeacherIdAndStatus(UUID teacherId, String status, Pageable pageable);
    
    @Query(value = "SELECT DISTINCT c FROM Classroom c " +
           "LEFT JOIN c.teacher t " +
           "LEFT JOIN ClassMember cm ON c.id = cm.classroom.id " +
           "LEFT JOIN StudentClassEnrollment sce ON c.id = sce.classroom.id " +
           "LEFT JOIN sce.studentProfile sp " +
           "WHERE (t.id = :userId OR cm.user.id = :userId OR sp.user.id = :userId) " +
           "AND (c.status != 'ARCHIVED' OR c.status IS NULL)",
           countQuery = "SELECT count(DISTINCT c.id) FROM Classroom c " +
           "LEFT JOIN c.teacher t " +
           "LEFT JOIN ClassMember cm ON c.id = cm.classroom.id " +
           "LEFT JOIN StudentClassEnrollment sce ON c.id = sce.classroom.id " +
           "LEFT JOIN sce.studentProfile sp " +
           "WHERE (t.id = :userId OR cm.user.id = :userId OR sp.user.id = :userId) " +
           "AND (c.status != 'ARCHIVED' OR c.status IS NULL)")
    Page<Classroom> findAllActiveClassesByUserId(@Param("userId") UUID userId, Pageable pageable);

    List<Classroom> findByIsAdminGroupTrue();
    List<Classroom> findByIsAdminGroupFalse();
}
