package com.uranus.lms.modules.student.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterWithStudentCodeRequest {

    @NotBlank(message = "Mã số học sinh không được để trống")
    private String studentCode;

    @NotBlank(message = "Ngày sinh không được để trống (định dạng: DD/MM/YYYY)")
    private String dateOfBirth; // "DD/MM/YYYY" from student's registration card

    @Email(message = "Email không hợp lệ")
    @NotBlank(message = "Email không được để trống")
    private String email;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 6, message = "Mật khẩu phải có ít nhất 6 ký tự")
    private String password;
}
