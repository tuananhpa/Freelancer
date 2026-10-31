package com.uranus.lms.modules.exam.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/** Tóm tắt bài nộp của một học sinh — dùng cho trang xem kết quả của giáo viên. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamResultSummaryResponse {
    private UUID resultId;
    private UUID studentId;
    private String studentName;
    private String studentEmail;
    private String studentAvatar;

    private Double totalScore;
    private Double maxScore;
    private Double scorePercentage;
    private Boolean isPassed;

    private LocalDateTime startedAt;
    private LocalDateTime submittedAt;
    private Long timeTakenSeconds;

    private Integer correctCount;
    private Integer totalCount;
}
