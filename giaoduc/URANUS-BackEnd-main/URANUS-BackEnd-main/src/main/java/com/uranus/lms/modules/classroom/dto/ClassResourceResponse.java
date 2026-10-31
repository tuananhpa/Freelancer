package com.uranus.lms.modules.classroom.dto;

import com.uranus.lms.modules.classroom.ClassResource;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ClassResourceResponse {
    private UUID id;
    private UUID classroomId;
    private UUID folderId;
    private ClassResource.ResourceType resourceType;
    private UUID resourceId;
    private LocalDateTime createdAt;
    
    // Extracted details for frontend mapping (optional, can be filled by service)
    private String title;
    private String description;
}
