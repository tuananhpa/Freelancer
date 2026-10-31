package com.uranus.lms.modules.assignment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class CreateAssignmentRequest {
    @NotBlank(message = "Tiêu đề không được để trống")
    private String title;

    private String description;
    private String attachmentUrl;
    private LocalDateTime dueDate;

    @NotNull(message = "Điểm tối đa không được để trống")
    private Double maxScore = 100.0;

    private UUID courseId; // Nullable now

    private UUID classroomId;

    private String assignmentType;
    private String instructions;
    private Integer minWordCount;
    private Integer maxWordCount;
    private String expectedAnswer;
    private String languageLevel;
    private String rubricConfig;
}
