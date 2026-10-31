package com.uranus.lms.modules.classroom;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface ClassPostLikeRepository extends JpaRepository<ClassPostLike, UUID> {
    long countByPostId(UUID postId);
    Optional<ClassPostLike> findByPostIdAndUserId(UUID postId, UUID userId);
    boolean existsByPostIdAndUserId(UUID postId, UUID userId);
    void deleteByPostId(UUID postId);
}
