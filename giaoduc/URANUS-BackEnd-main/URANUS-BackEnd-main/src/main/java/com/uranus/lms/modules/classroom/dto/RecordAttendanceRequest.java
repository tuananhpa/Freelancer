package com.uranus.lms.modules.classroom.dto;

import com.uranus.lms.modules.classroom.AttendanceStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
public class RecordAttendanceRequest {

    @NotNull(message = "Week number is required")
    private Integer weekNumber;

    @NotNull(message = "Session number is required")
    private Integer sessionNumber;

    private List<StudentAttendance> records;

    @Data
    public static class StudentAttendance {
        private UUID studentId;
        private AttendanceStatus status;
    }
}
