package com.uranus.lms.modules.gamification;

import com.uranus.lms.modules.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class GamificationService {

    private final UserGamificationRepository gamificationRepository;
    private final UserActivityLogRepository activityLogRepository;
    private final com.uranus.lms.modules.user.UserRepository userRepository;
    private final com.uranus.lms.modules.notification.NotificationService notificationService;

    private static final Map<String, Integer> XP_BY_ACTIVITY = Map.of(
            "EXAM_COMPLETE", 50,
            "LESSON_COMPLETE", 20,
            "FLASHCARD_STUDY", 15,
            "ASSIGNMENT_SUBMIT", 30,
            "DAILY_LOGIN", 10,
            "CLASSROOM_JOIN", 25,
            "MISTAKE_REVIEW", 12
    );

    @Transactional
    public UserGamification recordActivity(User user, String activityType) {
        int xp = XP_BY_ACTIVITY.getOrDefault(activityType, 10);
        LocalDate today = LocalDate.now();

        activityLogRepository.save(UserActivityLog.builder()
                .user(user)
                .activityType(activityType)
                .activityDate(today)
                .xpEarned(xp)
                .build());

        UserGamification stats = gamificationRepository.findById(user.getId())
                .orElseGet(() -> {
                    User managedUser = userRepository.findById(user.getId()).orElse(user);
                    UserGamification g = UserGamification.builder().user(managedUser).isNew(true).build();
                    g.setUserId(managedUser.getId());
                    return g;
                });

        stats.setTotalXp(stats.getTotalXp() + xp);
        updateStreak(stats, today);
        updateBadges(stats);

        return gamificationRepository.save(stats);
    }

    private void updateStreak(UserGamification stats, LocalDate today) {
        LocalDate last = stats.getLastActivityDate();
        if (last == null) {
            stats.setCurrentStreak(1);
        } else if (last.isEqual(today)) {
            // same day, keep streak
        } else if (last.isEqual(today.minusDays(1))) {
            stats.setCurrentStreak(stats.getCurrentStreak() + 1);
        } else {
            stats.setCurrentStreak(1);
        }
        stats.setLastActivityDate(today);
        if (stats.getCurrentStreak() > stats.getLongestStreak()) {
            stats.setLongestStreak(stats.getCurrentStreak());
        }
    }

    private void updateBadges(UserGamification stats) {
        Set<String> oldBadges = new LinkedHashSet<>(parseBadges(stats.getBadges()));
        Set<String> badges = new LinkedHashSet<>(oldBadges);
        if (stats.getCurrentStreak() >= 3) badges.add("STREAK_3");
        if (stats.getCurrentStreak() >= 7) badges.add("STREAK_7");
        if (stats.getTotalXp() >= 100) badges.add("XP_100");
        if (stats.getTotalXp() >= 500) badges.add("XP_500");
        stats.setBadges(toJsonArray(badges));

        for (String b : badges) {
            if (!oldBadges.contains(b)) {
                notificationService.sendNotification(
                        stats.getUser(),
                        "Huy hiệu mới!",
                        "Chúc mừng! Bạn vừa mở khóa huy hiệu '" + b + "' trên Uranus.",
                        "/dashboard",
                        com.uranus.lms.modules.notification.NotificationType.GAMIFICATION,
                        null,
                        "BADGE",
                        b
                );
            }
        }
    }

    @Transactional(readOnly = true)
    public GamificationDto getStats(User user) {
        UserGamification stats = gamificationRepository.findById(user.getId())
                .orElseGet(() -> {
                    User managedUser = userRepository.findById(user.getId()).orElse(user);
                    return UserGamification.builder().user(managedUser).userId(managedUser.getId()).isNew(true).build();
                });

        var recent = activityLogRepository.findTop20ByUserOrderByCreatedAtDesc(user).stream()
                .map(a -> GamificationDto.ActivityItem.builder()
                        .activityType(a.getActivityType())
                        .xpEarned(a.getXpEarned())
                        .activityDate(a.getCreatedAt() != null ? a.getCreatedAt().toString() : (a.getActivityDate() != null ? a.getActivityDate().toString() : LocalDate.now().toString()))
                        .build())
                .toList();

        int level = Math.max(1, stats.getTotalXp() / 100 + 1);
        LocalDate today = LocalDate.now();
        LocalDate last = stats.getLastActivityDate();
        int daysInactive = last == null ? 3 : (int) java.time.temporal.ChronoUnit.DAYS.between(last, today);
        int health = Math.max(0, Math.min(100, 100 - (daysInactive * 25)));
        String mood = computeMood(health, stats.getCurrentStreak());
        String title = computeTitle(level);

        int diamonds = Math.max(0, (stats.getTotalXp() != null ? stats.getTotalXp() / 5 : 0) + (stats.getCurrentStreak() != null ? stats.getCurrentStreak() * 10 : 0));

        return GamificationDto.builder()
                .totalXp(stats.getTotalXp())
                .diamonds(diamonds)
                .currentStreak(stats.getCurrentStreak())
                .longestStreak(stats.getLongestStreak())
                .badges(parseBadges(stats.getBadges()))
                .recentActivities(recent)
                .lastActivityDate(last != null ? last.toString() : null)
                .uranianLevel(level)
                .uranianHealth(health)
                .uranianMood(mood)
                .uranianTitle(title)
                .build();
    }

    private String computeMood(int health, int streak) {
        if (health <= 25) return "SLEEPING";
        if (health <= 50) return "HUNGRY";
        if (streak >= 7) return "EXCITED";
        if (streak >= 3) return "HAPPY";
        return "NORMAL";
    }

    private String computeTitle(int level) {
        if (level >= 20) return "Huyền thoại vũ trụ";
        if (level >= 10) return "Thám hiểm sao";
        if (level >= 5) return "Phi hành gia trẻ";
        return "Mầm non Uranus";
    }

    private List<String> parseBadges(String json) {
        if (json == null || json.isBlank() || json.equals("[]")) return List.of();
        String trimmed = json.replace("[", "").replace("]", "").replace("\"", "");
        if (trimmed.isBlank()) return List.of();
        return Arrays.stream(trimmed.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
    }

    private String toJsonArray(Set<String> badges) {
        if (badges.isEmpty()) return "[]";
        return "[" + badges.stream().map(b -> "\"" + b + "\"").reduce((a, c) -> a + "," + c).orElse("") + "]";
    }

    @Transactional(readOnly = true)
    public List<LeaderboardUserDto> getGlobalLeaderboard(String timeframe, String metric) {
        List<User> students = userRepository.findAll().stream()
                .filter(u -> u.getRole() == com.uranus.lms.modules.user.Role.STUDENT || u.getRole() == null || u.getRole() == com.uranus.lms.modules.user.Role.UNASSIGNED)
                .toList();

        List<LeaderboardUserDto> list = new ArrayList<>();
        for (User student : students) {
            UserGamification g = gamificationRepository.findById(student.getId()).orElse(null);
            int xp = g != null ? g.getTotalXp() : 0;
            int streak = g != null ? g.getCurrentStreak() : 0;
            int level = Math.max(1, xp / 100 + 1);

            long actCount = activityLogRepository.countByUser(student);
            int studyMinutes = (int) (actCount * 25 + xp * 0.4);

            String displayName = student.getFullName() != null && !student.getFullName().isBlank()
                    ? student.getFullName()
                    : student.getEmail().split("@")[0];

            String uname = student.getEmail() != null ? "@" + student.getEmail().split("@")[0] : "@" + displayName.toLowerCase().replaceAll("\\s+", "");

            list.add(LeaderboardUserDto.builder()
                    .userId(student.getId())
                    .fullName(displayName)
                    .username(uname)
                    .avatarUrl(student.getAvatarUrl())
                    .level(level)
                    .totalXp(xp)
                    .currentStreak(streak)
                    .studyMinutes(studyMinutes)
                    .build());
        }

        if ("XP".equalsIgnoreCase(metric)) {
            list.sort((a, b) -> Integer.compare(b.getTotalXp(), a.getTotalXp()));
        } else {
            list.sort((a, b) -> Integer.compare(b.getStudyMinutes(), a.getStudyMinutes()));
        }

        for (int i = 0; i < list.size(); i++) {
            list.get(i).setRank(i + 1);
        }
        return list;
    }
}
