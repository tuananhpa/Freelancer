package com.uranus.lms.modules.classroom;

import com.uranus.lms.exception.BadRequestException;
import com.uranus.lms.exception.ResourceNotFoundException;
import com.uranus.lms.modules.classroom.dto.ClassPostCommentResponse;
import com.uranus.lms.modules.classroom.dto.CreateClassPostCommentRequest;
import com.uranus.lms.modules.user.User;
import com.uranus.lms.modules.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClassPostCommentService {

    private final ClassPostCommentRepository commentRepository;
    private final ClassPostLikeRepository postLikeRepository;
    private final ClassPostCommentLikeRepository commentLikeRepository;
    private final ClassPostRepository postRepository;
    private final UserRepository userRepository;
    private final ClassMemberRepository classMemberRepository;
    private final ClassroomRepository classroomRepository;
    private final ClassroomAuthorizationService authorizationService;
    private final com.uranus.lms.modules.notification.NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<ClassPostCommentResponse> getComments(UUID classroomId, UUID postId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        verifyMember(classroomId, email);
        verifyPostInClassroom(classroomId, postId);
        
        return commentRepository.findByPostIdOrderByCreatedAtAsc(postId).stream()
                .filter(c -> c.getParent() == null)
                .map(c -> mapToResponse(c, user.getId()))
                .collect(Collectors.toList());
    }

    @Transactional
    public ClassPostCommentResponse addComment(UUID classroomId, UUID postId,
            CreateClassPostCommentRequest request, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        verifyMember(classroomId, email);
        ClassPost post = verifyPostInClassroom(classroomId, postId);

        ClassPostComment parentComment = null;
        if (request.getParentId() != null) {
            parentComment = commentRepository.findById(request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent comment not found"));
            if (!parentComment.getPost().getId().equals(postId)) {
                throw new BadRequestException("Parent comment does not belong to this post");
            }
        }

        ClassPostComment comment = ClassPostComment.builder()
                .post(post)
                .author(user)
                .content(request.getContent().trim())
                .parent(parentComment)
                .build();

        ClassPostComment saved = commentRepository.save(comment);

        // Notify parent comment author if reply
        if (parentComment != null && !parentComment.getAuthor().getId().equals(user.getId())) {
            notificationService.sendNotification(
                    parentComment.getAuthor(),
                    "Phản hồi bình luận trong lớp " + post.getClassroom().getName(),
                    user.getFullName() + " đã trả lời bình luận của bạn: \"" + truncate(saved.getContent(), 60) + "\"",
                    "/classes/" + classroomId,
                    com.uranus.lms.modules.notification.NotificationType.COMMENT,
                    user,
                    "CLASS_COMMENT",
                    saved.getId().toString()
            );
        }

        // Notify post author if not self and not parent author
        if (!post.getAuthor().getId().equals(user.getId()) && (parentComment == null || !parentComment.getAuthor().getId().equals(post.getAuthor().getId()))) {
            notificationService.sendNotification(
                    post.getAuthor(),
                    "Bình luận mới trong lớp " + post.getClassroom().getName(),
                    user.getFullName() + " đã bình luận vào bài đăng của bạn: \"" + truncate(saved.getContent(), 60) + "\"",
                    "/classes/" + classroomId,
                    com.uranus.lms.modules.notification.NotificationType.COMMENT,
                    user,
                    "CLASS_COMMENT",
                    saved.getId().toString()
            );
        }

        return mapToResponse(saved, user.getId());
    }

    private String truncate(String text, int maxLen) {
        if (text == null) return "";
        return text.length() > maxLen ? text.substring(0, maxLen) + "..." : text;
    }

    @Transactional
    public ClassPostCommentResponse updateComment(UUID classroomId, UUID postId, UUID commentId, CreateClassPostCommentRequest request, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        ClassPostComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));

        if (!comment.getPost().getId().equals(postId) || !comment.getPost().getClassroom().getId().equals(classroomId)) {
            throw new BadRequestException("Invalid comment reference");
        }

        if (!comment.getAuthor().getId().equals(user.getId()) && user.getRole() != com.uranus.lms.modules.user.Role.ADMIN) {
            throw new BadRequestException("Bạn không có quyền chỉnh sửa bình luận này");
        }

        comment.setContent(request.getContent().trim());
        comment = commentRepository.save(comment);

        return mapToResponse(comment, user.getId());
    }

    @Transactional
    public void deleteComment(UUID classroomId, UUID postId, UUID commentId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        ClassPostComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));

        if (!comment.getPost().getId().equals(postId) || !comment.getPost().getClassroom().getId().equals(classroomId)) {
            throw new BadRequestException("Invalid comment reference");
        }

        boolean isTeacher = classroomRepository.findById(classroomId)
                .map(c -> authorizationService.canManageClassroom(c, user))
                .orElse(false);

        if (!comment.getAuthor().getId().equals(user.getId()) && !isTeacher && user.getRole() != com.uranus.lms.modules.user.Role.ADMIN) {
            throw new BadRequestException("Bạn không có quyền xóa bình luận này");
        }

        commentLikeRepository.deleteByCommentId(commentId);
        commentRepository.delete(comment);
    }

    @Transactional
    public ClassPostCommentResponse toggleLike(UUID classroomId, UUID postId, UUID commentId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        ClassPostComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));

        if (!comment.getPost().getId().equals(postId) || !comment.getPost().getClassroom().getId().equals(classroomId)) {
            throw new BadRequestException("Invalid comment reference");
        }

        commentLikeRepository.findByCommentIdAndUserId(commentId, user.getId()).ifPresentOrElse(
                commentLikeRepository::delete,
                () -> commentLikeRepository.save(ClassPostCommentLike.builder().comment(comment).user(user).build())
        );

        return mapToResponse(comment, user.getId());
    }

    private void verifyMember(UUID classroomId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom not found"));
        if (classroom.getTeacher() == null || !classroom.getTeacher().getId().equals(user.getId())) {
            if (!classMemberRepository.existsByClassroomIdAndUserId(classroomId, user.getId())) {
                throw new BadRequestException("Bạn không phải là thành viên của lớp học này.");
            }
        }
    }

    private ClassPost verifyPostInClassroom(UUID classroomId, UUID postId) {
        ClassPost post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Bài đăng không tồn tại"));
        if (!post.getClassroom().getId().equals(classroomId)) {
            throw new BadRequestException("Bài đăng không thuộc lớp học này.");
        }
        return post;
    }

    private ClassPostCommentResponse mapToResponse(ClassPostComment comment, UUID currentUserId) {
        return ClassPostCommentResponse.builder()
                .id(comment.getId())
                .postId(comment.getPost().getId())
                .parentId(comment.getParent() != null ? comment.getParent().getId() : null)
                .authorId(comment.getAuthor().getId())
                .authorName(comment.getAuthor().getFullName())
                .authorAvatar(comment.getAuthor().getAvatarUrl())
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .likeCount(commentLikeRepository.countByCommentId(comment.getId()))
                .isLikedByCurrentUser(commentLikeRepository.existsByCommentIdAndUserId(comment.getId(), currentUserId))
                .replies(comment.getReplies() != null ? comment.getReplies().stream()
                        .map(reply -> mapToResponse(reply, currentUserId))
                        .collect(Collectors.toList()) : new ArrayList<>())
                .build();
    }
}
