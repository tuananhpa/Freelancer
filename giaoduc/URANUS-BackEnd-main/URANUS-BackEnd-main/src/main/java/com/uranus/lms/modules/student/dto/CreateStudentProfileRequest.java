package com.uranus.lms.modules.student.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class CreateStudentProfileRequest {
    @NotBlank(message = "Mã học sinh không được để trống")
    private String studentCode;

    @NotBlank(message = "Họ và tên không được để trống")
    private String fullName;

    private LocalDate dateOfBirth;
    private String phone;
    private String facility;
    private UUID classroomId; // Optional: If provided, link to this classroom
}
