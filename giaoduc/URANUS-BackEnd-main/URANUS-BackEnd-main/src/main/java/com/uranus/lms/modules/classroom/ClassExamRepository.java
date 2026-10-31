package com.uranus.lms.modules.classroom;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ClassExamRepository extends JpaRepository<ClassExam, UUID> {
    List<ClassExam> findByClassroom(Classroom classroom);
    boolean existsByClassroomAndExamId(Classroom classroom, UUID examId);

    @org.springframework.data.jpa.repository.Query("SELECT CASE WHEN COUNT(ce) > 0 THEN true ELSE false END FROM ClassExam ce JOIN ClassMember cm ON cm.classroom = ce.classroom WHERE ce.exam.id = :examId AND cm.user.id = :userId")
    boolean isExamAssignedToUserClass(@org.springframework.data.repository.query.Param("examId") UUID examId, @org.springframework.data.repository.query.Param("userId") UUID userId);

    List<ClassExam> findByExamId(UUID examId);

    @org.springframework.data.jpa.repository.Query("SELECT MIN(ce.closeTime) FROM ClassExam ce WHERE ce.classroom.id = :classroomId AND ce.closeTime IS NOT NULL AND ce.closeTime > :now")
    java.util.Optional<java.time.LocalDateTime> findNearestCloseTimeByClassroomId(@org.springframework.data.repository.query.Param("classroomId") UUID classroomId, @org.springframework.data.repository.query.Param("now") java.time.LocalDateTime now);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(ce) FROM ClassExam ce WHERE ce.classroom.id = :classroomId AND ce.closeTime IS NOT NULL AND ce.closeTime > :now AND NOT EXISTS (SELECT ser FROM StudentExamResult ser WHERE ser.exam.id = ce.exam.id AND ser.student.id = :userId)")
    long countPendingForStudent(@org.springframework.data.repository.query.Param("classroomId") UUID classroomId, @org.springframework.data.repository.query.Param("userId") UUID userId, @org.springframework.data.repository.query.Param("now") java.time.LocalDateTime now);

    @org.springframework.data.jpa.repository.Query("SELECT ce FROM ClassExam ce WHERE ce.classroom.id = :classroomId AND ce.closeTime IS NOT NULL AND ce.closeTime > :now AND NOT EXISTS (SELECT ser FROM StudentExamResult ser WHERE ser.exam.id = ce.exam.id AND ser.student.id = :userId) ORDER BY ce.closeTime ASC")
    List<ClassExam> findPendingForStudent(@org.springframework.data.repository.query.Param("classroomId") UUID classroomId, @org.springframework.data.repository.query.Param("userId") UUID userId, @org.springframework.data.repository.query.Param("now") java.time.LocalDateTime now);

    @org.springframework.data.jpa.repository.Query("SELECT ce FROM ClassExam ce WHERE ce.classroom.id = :classroomId AND ce.closeTime IS NOT NULL AND ce.closeTime > :now ORDER BY ce.closeTime ASC")
    List<ClassExam> findUpcomingByClassroomId(@org.springframework.data.repository.query.Param("classroomId") UUID classroomId, @org.springframework.data.repository.query.Param("now") java.time.LocalDateTime now);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(ce) FROM ClassExam ce WHERE ce.classroom.id = :classroomId AND (ce.closeTime IS NULL OR ce.closeTime > :now)")
    long countActiveByClassroomId(@org.springframework.data.repository.query.Param("classroomId") UUID classroomId, @org.springframework.data.repository.query.Param("now") java.time.LocalDateTime now);

    @org.springframework.data.jpa.repository.Query("SELECT ce FROM ClassExam ce WHERE ce.closeTime IS NOT NULL AND ce.closeTime > :now AND ce.closeTime <= :threshold")
    List<ClassExam> findAllDueBetween(@org.springframework.data.repository.query.Param("now") java.time.LocalDateTime now, @org.springframework.data.repository.query.Param("threshold") java.time.LocalDateTime threshold);
}
