package com.uranus.lms.modules.classroom.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class UpdateClassExamRequest {
    private LocalDateTime openTime;
    private LocalDateTime closeTime;
    private UUID folderId;
}
