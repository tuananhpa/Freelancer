package com.uranus.lms.modules.gamification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardUserDto {
    private int rank;
    private UUID userId;
    private String fullName;
    private String username;
    private String avatarUrl;
    private int level;
    private int totalXp;
    private int studyMinutes;
    private int currentStreak;
}
