package com.uranus.lms.modules.notification;

import com.uranus.lms.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;

    @GetMapping
    public ResponseEntity<Page<NotificationDto>> getNotifications(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam(required = false) NotificationType type,
            @RequestParam(required = false, defaultValue = "false") boolean unreadOnly,
            Pageable pageable) {

        Page<Notification> page;
        if (unreadOnly) {
            if (type != null) {
                page = notificationRepository.findByUserAndTypeAndIsReadFalseOrderByCreatedAtDesc(
                        userDetails.getUser(), type, pageable);
            } else {
                page = notificationRepository.findByUserAndIsReadFalseOrderByCreatedAtDesc(
                        userDetails.getUser(), pageable);
            }
        } else {
            if (type != null) {
                page = notificationRepository.findByUserAndTypeOrderByCreatedAtDesc(
                        userDetails.getUser(), type, pageable);
            } else {
                page = notificationRepository.findByUserOrderByCreatedAtDesc(
                        userDetails.getUser(), pageable);
            }
        }

        return ResponseEntity.ok(page.map(NotificationDto::fromEntity));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(notificationRepository.countByUserAndIsReadFalse(userDetails.getUser()));
    }

    @PutMapping("/{id}/read")
    @Transactional
    public ResponseEntity<Void> markAsRead(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        notificationRepository.findById(id).ifPresent(n -> {
            if (n.getUser().getId().equals(userDetails.getUser().getId())) {
                n.setRead(true);
                notificationRepository.save(n);
            }
        });
        return ResponseEntity.ok().build();
    }

    @PutMapping("/read-all")
    @Transactional
    public ResponseEntity<Void> markAllAsRead(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        notificationRepository.findByUserAndIsReadFalse(userDetails.getUser()).forEach(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> deleteNotification(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        notificationRepository.findById(id).ifPresent(n -> {
            if (n.getUser().getId().equals(userDetails.getUser().getId())) {
                notificationRepository.delete(n);
            }
        });
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/clear-read")
    @Transactional
    public ResponseEntity<Void> clearReadNotifications(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        notificationRepository.deleteByUserAndIsReadTrue(userDetails.getUser());
        return ResponseEntity.noContent().build();
    }
}
