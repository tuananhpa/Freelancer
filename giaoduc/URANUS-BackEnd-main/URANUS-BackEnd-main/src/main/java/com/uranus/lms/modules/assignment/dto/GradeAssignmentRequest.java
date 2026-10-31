package com.uranus.lms.modules.assignment.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class GradeAssignmentRequest {
    @NotNull(message = "Điểm không được để trống")
    private Double score;

    private String feedback;
}
