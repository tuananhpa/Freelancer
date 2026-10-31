package com.uranus.lms.modules.audit;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class AuditLogDto {
    private UUID id;
    private UUID userId;
    private String userEmail;
    private AuditAction action;
    private String entityName;
    private String entityId;
    private JsonNode previousState;
    private JsonNode newState;
    private String ipAddress;
    private LocalDateTime createdAt;
}
