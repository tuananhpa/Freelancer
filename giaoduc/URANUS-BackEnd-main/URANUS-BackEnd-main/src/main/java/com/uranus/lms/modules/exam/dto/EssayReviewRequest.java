package com.uranus.lms.modules.exam.dto;

import lombok.Data;

/** Giáo viên xác nhận hoặc sửa điểm bản nháp AI cho một câu tự luận. */
@Data
public class EssayReviewRequest {
    private Double score;
    private String feedback;
    private Boolean isPassed;
}
