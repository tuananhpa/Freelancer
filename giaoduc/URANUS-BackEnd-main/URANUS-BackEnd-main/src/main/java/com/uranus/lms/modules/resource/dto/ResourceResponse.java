package com.uranus.lms.modules.resource.dto;

import com.uranus.lms.modules.resource.ContentResource;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResourceResponse {

    private UUID id;
    private String title;
    private String description;
    private String resourceType;
    private String grade;
    private String subject;
    private String curriculumBook;

    private String authorName;
    private UUID uploaderId;
    private String uploaderName;
    private String uploaderAvatar;
    private String uploaderRole;

    private UUID folderId;
    private String folderName;

    private String fileUrl;
    private String externalUrl;
    private String fileName;
    private Long fileSize;
    private String fileFormat;

    private UUID attachedExamId;
    private String attachedExamTitle;
    private String audioTranscript;

    private String learningOutcomes;
    private String writingPrompt;
    private String tags;
    private Boolean isPublic;

    private Long viewCount;
    private Long likeCount;
    private Long bookmarkCount;

    private Boolean isLiked;
    private Boolean isBookmarked;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ResourceResponse from(ContentResource resource, Boolean isLiked, Boolean isBookmarked) {
        if (resource == null) return null;

        String uploaderName = resource.getUploader() != null ? resource.getUploader().getFullName() : null;
        String uploaderAvatar = resource.getUploader() != null ? resource.getUploader().getAvatarUrl() : null;
        String uploaderRole = resource.getUploader() != null && resource.getUploader().getRole() != null 
                ? resource.getUploader().getRole().name() : null;

        String effectiveAuthorName = (resource.getAuthorName() != null && !resource.getAuthorName().isBlank())
                ? resource.getAuthorName()
                : (uploaderName != null ? uploaderName : "Giáo viên");

        return ResourceResponse.builder()
                .id(resource.getId())
                .title(resource.getTitle())
                .description(resource.getDescription())
                .resourceType(resource.getResourceType())
                .grade(resource.getGrade())
                .subject(resource.getSubject())
                .curriculumBook(resource.getCurriculumBook())
                .authorName(effectiveAuthorName)
                .uploaderId(resource.getUploader() != null ? resource.getUploader().getId() : null)
                .uploaderName(uploaderName)
                .uploaderAvatar(uploaderAvatar)
                .uploaderRole(uploaderRole)
                .folderId(resource.getFolder() != null ? resource.getFolder().getId() : null)
                .folderName(resource.getFolder() != null ? resource.getFolder().getName() : null)
                .fileUrl(resource.getFileUrl())
                .externalUrl(resource.getExternalUrl())
                .fileName(resource.getFileName())
                .fileSize(resource.getFileSize())
                .fileFormat(resource.getFileFormat())
                .attachedExamId(resource.getAttachedExam() != null ? resource.getAttachedExam().getId() : null)
                .attachedExamTitle(resource.getAttachedExam() != null ? resource.getAttachedExam().getTitle() : null)
                .audioTranscript(resource.getAudioTranscript())
                .learningOutcomes(resource.getLearningOutcomes())
                .writingPrompt(resource.getWritingPrompt())
                .tags(resource.getTags())
                .isPublic(resource.getIsPublic())
                .viewCount(resource.getViewCount() != null ? resource.getViewCount() : 0L)
                .likeCount(resource.getLikeCount() != null ? resource.getLikeCount() : 0L)
                .bookmarkCount(resource.getBookmarkCount() != null ? resource.getBookmarkCount() : 0L)
                .isLiked(Boolean.TRUE.equals(isLiked))
                .isBookmarked(Boolean.TRUE.equals(isBookmarked))
                .createdAt(resource.getCreatedAt())
                .updatedAt(resource.getUpdatedAt())
                .build();
    }
}
