package com.uranus.lms.modules.resource.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class GradeResourceSubmissionRequest {
    @NotNull(message = "Điểm không được để trống")
    private Double score;

    private String feedback;
}
