package com.uranus.lms.modules.assignment.dto.writing;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WritingAssessmentResponseDto {

    private UUID id;
    private UUID submissionId;
    private UUID assignmentId;
    private UUID studentId;
    private String studentName;
    private String studentEmail;
    private String status; // NOT_GRADED, QUEUED, GRADING, COMPLETED, FAILED, TEACHER_EDITED

    private Double overallScore;
    private Double maxScore;
    private Double percentage;

    private Integer wordCount;
    private Integer requiredMinWords;
    private Integer requiredMaxWords;

    private String expectedLevel;
    private String estimatedLevel;

    private WritingGradingResultDto result;
    private WritingGradingResultDto originalAiResult;

    private Integer version;
    private String aiModel;
    private String errorMessage;

    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
    private LocalDateTime lastEditedAt;
    private String lastEditedByName;

    @Builder.Default
    private List<AssessmentVersionSummaryDto> versions = new ArrayList<>();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AssessmentVersionSummaryDto {
        private UUID id;
        private Integer version;
        private String source; // AI or TEACHER
        private Double overallScore;
        private LocalDateTime createdAt;
        private String createdByName;
        private String note;
    }
}
