package com.uranus.lms.modules.classroom.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class LinkedCourseResponse {
    private UUID id;
    private UUID courseId;
    private String title;
    private String description;
    private String status;
    private LocalDateTime linkedAt;
}
