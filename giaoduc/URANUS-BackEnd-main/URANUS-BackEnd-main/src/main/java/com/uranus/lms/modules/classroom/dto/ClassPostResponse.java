package com.uranus.lms.modules.classroom.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class ClassPostResponse {
    private UUID id;
    private UUID classroomId;
    private UUID authorId;
    private String authorName;
    private String authorAvatar;
    private String type;
    private String content;
    private List<String> attachments;
    private LocalDateTime createdAt;
    private long commentCount;
    private long likeCount;
    private boolean isLikedByCurrentUser;
}
