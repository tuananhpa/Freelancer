package com.uranus.lms.modules.student.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class StudentProfileResponse {
    private UUID id;
    private String studentCode;
    private String fullName;
    private LocalDate dateOfBirth;
    private String phone;
    private String facility;
    private String status; // PENDING | ACTIVE
    private UUID userId;
    private String userStatus;
    private List<EnrolledClassInfo> enrollments;
    private LocalDateTime createdAt;

    @Data
    @Builder
    public static class EnrolledClassInfo {
        private UUID classroomId;
        private String classroomName;
    }
}
