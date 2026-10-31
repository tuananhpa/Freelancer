package com.uranus.lms.modules.classroom.dto;

import com.uranus.lms.modules.classroom.AttendanceStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class AttendanceResponse {
    private Integer weekNumber;
    private Integer sessionNumber;
    private List<StudentAttendance> records;

    @Data
    @Builder
    public static class StudentAttendance {
        private UUID studentId;
        private String studentName;
        private String avatarUrl;
        private AttendanceStatus status;
    }
}
