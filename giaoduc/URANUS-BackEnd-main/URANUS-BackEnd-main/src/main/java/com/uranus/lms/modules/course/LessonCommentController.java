package com.uranus.lms.modules.course;

import com.uranus.lms.exception.ResourceNotFoundException;
import com.uranus.lms.modules.course.dto.LessonCommentDto;
import com.uranus.lms.modules.user.User;
import com.uranus.lms.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/lessons/{lessonId}/comments")
@RequiredArgsConstructor
public class LessonCommentController {

    private final LessonCommentRepository commentRepository;
    private final LessonRepository lessonRepository;
    private final com.uranus.lms.modules.notification.NotificationService notificationService;

    @GetMapping
    public ResponseEntity<Page<LessonCommentDto>> getComments(@PathVariable UUID lessonId, Pageable pageable) {
        Page<LessonComment> comments = commentRepository.findByLessonIdAndParentIsNullOrderByCreatedAtDesc(lessonId, pageable);
        return ResponseEntity.ok(comments.map(this::toDto));
    }

    @PostMapping
    public ResponseEntity<LessonCommentDto> addComment(
            @PathVariable UUID lessonId,
            @RequestBody java.util.Map<String, String> payload,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson not found"));
        
        String content = payload.get("content");
        String parentIdStr = payload.get("parentId");
        
        LessonComment parent = null;
        if (parentIdStr != null && !parentIdStr.isEmpty()) {
            parent = commentRepository.findById(UUID.fromString(parentIdStr)).orElse(null);
        }

        LessonComment comment = LessonComment.builder()
                .content(content)
                .lesson(lesson)
                .user(userDetails.getUser())
                .parent(parent)
                .build();
        
        LessonComment saved = commentRepository.save(comment);

        // Course link
        UUID courseId = lesson.getSection() != null && lesson.getSection().getCourse() != null
                ? lesson.getSection().getCourse().getId()
                : null;
        String actionLink = courseId != null ? "/courses/" + courseId : "/dashboard";

        // Notify parent author if reply
        if (parent != null && !parent.getUser().getId().equals(userDetails.getUser().getId())) {
            notificationService.sendNotification(
                    parent.getUser(),
                    "Phản hồi bình luận trong bài học " + lesson.getTitle(),
                    userDetails.getUser().getFullName() + " đã trả lời bình luận của bạn.",
                    actionLink,
                    com.uranus.lms.modules.notification.NotificationType.COMMENT,
                    userDetails.getUser(),
                    "LESSON_COMMENT",
                    saved.getId().toString()
            );
        } else if (lesson.getSection() != null && lesson.getSection().getCourse() != null && lesson.getSection().getCourse().getTeacher() != null) {
            User instructor = lesson.getSection().getCourse().getTeacher();
            if (!instructor.getId().equals(userDetails.getUser().getId())) {
                notificationService.sendNotification(
                        instructor,
                        "Bình luận mới trong bài học " + lesson.getTitle(),
                        userDetails.getUser().getFullName() + " đã để lại bình luận trong bài học của bạn.",
                        actionLink,
                        com.uranus.lms.modules.notification.NotificationType.COMMENT,
                        userDetails.getUser(),
                        "LESSON_COMMENT",
                        saved.getId().toString()
                );
            }
        }
        
        return ResponseEntity.ok(toDto(saved));
    }

    private LessonCommentDto toDto(LessonComment comment) {
        List<LessonComment> replies = commentRepository.findByParentIdOrderByCreatedAtAsc(comment.getId());
        
        return LessonCommentDto.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .authorName(comment.getUser().getFullName())
                .authorRole(comment.getUser().getRole().name())
                .createdAt(comment.getCreatedAt())
                .parentId(comment.getParent() != null ? comment.getParent().getId() : null)
                .replies(replies.stream().map(r -> LessonCommentDto.builder()
                        .id(r.getId())
                        .content(r.getContent())
                        .authorName(r.getUser().getFullName())
                        .authorRole(r.getUser().getRole().name())
                        .createdAt(r.getCreatedAt())
                        .parentId(comment.getId())
                        .build()).collect(Collectors.toList()))
                .build();
    }
}
