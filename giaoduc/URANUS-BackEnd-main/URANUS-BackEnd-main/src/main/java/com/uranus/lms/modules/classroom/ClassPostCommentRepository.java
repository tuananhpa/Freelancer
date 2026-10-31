package com.uranus.lms.modules.classroom;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ClassPostCommentRepository extends JpaRepository<ClassPostComment, UUID> {
    List<ClassPostComment> findByPostIdOrderByCreatedAtAsc(UUID postId);
    long countByPostId(UUID postId);
    
    void deleteByPostId(UUID postId);
}
