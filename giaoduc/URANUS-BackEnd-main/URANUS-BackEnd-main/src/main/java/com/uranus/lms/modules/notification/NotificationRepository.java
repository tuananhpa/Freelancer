package com.uranus.lms.modules.notification;

import com.uranus.lms.modules.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    Page<Notification> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    Page<Notification> findByUserAndTypeOrderByCreatedAtDesc(User user, NotificationType type, Pageable pageable);

    Page<Notification> findByUserAndIsReadFalseOrderByCreatedAtDesc(User user, Pageable pageable);

    Page<Notification> findByUserAndTypeAndIsReadFalseOrderByCreatedAtDesc(User user, NotificationType type, Pageable pageable);

    long countByUserAndIsReadFalse(User user);

    List<Notification> findByUserAndIsReadFalse(User user);

    boolean existsByUserAndEntityTypeAndEntityIdAndTypeAndCreatedAtAfter(
            User user, String entityType, String entityId, NotificationType type, LocalDateTime after);

    @Modifying
    @Query("DELETE FROM Notification n WHERE n.user = :user AND n.isRead = true")
    void deleteByUserAndIsReadTrue(@Param("user") User user);
}
