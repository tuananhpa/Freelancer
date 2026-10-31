package com.uranus.lms.modules.course.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class LessonCommentDto {
    private UUID id;
    private String content;
    private String authorName;
    private String authorRole;
    private LocalDateTime createdAt;
    private UUID parentId;
    private List<LessonCommentDto> replies;
}
