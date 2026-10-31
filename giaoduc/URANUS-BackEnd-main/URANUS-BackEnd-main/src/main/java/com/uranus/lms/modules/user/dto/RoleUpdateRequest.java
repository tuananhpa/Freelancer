package com.uranus.lms.modules.user.dto;

import com.uranus.lms.modules.user.Role;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RoleUpdateRequest {
    @NotNull(message = "Vai trò không được để trống")
    private Role role;
    
    private String securityCode;
}
