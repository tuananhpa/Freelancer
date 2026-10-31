package com.uranus.lms.modules.activity.dto;

import com.uranus.lms.modules.activity.ActivityCategory;
import com.uranus.lms.modules.activity.ActivityStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class ActivityResponse {
    private UUID id;
    private String title;
    private String slug;
    private String summary;
    private String content;
    private String coverImageUrl;
    private List<String> images;
    private ActivityCategory category;
    private ActivityStatus status;
    private boolean pinned;
    private String authorName;
    private String reviewNote;
    private LocalDateTime publishedAt;
    private long viewCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
