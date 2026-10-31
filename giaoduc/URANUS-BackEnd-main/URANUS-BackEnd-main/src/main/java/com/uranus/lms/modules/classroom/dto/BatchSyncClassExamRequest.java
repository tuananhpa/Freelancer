package com.uranus.lms.modules.classroom.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.List;

@Data
public class BatchSyncClassExamRequest {
    private List<ClassExamConfig> assignments;

    @Data
    public static class ClassExamConfig {
        private UUID classroomId;
        private UUID folderId;
        private LocalDateTime openTime;
        private LocalDateTime closeTime;
    }
}
