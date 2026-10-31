package com.uranus.lms.modules.classroom.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;
import lombok.Data;

@Data
public class CreateClassPostRequest {
    @NotBlank(message = "Nội dung bài đăng không được để trống")
    private String content;
    
    private List<String> attachments;

    private String type = "ANNOUNCEMENT";
}
