package com.uranus.lms.modules.classroom.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateClassroomRequest {
    @NotBlank(message = "Tên lớp học không được để trống")
    private String name;
    
    private String section;
    private String subject;
    private String thumbnail;
    private String teacherId;
}
