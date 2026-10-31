package com.uranus.lms.modules.discussion;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface DiscussionRepository extends JpaRepository<Discussion, UUID> {
    Page<Discussion> findByCourseIdOrderByIsPinnedDescCreatedAtDesc(UUID courseId, Pageable pageable);
}
