package com.uranus.lms.modules.resource.dto;

import com.uranus.lms.modules.resource.ResourceSubmission;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ResourceSubmissionResponse {
    private UUID id;
    private UUID resourceId;
    private UUID studentId;
    private String studentName;
    private String studentAvatar;
    private String content;
    private Double score;
    private String feedback;
    private String status;
    private LocalDateTime submittedAt;
    private LocalDateTime gradedAt;
    private String gradedByName;

    public static ResourceSubmissionResponse from(ResourceSubmission s) {
        if (s == null) return null;
        return ResourceSubmissionResponse.builder()
                .id(s.getId())
                .resourceId(s.getResource() != null ? s.getResource().getId() : null)
                .studentId(s.getStudent() != null ? s.getStudent().getId() : null)
                .studentName(s.getStudent() != null ? s.getStudent().getFullName() : null)
                .studentAvatar(s.getStudent() != null ? s.getStudent().getAvatarUrl() : null)
                .content(s.getContent())
                .score(s.getScore())
                .feedback(s.getFeedback())
                .status(s.getStatus())
                .submittedAt(s.getSubmittedAt())
                .gradedAt(s.getGradedAt())
                .gradedByName(s.getGradedBy() != null ? s.getGradedBy().getFullName() : null)
                .build();
    }
}
