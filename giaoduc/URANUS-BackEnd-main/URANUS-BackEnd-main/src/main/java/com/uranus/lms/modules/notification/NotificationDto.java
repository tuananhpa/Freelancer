package com.uranus.lms.modules.notification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDto {
    private UUID id;
    private String title;
    private String message;
    private String link;
    private boolean isRead;
    private NotificationType type;
    private UUID actorId;
    private String actorName;
    private String actorAvatar;
    private String entityType;
    private String entityId;
    private LocalDateTime createdAt;

    public static NotificationDto fromEntity(Notification n) {
        if (n == null) return null;
        return NotificationDto.builder()
                .id(n.getId())
                .title(n.getTitle())
                .message(n.getMessage())
                .link(n.getLink())
                .isRead(n.isRead())
                .type(n.getType() != null ? n.getType() : NotificationType.SYSTEM)
                .actorId(n.getActorId())
                .actorName(n.getActorName())
                .actorAvatar(n.getActorAvatar())
                .entityType(n.getEntityType())
                .entityId(n.getEntityId())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
