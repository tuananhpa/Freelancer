package com.uranus.lms.modules.student.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateStudentProfileRequest {
    private String fullName;
    private String studentCode;
    private LocalDate dateOfBirth;
    private String phone;
    private String facility;
}
