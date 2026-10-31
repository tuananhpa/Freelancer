package com.uranus.lms.modules.notification;

import com.uranus.lms.modules.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public void sendNotification(User user, String title, String message, String link) {
        sendNotification(user, title, message, link, NotificationType.SYSTEM, null, null, null);
    }

    @Transactional
    public void sendNotification(
            User recipient,
            String title,
            String message,
            String link,
            NotificationType type,
            User actor,
            String entityType,
            String entityId) {

        if (recipient == null) {
            log.warn("Attempted to send notification to null recipient. Title: {}", title);
            return;
        }

        // Do not notify self
        if (actor != null && recipient.getId().equals(actor.getId())) {
            return;
        }

        // Deduplication: prevent identical notification to same user within 10 seconds
        if (entityType != null && entityId != null) {
            LocalDateTime debounceWindow = LocalDateTime.now().minusSeconds(10);
            boolean exists = notificationRepository.existsByUserAndEntityTypeAndEntityIdAndTypeAndCreatedAtAfter(
                    recipient, entityType, entityId, type, debounceWindow);
            if (exists) {
                log.debug("Deduplicated notification for user {} on entity {}/{}", recipient.getId(), entityType, entityId);
                return;
            }
        }

        Notification notification = Notification.builder()
                .user(recipient)
                .title(title)
                .message(message)
                .isRead(false)
                .link(link)
                .type(type != null ? type : NotificationType.SYSTEM)
                .actorId(actor != null ? actor.getId() : null)
                .actorName(actor != null ? actor.getFullName() : null)
                .actorAvatar(actor != null ? actor.getAvatarUrl() : null)
                .entityType(entityType)
                .entityId(entityId)
                .build();

        notification = notificationRepository.save(notification);

        // Convert to DTO and push realtime via WebSocket
        NotificationDto dto = NotificationDto.fromEntity(notification);

        try {
            if (recipient.getEmail() != null) {
                messagingTemplate.convertAndSendToUser(recipient.getEmail(), "/queue/notifications", dto);
                log.debug("Sent WS notification to user {} ({})", recipient.getEmail(), recipient.getId());
            }
        } catch (Exception e) {
            log.warn("Failed to push realtime WebSocket notification to user {}: {}", recipient.getId(), e.getMessage());
        }
    }

    @Transactional
    public void sendBulkNotifications(
            Collection<User> recipients,
            String title,
            String message,
            String link,
            NotificationType type,
            User actor,
            String entityType,
            String entityId) {

        if (recipients == null || recipients.isEmpty()) {
            return;
        }

        for (User recipient : recipients) {
            if (recipient != null) {
                sendNotification(recipient, title, message, link, type, actor, entityType, entityId);
            }
        }
    }
}
