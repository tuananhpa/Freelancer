package com.uranus.lms.modules.resource.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SubmitResourceWritingRequest {
    @NotBlank(message = "Nội dung bài viết không được để trống")
    private String content;
}
