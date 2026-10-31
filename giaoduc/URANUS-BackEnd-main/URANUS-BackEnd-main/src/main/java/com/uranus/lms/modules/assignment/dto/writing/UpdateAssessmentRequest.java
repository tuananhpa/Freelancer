package com.uranus.lms.modules.assignment.dto.writing;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateAssessmentRequest {

    @NotNull(message = "Kết quả chấm không được để trống")
    private WritingGradingResultDto result;

    /** Điểm chốt của giáo viên (tuỳ chọn - nếu null hệ thống tính theo điểm overall của result) */
    private Double finalScore;

    /** Ghi chú lưu lịch sử version */
    private String note;

    /** Nếu true: chốt điểm, đổi status submission sang GRADED và gửi thông báo cho học sinh */
    @Builder.Default
    private Boolean publishToStudent = true;
}
