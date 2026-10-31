package com.uranus.lms.modules.exam.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/** Một câu tự luận đã nộp, đang chờ giáo viên duyệt điểm AI chấm nháp. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EssayReviewItemResponse {
    private UUID answerId;
    private UUID resultId;
    private String studentName;
    private String studentEmail;
    private String questionContent;
    private String studentAnswer;
    private Double maxPoints;
    private Double aiSuggestedScore;
    private String aiFeedback;
    private LocalDateTime submittedAt;
}
