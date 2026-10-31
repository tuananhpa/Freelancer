package com.uranus.lms.modules.classroom;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ClassPostRepository extends JpaRepository<ClassPost, UUID> {
    Page<ClassPost> findByClassroomIdOrderByCreatedAtDesc(UUID classroomId, Pageable pageable);
}
