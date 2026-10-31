package com.uranus.lms.modules.exam.dto;

import lombok.Data;
import java.util.Map;

/**
 * Request body cho auto-save (draft) và nộp bài (submit).
 * answers: { "questionId" -> "selectedOptionId" }
 * Nếu học sinh chưa chọn đáp án cho câu nào, không có key đó trong map.
 */
@Data
public class SubmitExamRequest {
    private Map<String, String> answers;
    private Integer cheatWarningCount;
    private String cheatDetails;
    /** Email để gửi kết quả (tùy chọn, có thể null) */
    @jakarta.validation.constraints.Email(message = "Email gửi kết quả không hợp lệ")
    private String notifyEmail;
}
