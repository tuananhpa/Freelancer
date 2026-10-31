package com.uranus.lms.modules.classroom.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ClassMemberResponse {
    private UUID id;
    private UUID userId;
    private String fullName;
    private String email;
    private String role; // "TEACHER" or "STUDENT"
    private String avatarUrl;
    private LocalDateTime joinedAt;
    private LocalDateTime lastActiveAt;
    private String studentCode;
    private String phone;
}
