package com.uranus.lms.modules.assignment.dto.writing;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BatchAiGradingStatusResponse {

    private String batchId;
    private UUID assignmentId;
    private int total;
    private int completed;
    private int successful;
    private int failed;
    private int inProgress;
    private boolean isDone;

    @Builder.Default
    private List<BatchItemStatusDto> items = new ArrayList<>();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BatchItemStatusDto {
        private UUID submissionId;
        private String studentName;
        private String status; // QUEUED, GRADING, COMPLETED, FAILED
        private Double score;
        private String errorMessage;
    }
}
