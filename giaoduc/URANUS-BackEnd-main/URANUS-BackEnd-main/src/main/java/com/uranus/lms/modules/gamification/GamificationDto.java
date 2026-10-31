package com.uranus.lms.modules.gamification;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class GamificationDto {
    private int totalXp;
    private int diamonds;
    private int currentStreak;
    private int longestStreak;
    private List<String> badges;
    private List<ActivityItem> recentActivities;
    private String lastActivityDate;
    private int uranianLevel;
    private int uranianHealth;
    private String uranianMood;
    private String uranianTitle;

    @Data
    @Builder
    public static class ActivityItem {
        private String activityType;
        private int xpEarned;
        private String activityDate;
    }
}
