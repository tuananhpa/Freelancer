package com.uranus.lms.modules.exam.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class ExamAnalyticsResponse {

    private UUID examId;
    private String examTitle;
    private String examCode;

    private int totalSubmissions;
    private double averageScore;
    private double averagePercentage;
    private double maxScore;
    private double minScore;
    private int passCount;
    private int failCount;
    private double passRate;
    private double maxPossibleScore;

    private List<ScoreBucket> scoreDistribution;
    private List<QuestionAnalytics> questionAnalytics;
    private List<SkillAnalytics> skillAnalytics;
    private List<StudentScoreRow> studentScores;

    @Data @Builder
    public static class ScoreBucket {
        private String label;
        private int count;
        private double percentage;
    }

    @Data @Builder
    public static class QuestionAnalytics {
        private UUID questionId;
        private int orderIndex;
        private String questionContent;
        private String skillTag;
        private double points;
        private double correctRate;
        private int correctCount;
        private int totalAnswered;
        private List<OptionStats> optionStats;
    }

    @Data @Builder
    public static class OptionStats {
        private UUID optionId;
        private String content;
        private Boolean isCorrect;
        private int selectedCount;
        private double selectedRate;
    }

    @Data @Builder
    public static class SkillAnalytics {
        private String skillTag;
        private String skillLabel;
        private double averageCorrectRate;
        private int totalQuestions;
    }

    @Data @Builder
    public static class StudentScoreRow {
        private UUID resultId;
        private UUID studentId;
        private String studentName;
        private String studentEmail;
        private double totalScore;
        private double maxScore;
        private double scorePercentage;
        private Boolean isPassed;
        private long timeTakenSeconds;
        private int cheatWarningCount;
        private String cheatDetails;
        private String submittedAt;
        private int attemptNumber;
    }
}
