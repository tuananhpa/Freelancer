package com.uranus.lms.modules.gamification;

import com.uranus.lms.modules.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface UserActivityLogRepository extends JpaRepository<UserActivityLog, UUID> {
    boolean existsByUserAndActivityDate(User user, LocalDate activityDate);
    List<UserActivityLog> findTop20ByUserOrderByCreatedAtDesc(User user);
    long countByUser(User user);
}
