package com.uranus.lms.modules.classroom.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class ClassExamRequest {
    @NotNull(message = "ID Đề thi không được để trống")
    private UUID examId;

    private LocalDateTime openTime;
    private LocalDateTime closeTime;
    private UUID folderId;
}
