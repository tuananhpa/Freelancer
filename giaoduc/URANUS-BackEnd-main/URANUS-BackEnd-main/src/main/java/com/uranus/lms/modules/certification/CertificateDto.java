package com.uranus.lms.modules.certification;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class CertificateDto {
    private UUID id;
    private UUID userId;
    private String userName;
    private UUID courseId;
    private String courseName;
    private LocalDateTime issueDate;
    private String uniqueCode;
    private String pdfUrl;
}
