package com.uranus.lms.modules.classroom;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface ClassPostCommentLikeRepository extends JpaRepository<ClassPostCommentLike, UUID> {
    long countByCommentId(UUID commentId);
    Optional<ClassPostCommentLike> findByCommentIdAndUserId(UUID commentId, UUID userId);
    boolean existsByCommentIdAndUserId(UUID commentId, UUID userId);
    void deleteByCommentId(UUID commentId);
}
