package com.uranus.lms.modules.exam.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/** Kết quả chi tiết sau khi học sinh nộp bài hoặc xem lại. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamResultDetailResponse {

    private UUID resultId;
    private UUID examId;
    private String examTitle;
    private String examCode;
    private String studentName;      // NEW

    private Double totalScore;       // Điểm thực tế học sinh đạt
    private Double maxScore;         // Điểm tối đa của đề
    private Double scorePercentage;  // % so với max
    private Boolean isPassed;

    private LocalDateTime startedAt;
    private LocalDateTime submittedAt;
    private Long timeTakenSeconds;   // Thời gian làm thực tế

    private Integer correctCount;
    private Integer totalCount;

    private Integer cheatWarningCount;
    private String cheatDetails;

    /** null nếu reviewPolicy = NEVER hoặc AFTER_ALL_SUBMITTED chưa đạt điều kiện */
    private List<QuestionResultDto> questions;

    /** Thông báo nếu không thể xem chi tiết */
    private String reviewMessage;

    /** true nếu bài có câu tự luận AI chấm nháp nhưng giáo viên chưa duyệt — học sinh chưa được xem điểm/kết quả */
    private Boolean pendingTeacherReview;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionResultDto {
        private UUID questionId;
        private UUID answerId;           // ID câu trả lời của học sinh (để gọi regrade-ai)
        private String questionContent;
        private String questionType;
        private String sheetAnswerType;  // NEW
        private String explanation;      // NEW
        private Integer orderIndex;
        private Double points;
        private Double pointsEarned;
        private Boolean isCorrect;
        private String textResponse;
        private String aiFeedback;
        private Boolean reviewed;        // Giáo viên đã duyệt chưa
        private String essayStatus;      // AI_FAILED, AI_SCORED, TEACHER_REVIEWED, PENDING_AI

        /** Tất cả đáp án của câu hỏi này (kèm is_correct và is_selected) */
        private List<OptionResultDto> options;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OptionResultDto {
        private UUID id;
        private String content;
        private Boolean isCorrect;     // Đây là đáp án đúng
        private Boolean isSelected;    // Học sinh đã chọn cái này
    }
}
