package com.uranus.lms.modules.assignment.dto;

import lombok.Data;

@Data
public class SubmitAssignmentRequest {
    private String content; // Rich text
    private String fileUrl; // Uploaded file url
}
