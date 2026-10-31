package com.uranus.lms.modules.activity.dto;

import lombok.Data;

@Data
public class ReviewActivityRequest {
    /** Ghi chú kèm theo khi duyệt hoặc trả lại bài. */
    private String note;
}
