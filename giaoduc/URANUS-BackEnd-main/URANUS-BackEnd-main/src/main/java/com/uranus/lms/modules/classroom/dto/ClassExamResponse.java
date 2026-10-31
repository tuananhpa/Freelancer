package com.uranus.lms.modules.classroom.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ClassExamResponse {
    private UUID id;
    private UUID classroomId;
    private UUID examId;
    private String examTitle;
    private Integer durationMinutes;
    private LocalDateTime openTime;
    private LocalDateTime closeTime;
    private UUID folderId;
    private LocalDateTime createdAt;
    private Integer questionCount;
    private String examType;
    /** Thời gian kết thúc được đặt từ chính đề thi (Exam.endTime) */
    private LocalDateTime examEndTime;
    /** Thời gian bắt đầu được đặt từ chính đề thi (Exam.startTime) */
    private LocalDateTime examStartTime;
}
