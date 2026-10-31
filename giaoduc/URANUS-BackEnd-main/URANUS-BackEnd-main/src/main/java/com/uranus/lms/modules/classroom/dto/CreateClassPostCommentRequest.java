package com.uranus.lms.modules.classroom.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.UUID;

@Data
public class CreateClassPostCommentRequest {
    @NotBlank
    private String content;

    private UUID parentId;
}
