package com.uranus.lms.modules.analytics;

import lombok.Builder;
import lombok.Data;
import java.util.List;

public class AnalyticsDto {

    @Data
    @Builder
    public static class AdminDashboardStats {
        private long totalUsers;
        private long totalTeachers;
        private long totalStudents;
        private long totalCourses;
        private long totalClasses;
        private long totalExams;
        private List<MonthlyEnrollmentStat> newUsersByMonth;
    }

    @Data
    @Builder
    public static class TeacherDashboardStats {
        private long totalCourses;
        private long totalExams;
        private long totalStudents;
        private long totalDecks;
        private List<MonthlyEnrollmentStat> enrollmentsByMonth;
    }

    @Data
    @Builder
    public static class StudentDashboardStats {
        private long enrolledCourses;
        private long completedLessons;
        private long totalExamsTaken;
        private double averageExamScore;
        private int learningStreakDays;
        private List<RadarSkillStat> radarSkills;
        private List<ExamScorePoint> examHistory;
        private int totalXp;
        private int currentStreak;
        private List<String> badges;
    }

    @Data
    @Builder
    public static class ProgressReport {
        private StudentDashboardStats summary;
        private List<ExamScorePoint> examHistory;
        private List<ActivityItem> recentActivities;
    }

    @Data
    @Builder
    public static class ActivityItem {
        private String activityType;
        private int xpEarned;
        private String activityDate;
    }

    @Data
    @Builder
    public static class ExamScorePoint {
        /** Cho phep mo lai bai da nop tu dashboard. Null neu ket qua da bi xoa. */
        private java.util.UUID resultId;
        private String examTitle;
        private double scorePercent;
        /** Diem tho va diem toi da, de hien "8/10" ben canh phan tram. */
        private double score;
        private double maxScore;
        private String submittedAt;
    }

    @Data
    @Builder
    public static class MonthlyEnrollmentStat {
        private String month;
        private long count;
    }

    @Data
    @Builder
    public static class RadarSkillStat {
        private String subject;
        private int score;
        private int fullMark;
    }
}
