package com.uranus.lms.modules.resource;

import com.uranus.lms.exception.BadRequestException;
import com.uranus.lms.exception.ResourceNotFoundException;
import com.uranus.lms.modules.exam.Exam;
import com.uranus.lms.modules.exam.ExamRepository;
import com.uranus.lms.modules.folder.ContentFolder;
import com.uranus.lms.modules.folder.ContentFolderRepository;
import com.uranus.lms.modules.resource.dto.ResourceRequest;
import com.uranus.lms.modules.resource.dto.ResourceResponse;
import com.uranus.lms.modules.user.Role;
import com.uranus.lms.modules.user.User;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContentResourceService {

    private final ContentResourceRepository resourceRepository;
    private final ResourceBookmarkRepository bookmarkRepository;
    private final ResourceLikeRepository likeRepository;
    private final ContentFolderRepository folderRepository;
    private final ExamRepository examRepository;
    private final ResourceSubmissionRepository submissionRepository;
    private final com.uranus.lms.modules.notification.NotificationService notificationService;

    @Transactional(readOnly = true)
    public Page<ResourceResponse> getResources(
            String resourceType,
            String grade,
            String subject,
            String search,
            User currentUser,
            Pageable pageable
    ) {
        Specification<ContentResource> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // By default only show public resources
            predicates.add(cb.isTrue(root.get("isPublic")));

            if (resourceType != null && !resourceType.isBlank() && !resourceType.equalsIgnoreCase("ALL")) {
                predicates.add(cb.equal(root.get("resourceType"), resourceType.toUpperCase()));
            }

            if (grade != null && !grade.isBlank() && !grade.equalsIgnoreCase("ALL")) {
                predicates.add(cb.equal(root.get("grade"), grade.toUpperCase()));
            }

            if (subject != null && !subject.isBlank() && !subject.equalsIgnoreCase("ALL")) {
                predicates.add(cb.equal(root.get("subject"), subject.toUpperCase()));
            }

            if (search != null && !search.isBlank()) {
                String searchLower = "%" + search.trim().toLowerCase() + "%";
                Predicate titleMatch = cb.like(cb.lower(root.get("title")), searchLower);
                Predicate descMatch = cb.like(cb.lower(root.get("description")), searchLower);
                Predicate authorMatch = cb.like(cb.lower(root.get("authorName")), searchLower);
                Predicate tagsMatch = cb.like(cb.lower(root.get("tags")), searchLower);
                predicates.add(cb.or(titleMatch, descMatch, authorMatch, tagsMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return resourceRepository.findAll(spec, pageable).map(resource -> {
            boolean isLiked = currentUser != null && likeRepository.existsByUserAndResource(currentUser, resource);
            boolean isBookmarked = currentUser != null && bookmarkRepository.existsByUserAndResource(currentUser, resource);
            return ResourceResponse.from(resource, isLiked, isBookmarked);
        });
    }

    @Transactional
    public ResourceResponse getResourceById(UUID id, User currentUser) {
        ContentResource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài nguyên"));

        // Increment view count asynchronously/directly
        resourceRepository.incrementViewCount(id);

        boolean isLiked = currentUser != null && likeRepository.existsByUserAndResource(currentUser, resource);
        boolean isBookmarked = currentUser != null && bookmarkRepository.existsByUserAndResource(currentUser, resource);

        return ResourceResponse.from(resource, isLiked, isBookmarked);
    }

    @Transactional
    public ResourceResponse createResource(ResourceRequest req, User uploader) {
        ContentFolder folder = null;
        if (req.getFolderId() != null) {
            folder = folderRepository.findById(req.getFolderId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thư mục"));
        }

        Exam attachedExam = null;
        if (req.getAttachedExamId() != null) {
            attachedExam = examRepository.findById(req.getAttachedExamId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đề thi đính kèm"));
            backfillExamAudioUrl(attachedExam, req);
        }

        String authorName = (req.getAuthorName() != null && !req.getAuthorName().isBlank())
                ? req.getAuthorName().trim()
                : uploader.getFullName();

        ContentResource resource = ContentResource.builder()
                .title(req.getTitle().trim())
                .description(req.getDescription())
                .resourceType(req.getResourceType().toUpperCase())
                .grade(req.getGrade().toUpperCase())
                .subject(req.getSubject().toUpperCase())
                .curriculumBook(req.getCurriculumBook())
                .authorName(authorName)
                .uploader(uploader)
                .folder(folder)
                .fileUrl(req.getFileUrl())
                .externalUrl(req.getExternalUrl())
                .fileName(req.getFileName())
                .fileSize(req.getFileSize())
                .fileFormat(req.getFileFormat())
                .attachedExam(attachedExam)
                .audioTranscript(req.getAudioTranscript())
                .learningOutcomes(req.getLearningOutcomes())
                .writingPrompt(req.getWritingPrompt())
                .tags(req.getTags())
                .isPublic(req.getIsPublic() != null ? req.getIsPublic() : true)
                .viewCount(0L)
                .likeCount(0L)
                .bookmarkCount(0L)
                .build();

        ContentResource saved = resourceRepository.save(resource);
        return ResourceResponse.from(saved, false, false);
    }

    @Transactional
    public ResourceResponse updateResource(UUID id, ResourceRequest req, User currentUser) {
        ContentResource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài nguyên"));

        boolean isAdmin = currentUser.getRole() == Role.ADMIN;
        boolean isOwner = resource.getUploader().getId().equals(currentUser.getId());
        if (!isAdmin && !isOwner) {
            throw new BadRequestException("Bạn không có quyền chỉnh sửa tài nguyên này.");
        }

        if (req.getFolderId() != null) {
            ContentFolder folder = folderRepository.findById(req.getFolderId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thư mục"));
            resource.setFolder(folder);
        } else {
            resource.setFolder(null);
        }

        if (req.getAttachedExamId() != null) {
            Exam attachedExam = examRepository.findById(req.getAttachedExamId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đề thi đính kèm"));
            backfillExamAudioUrl(attachedExam, req);
            resource.setAttachedExam(attachedExam);
        } else {
            resource.setAttachedExam(null);
        }

        resource.setTitle(req.getTitle().trim());
        resource.setDescription(req.getDescription());
        resource.setResourceType(req.getResourceType().toUpperCase());
        resource.setGrade(req.getGrade().toUpperCase());
        resource.setSubject(req.getSubject().toUpperCase());
        resource.setCurriculumBook(req.getCurriculumBook());
        if (req.getAuthorName() != null && !req.getAuthorName().isBlank()) {
            resource.setAuthorName(req.getAuthorName().trim());
        }
        resource.setFileUrl(req.getFileUrl());
        resource.setExternalUrl(req.getExternalUrl());
        resource.setFileName(req.getFileName());
        resource.setFileSize(req.getFileSize());
        resource.setFileFormat(req.getFileFormat());
        resource.setAudioTranscript(req.getAudioTranscript());
        resource.setLearningOutcomes(req.getLearningOutcomes());
        resource.setWritingPrompt(req.getWritingPrompt());
        resource.setTags(req.getTags());
        if (req.getIsPublic() != null) {
            resource.setIsPublic(req.getIsPublic());
        }

        ContentResource updated = resourceRepository.save(resource);
        boolean isLiked = likeRepository.existsByUserAndResource(currentUser, updated);
        boolean isBookmarked = bookmarkRepository.existsByUserAndResource(currentUser, updated);

        return ResourceResponse.from(updated, isLiked, isBookmarked);
    }

    @Transactional
    public void deleteResource(UUID id, User currentUser) {
        ContentResource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài nguyên"));

        boolean isAdmin = currentUser.getRole() == Role.ADMIN;
        boolean isOwner = resource.getUploader().getId().equals(currentUser.getId());
        if (!isAdmin && !isOwner) {
            throw new BadRequestException("Bạn không có quyền xóa tài nguyên này.");
        }

        // Xoa bai nop truoc bang code, khong dua vao ON DELETE CASCADE cua DB -
        // rang buoc khoa ngoai tren production co luc khong dung nhu migration
        // da khai bao, gay loi 500 khi xoa tai nguyen da co hoc sinh nop bai.
        List<ResourceSubmission> submissions = submissionRepository.findByResourceOrderBySubmittedAtDesc(resource);
        if (!submissions.isEmpty()) {
            submissionRepository.deleteAll(submissions);
        }

        resourceRepository.delete(resource);
    }

    @Transactional
    public boolean toggleLike(UUID id, User currentUser) {
        ContentResource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài nguyên"));

        if (likeRepository.existsByUserAndResource(currentUser, resource)) {
            likeRepository.deleteByUserAndResource(currentUser, resource);
            resourceRepository.updateLikeCount(id, -1);
            return false;
        } else {
            ResourceLike like = ResourceLike.builder()
                    .user(currentUser)
                    .resource(resource)
                    .build();
            likeRepository.save(like);
            resourceRepository.updateLikeCount(id, 1);

            // Notify uploader if not self
            if (resource.getUploader() != null && !resource.getUploader().getId().equals(currentUser.getId())) {
                notificationService.sendNotification(
                        resource.getUploader(),
                        "Lượt thích mới cho tài liệu",
                        currentUser.getFullName() + " đã thích tài liệu '" + resource.getTitle() + "' của bạn.",
                        "/library/resources/" + resource.getId(),
                        com.uranus.lms.modules.notification.NotificationType.RESOURCE,
                        currentUser,
                        "RESOURCE_LIKE",
                        resource.getId().toString()
                );
            }

            return true;
        }
    }

    @Transactional
    public boolean toggleBookmark(UUID id, UUID folderId, User currentUser) {
        ContentResource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài nguyên"));

        if (bookmarkRepository.existsByUserAndResource(currentUser, resource)) {
            bookmarkRepository.deleteByUserAndResource(currentUser, resource);
            resourceRepository.updateBookmarkCount(id, -1);
            return false;
        } else {
            ContentFolder folder = null;
            if (folderId != null) {
                folder = folderRepository.findById(folderId).orElse(null);
            }

            ResourceBookmark bookmark = ResourceBookmark.builder()
                    .user(currentUser)
                    .resource(resource)
                    .folder(folder)
                    .build();
            bookmarkRepository.save(bookmark);
            resourceRepository.updateBookmarkCount(id, 1);

            // Notify uploader if not self
            if (resource.getUploader() != null && !resource.getUploader().getId().equals(currentUser.getId())) {
                notificationService.sendNotification(
                        resource.getUploader(),
                        "Tài liệu được lưu trữ",
                        currentUser.getFullName() + " đã lưu tài liệu '" + resource.getTitle() + "' của bạn vào mục lưu trữ.",
                        "/library/resources/" + resource.getId(),
                        com.uranus.lms.modules.notification.NotificationType.RESOURCE,
                        currentUser,
                        "RESOURCE_BOOKMARK",
                        resource.getId().toString()
                );
            }

            return true;
        }
    }

    @Transactional(readOnly = true)
    public Page<ResourceResponse> getMyBookmarks(User currentUser, Pageable pageable) {
        return bookmarkRepository.findByUserOrderBySavedAtDesc(currentUser, pageable)
                .map(bookmark -> {
                    ContentResource res = bookmark.getResource();
                    boolean isLiked = likeRepository.existsByUserAndResource(currentUser, res);
                    return ResourceResponse.from(res, isLiked, true);
                });
    }

    @Transactional(readOnly = true)
    public Page<ResourceResponse> getMyUploads(User currentUser, Pageable pageable) {
        return resourceRepository.findByUploaderOrderByCreatedAtDesc(currentUser, pageable)
                .map(res -> {
                    boolean isLiked = likeRepository.existsByUserAndResource(currentUser, res);
                    boolean isBookmarked = bookmarkRepository.existsByUserAndResource(currentUser, res);
                    return ResourceResponse.from(res, isLiked, isBookmarked);
                });
    }

    /**
     * Khi giao vien gan mot de thi vao tai nguyen AUDIO (file nghe) trong Kho
     * hoc lieu, ma de thi do chua co audioUrl rieng (thuong tao qua
     * ExamPdfEditor chi voi PDF), tu dong gan file nghe cua tai nguyen lam
     * audioUrl cho de thi - de che do "Lam bai day du" (/exams/{id}/take)
     * cung phat duoc am thanh, khong chi xem truoc o trang tai nguyen.
     */
    private void backfillExamAudioUrl(Exam attachedExam, ResourceRequest req) {
        if (attachedExam.getAudioUrl() != null && !attachedExam.getAudioUrl().isBlank()) {
            return;
        }
        if (!"AUDIO".equalsIgnoreCase(req.getResourceType())) {
            return;
        }
        if (req.getFileUrl() == null || req.getFileUrl().isBlank()) {
            return;
        }
        attachedExam.setAudioUrl(req.getFileUrl());
        examRepository.save(attachedExam);
    }
}
