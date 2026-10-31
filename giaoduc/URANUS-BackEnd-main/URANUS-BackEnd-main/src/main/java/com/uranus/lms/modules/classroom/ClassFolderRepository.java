package com.uranus.lms.modules.classroom;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ClassFolderRepository extends JpaRepository<ClassFolder, UUID> {
    List<ClassFolder> findByClassroomIdOrderByCreatedAtAsc(UUID classroomId);
}
