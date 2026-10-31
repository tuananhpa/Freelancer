package com.uranus.lms.modules.classroom.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassFolderResponse {
    private UUID id;
    private String name;
    private UUID classroomId;
    /** Null = chu de goc. Giao dien dung truong nay de dung lai cay chu de. */
    private UUID parentId;
    private LocalDateTime createdAt;
}
