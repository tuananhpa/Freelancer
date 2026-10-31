package com.uranus.lms.modules.classroom;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ClassResourceRepository extends JpaRepository<ClassResource, UUID> {
    List<ClassResource> findByClassroom_Id(UUID classroomId);
    void deleteByClassroom_IdAndResourceId(UUID classroomId, UUID resourceId);
    boolean existsByClassroom_IdAndResourceId(UUID classroomId, UUID resourceId);
    Optional<ClassResource> findByClassroom_IdAndResourceId(UUID classroomId, UUID resourceId);
    List<ClassResource> findByResourceId(UUID resourceId);
}
