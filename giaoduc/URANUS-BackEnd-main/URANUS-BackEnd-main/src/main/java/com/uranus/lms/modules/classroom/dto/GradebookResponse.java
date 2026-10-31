package com.uranus.lms.modules.classroom.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
public class GradebookResponse {
    
    @Data
    @Builder
    public static class ClassworkInfo {
        private UUID id;
        private String title;
        private String type; // ASSIGNMENT, EXAM
        private Double maxScore;
        private String dueDate; // ISO string
    }

    @Data
    @Builder
    public static class SubmissionStatus {
        private Double score;
        private String status; // ASSIGNED, MISSING, TURNED_IN, GRADED
    }

    @Data
    @Builder
    public static class StudentGrades {
        private UUID studentId;
        private String studentName;
        private String avatarUrl;
        // Key: Classwork ID, Value: SubmissionStatus
        private Map<UUID, SubmissionStatus> grades;
    }

    private List<ClassworkInfo> classworks;
    private List<StudentGrades> students;
}
