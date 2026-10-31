package com.uranus.lms.modules.discussion;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface DiscussionReplyRepository extends JpaRepository<DiscussionReply, UUID> {
    List<DiscussionReply> findByDiscussionIdOrderByCreatedAtAsc(UUID discussionId);
}
