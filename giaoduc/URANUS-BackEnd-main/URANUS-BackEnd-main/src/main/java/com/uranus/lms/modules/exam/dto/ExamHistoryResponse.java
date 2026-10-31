package com.uranus.lms.modules.exam.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/** Tóm tắt một lần làm bài — dùng cho trang lịch sử của học sinh. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamHistoryResponse {
    private UUID resultId;
    private UUID examId;
    private String examTitle;
    private String examCode;
    private String teacherName;

    private Double totalScore;
    private Double maxScore;
    private Double scorePercentage;
    private Boolean isPassed;

    private LocalDateTime startedAt;
    private LocalDateTime submittedAt;
    private Long timeTakenSeconds;

    private Integer attemptNumber;  // Lần thứ mấy (1, 2, 3...)
    private Integer totalAttempts;  // Tổng số lần cho phép

    private Integer correctCount;
    private Integer totalCount;

    private String reviewMessage; // Có được xem lại chi tiết không?

    /** true nếu còn câu tự luận AI chấm nháp chưa được giáo viên duyệt — điểm/kết quả ở trên đều là null */
    private Boolean pendingTeacherReview;

    private Integer cheatWarningCount;
}
