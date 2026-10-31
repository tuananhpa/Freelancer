package com.uranus.lms.modules.assignment.dto.writing;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class WritingGradingResultDto {

    @Builder.Default
    private String version = "1.0";

    @Builder.Default
    private String gradingStatus = "COMPLETED";

    private OverallScoreDto overall;
    private LevelAssessmentDto levelAssessment;
    private CriteriaDto criteria;

    @Builder.Default
    private List<GradingErrorItemDto> errors = new ArrayList<>();

    @Builder.Default
    private List<GradingStrengthItemDto> strengths = new ArrayList<>();

    @Builder.Default
    private List<GradingImprovementItemDto> improvements = new ArrayList<>();

    private TeacherSummaryDto teacherSummary;
    private StudentFeedbackDto studentFeedback;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class OverallScoreDto {
        private Double score;
        private Double maxScore;
        private Double percentage;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class LevelAssessmentDto {
        private String expectedLevel;
        private String estimatedPerformanceLevel;
        private String levelComment;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class CriteriaDto {
        private CriterionDetailDto taskAchievement;
        private CriterionDetailDto coherenceAndCohesion;
        private CriterionDetailDto lexicalResource;
        private CriterionDetailDto grammaticalRangeAndAccuracy;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class CriterionDetailDto {
        private Double score;
        private Double maxScore;
        @Builder.Default
        private List<String> strengths = new ArrayList<>();
        @Builder.Default
        private List<String> weaknesses = new ArrayList<>();
        private String feedback;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class GradingErrorItemDto {
        private String id;
        private String category; // grammar, vocabulary, spelling, punctuation, coherence, task, style, word_choice
        private String severity; // minor, major
        private String original;
        private String correction;
        private String explanation;
        private ErrorLocationDto location;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ErrorLocationDto {
        private Integer start;
        private Integer end;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class GradingStrengthItemDto {
        private String category;
        private String description;
        private String evidence;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class GradingImprovementItemDto {
        private String priority; // high, medium, low
        private String category;
        private String description;
        private String action;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class TeacherSummaryDto {
        private String overallComment;
        private String mainStrength;
        private String mainWeakness;
        private String recommendedFocus;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class StudentFeedbackDto {
        private String positive;
        private String nextStep;
    }
}
