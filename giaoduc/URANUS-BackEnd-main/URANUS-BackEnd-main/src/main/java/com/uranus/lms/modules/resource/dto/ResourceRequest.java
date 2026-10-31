package com.uranus.lms.modules.resource.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResourceRequest {

    @NotBlank(message = "Tiêu đề không được để trống")
    private String title;

    private String description;

    @NotBlank(message = "Loại tài nguyên không được để trống")
    private String resourceType; // DOCUMENT, VIDEO, EXAM, SLIDE, AUDIO

    @NotBlank(message = "Khối lớp không được để trống")
    private String grade;

    @NotBlank(message = "Môn học không được để trống")
    private String subject;

    private String curriculumBook;

    private String authorName; // Tên Giáo viên/Tác giả (cho phép Trợ giảng nhập tên GV)

    private UUID folderId;

    private String fileUrl;

    private String externalUrl;

    private String fileName;

    private Long fileSize;

    private String fileFormat;

    private UUID attachedExamId;

    private String audioTranscript;

    private String learningOutcomes;

    private String writingPrompt;

    private String tags;

    @Builder.Default
    private Boolean isPublic = true;
}
