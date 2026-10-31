package com.uranus.lms.modules.classroom.dto;

import com.uranus.lms.modules.classroom.ClassResource;
import lombok.Data;

import java.util.UUID;

@Data
public class AssignResourceRequest {
    private UUID resourceId;
    private ClassResource.ResourceType resourceType;
    private UUID folderId;
}
