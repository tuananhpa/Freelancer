package com.uranus.lms.modules.exam.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class ProctoringResponse {
    private UUID examId;
    private String examTitle;
    private int totalQuestions;
    private List<ActiveAttempt> activeAttempts;

    @Data
    @Builder
    public static class ActiveAttempt {
        private UUID resultId;
        private UUID studentId;
        private String studentName;
        private String studentEmail;
        private LocalDateTime startedAt;
        private int answeredCount;
        private int totalQuestions;
        private int cheatWarningCount;
        private String cheatDetails;
        private boolean submitted;
        private LocalDateTime submittedAt;
        private Double totalScore;
    }
}
