package com.uranus.lms.modules.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateStudentCodeRequest {
    @NotBlank(message = "Mã học sinh không được để trống")
    private String studentCode;
}
