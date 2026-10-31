package com.uranus.lms.modules.discussion;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class DiscussionDtos {
    
    @Data
    @Builder
    public static class DiscussionDto {
        private UUID id;
        private UUID courseId;
        private UUID authorId;
        private String authorName;
        private String authorAvatar;
        private String title;
        private String content;
        private boolean isPinned;
        private boolean isResolved;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private int replyCount;
        private List<ReplyDto> replies;
    }

    @Data
    @Builder
    public static class ReplyDto {
        private UUID id;
        private UUID discussionId;
        private UUID authorId;
        private String authorName;
        private String authorAvatar;
        private String content;
        private boolean isAcceptedAnswer;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }
}
