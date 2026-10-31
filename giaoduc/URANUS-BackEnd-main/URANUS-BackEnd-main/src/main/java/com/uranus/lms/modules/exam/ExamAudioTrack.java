package com.uranus.lms.modules.exam;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Một file audio riêng trong đề thi (VD: Part 1, Part 2... của bài Listening nhiều part).
 * Dùng cho cả kiểu DETAILED lẫn ANSWER_SHEET — khác với audio đơn lẻ cũ (Exam.audioUrl),
 * một đề có thể có nhiều track, mỗi track có nhãn riêng để học sinh chọn phát.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamAudioTrack {
    private String label;
    private String url;
}
