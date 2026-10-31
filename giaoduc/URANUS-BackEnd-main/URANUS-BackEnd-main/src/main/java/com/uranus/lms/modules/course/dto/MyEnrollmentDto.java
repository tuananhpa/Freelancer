package com.uranus.lms.modules.course.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Danh sach "Khoa hoc cua toi" chi can id/title/thumbnail de ve card, khong
 * can sections/lessons long nhau. Tra thang Enrollment entity qua JSON truoc
 * day bi loi serialize Hibernate lazy proxy (course.sections chua duoc load,
 * Jackson khong the ep kieu ByteBuddyInterceptor thanh JSON).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MyEnrollmentDto {
    private UUID id;
    private LocalDateTime enrolledAt;
    private CourseSummary course;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CourseSummary {
        private UUID id;
        private String title;
        private String description;
        private String thumbnailUrl;
        private String status;
    }
}
