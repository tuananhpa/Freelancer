package com.uranus.lms.modules.assignment.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class AssignmentResponse {
    private UUID id;
    private String title;
    private String description;
    private String attachmentUrl;
    private LocalDateTime dueDate;
    private Double maxScore;
    private UUID courseId;
    private String courseName;
    private UUID classroomId;
    private String classroomName;
    private String teacherName;
    private String assignmentType;
    private String instructions;
    private Integer minWordCount;
    private Integer maxWordCount;
    private String expectedAnswer;
    private String languageLevel;
    private String rubricConfig;
    private LocalDateTime createdAt;
}
