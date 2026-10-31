package com.uranus.lms.modules.classroom;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ClassroomCourseRepository extends JpaRepository<ClassroomCourse, UUID> {
    List<ClassroomCourse> findByClassroomIdOrderByLinkedAtDesc(UUID classroomId);
    Optional<ClassroomCourse> findByClassroomIdAndCourseId(UUID classroomId, UUID courseId);
    boolean existsByClassroomIdAndCourseId(UUID classroomId, UUID courseId);
}
