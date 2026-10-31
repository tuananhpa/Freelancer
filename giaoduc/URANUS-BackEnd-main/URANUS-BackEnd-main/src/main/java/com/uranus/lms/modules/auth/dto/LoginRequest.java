package com.uranus.lms.modules.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {

    // Login by student code: only studentCode + password required
    private String studentCode;

    // Login by email: email + password (kept for backward compatibility / admin login)
    private String email;

    @NotBlank(message = "Mật khẩu không được để trống")
    private String password;
}
