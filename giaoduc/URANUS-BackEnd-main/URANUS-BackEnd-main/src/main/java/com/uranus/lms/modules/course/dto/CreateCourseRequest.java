package com.uranus.lms.modules.course.dto;

import com.uranus.lms.modules.course.CourseStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateCourseRequest {
    @NotBlank(message = "Title is required")
    private String title;
    
    private String description;
    
    private String thumbnailUrl;
    
    private CourseStatus status;
}
