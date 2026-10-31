package com.uranus.lms.modules.resource;

import com.uranus.lms.exception.BadRequestException;
import com.uranus.lms.exception.ResourceNotFoundException;
import com.uranus.lms.modules.notification.NotificationService;
import com.uranus.lms.modules.notification.NotificationType;
import com.uranus.lms.modules.resource.dto.GradeResourceSubmissionRequest;
import com.uranus.lms.modules.resource.dto.ResourceSubmissionResponse;
import com.uranus.lms.modules.resource.dto.SubmitResourceWritingRequest;
import com.uranus.lms.modules.user.Role;
import com.uranus.lms.modules.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ResourceSubmissionService {

    private final ContentResourceRepository resourceRepository;
    private final ResourceSubmissionRepository submissionRepository;
    private final NotificationService notificationService;

    @Transactional
    public ResourceSubmissionResponse submit(UUID resourceId, User student, SubmitResourceWritingRequest request) {
        ContentResource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài nguyên"));

        if (resource.getWritingPrompt() == null || resource.getWritingPrompt().isBlank()) {
            throw new BadRequestException("Tài nguyên này không có đề bài viết.");
        }

        ResourceSubmission submission = submissionRepository.findByResourceAndStudent(resource, student)
                .orElse(ResourceSubmission.builder()
                        .resource(resource)
                        .student(student)
                        .build());

        submission.setContent(request.getContent());
        submission.setStatus("PENDING");
        submission.setSubmittedAt(LocalDateTime.now());
        submission.setScore(null);
        submission.setFeedback(null);
        submission.setGradedAt(null);
        submission.setGradedBy(null);

        ResourceSubmission saved = submissionRepository.save(submission);

        if (resource.getUploader() != null && !resource.getUploader().getId().equals(student.getId())) {
            notificationService.sendNotification(
                    resource.getUploader(),
                    "Học sinh đã nộp bài viết",
                    student.getFullName() + " đã nộp bài viết cho '" + resource.getTitle() + "'",
                    "/library/resources/" + resourceId,
                    NotificationType.SUBMISSION,
                    student,
                    "RESOURCE_SUBMISSION",
                    saved.getId().toString()
            );
        }

        return ResourceSubmissionResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public ResourceSubmissionResponse getMySubmission(UUID resourceId, User student) {
        ContentResource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài nguyên"));
        return submissionRepository.findByResourceAndStudent(resource, student)
                .map(ResourceSubmissionResponse::from)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public List<ResourceSubmissionResponse> getSubmissionsForResource(UUID resourceId, User requester) {
        ContentResource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài nguyên"));

        if (!canManageSubmissions(resource, requester)) {
            throw new BadRequestException("Bạn không có quyền xem danh sách bài nộp này");
        }

        return submissionRepository.findByResourceOrderBySubmittedAtDesc(resource).stream()
                .map(ResourceSubmissionResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public ResourceSubmissionResponse grade(UUID submissionId, User grader, GradeResourceSubmissionRequest request) {
        ResourceSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài nộp"));

        if (!canManageSubmissions(submission.getResource(), grader)) {
            throw new BadRequestException("Bạn không có quyền chấm bài này");
        }

        submission.setScore(request.getScore());
        submission.setFeedback(request.getFeedback());
        submission.setStatus("GRADED");
        submission.setGradedAt(LocalDateTime.now());
        submission.setGradedBy(grader);

        ResourceSubmission saved = submissionRepository.save(submission);

        notificationService.sendNotification(
                submission.getStudent(),
                "Bài viết của bạn đã được chấm",
                "Bài viết '" + submission.getResource().getTitle() + "' đã có điểm: " + request.getScore(),
                "/library/resources/" + submission.getResource().getId(),
                NotificationType.GRADE,
                grader,
                "RESOURCE_SUBMISSION",
                saved.getId().toString()
        );

        return ResourceSubmissionResponse.from(saved);
    }

    private boolean canManageSubmissions(ContentResource resource, User user) {
        if (user == null) return false;
        if (user.getRole() == Role.ADMIN || user.getRole() == Role.OFFICE) return true;
        return resource.getUploader() != null && resource.getUploader().getId().equals(user.getId());
    }
}
