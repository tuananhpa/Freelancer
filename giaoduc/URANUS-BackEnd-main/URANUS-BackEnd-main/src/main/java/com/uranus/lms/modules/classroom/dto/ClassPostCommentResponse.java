package com.uranus.lms.modules.classroom.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class ClassPostCommentResponse {
    private UUID id;
    private UUID postId;
    private UUID parentId;
    private UUID authorId;
    private String authorName;
    private String authorAvatar;
    private String content;
    private LocalDateTime createdAt;
    private long likeCount;
    private boolean isLikedByCurrentUser;
    private List<ClassPostCommentResponse> replies;
}
