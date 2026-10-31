package com.uranus.lms.modules.classroom;

import com.uranus.lms.exception.BadRequestException;
import com.uranus.lms.exception.ResourceNotFoundException;
import com.uranus.lms.modules.classroom.dto.ClassPostResponse;
import com.uranus.lms.modules.classroom.dto.CreateClassPostRequest;
import java.util.ArrayList;
import java.util.List;
import com.uranus.lms.modules.notification.NotificationService;
import com.uranus.lms.modules.user.User;
import com.uranus.lms.modules.classroom.ClassroomAuthorizationService;
import com.uranus.lms.modules.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ClassPostService {

    private final ClassPostRepository classPostRepository;
    private final ClassPostCommentRepository commentRepository;
    private final ClassPostLikeRepository likeRepository;
    private final ClassroomRepository classroomRepository;
    private final ClassMemberRepository classMemberRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final ClassroomAuthorizationService authorizationService;

    @Transactional
    public ClassPostResponse createPost(UUID classroomId, CreateClassPostRequest request, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom not found"));

        if (!authorizationService.canManageClassroom(classroom, user)) {
            if (!classMemberRepository.existsByClassroomIdAndUserId(classroomId, user.getId())) {
                throw new BadRequestException("Bạn không phải thành viên lớp này");
            }
        }

        // Only teachers can post announcements for now
        if ("STUDENT".equals(user.getRole())) {
            throw new BadRequestException("Học viên không có quyền đăng bài trong lớp.");
        }

        ClassPost post = ClassPost.builder()
                .classroom(classroom)
                .author(user)
                .content(request.getContent())
                .attachments(request.getAttachments() != null ? request.getAttachments() : new ArrayList<>())
                .type(request.getType() != null ? request.getType() : "ANNOUNCEMENT")
                .build();

        post = classPostRepository.save(post);

        // Broadcast notification to all classroom members (except author)
        List<ClassMember> members = classMemberRepository.findByClassroomId(classroomId);
        for (ClassMember m : members) {
            if (!m.getUser().getId().equals(user.getId())) {
                notificationService.sendNotification(
                        m.getUser(),
                        "Thông báo mới từ lớp " + classroom.getName(),
                        user.getFullName() + " đã đăng một thông báo mới trên bảng tin lớp học.",
                        "/classes/" + classroomId,
                        com.uranus.lms.modules.notification.NotificationType.CLASSROOM,
                        user,
                        "CLASS_POST",
                        post.getId().toString()
                );
            }
        }

        return mapToResponse(post, user.getId());
    }

    public Page<ClassPostResponse> getClassPosts(UUID classroomId, String email, Pageable pageable) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom not found"));

        if (!authorizationService.canManageClassroom(classroom, user)) {
            if (!classMemberRepository.existsByClassroomIdAndUserId(classroomId, user.getId())) {
                throw new BadRequestException("Bạn không có quyền xem bảng tin của lớp học này.");
            }
        }

        return classPostRepository.findByClassroomIdOrderByCreatedAtDesc(classroomId, pageable)
                .map(post -> mapToResponse(post, user.getId()));
    }

    @Transactional
    public ClassPostResponse updatePost(UUID classroomId, UUID postId, CreateClassPostRequest request, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        ClassPost post = classPostRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));

        if (!post.getClassroom().getId().equals(classroomId)) {
            throw new BadRequestException("Post does not belong to this classroom");
        }

        Classroom classroom = post.getClassroom();

        if (!post.getAuthor().getId().equals(user.getId())) {
            if (!authorizationService.canManageClassroom(classroom, user)) {
                throw new BadRequestException("Bạn không có quyền sửa/xóa bài đăng này");
            }
        }

        post.setContent(request.getContent());
        post.setAttachments(request.getAttachments() != null ? request.getAttachments() : new ArrayList<>());

        post = classPostRepository.save(post);
        return mapToResponse(post, user.getId());
    }

    @Transactional
    public void deletePost(UUID classroomId, UUID postId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        ClassPost post = classPostRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));

        if (!post.getClassroom().getId().equals(classroomId)) {
            throw new BadRequestException("Post does not belong to this classroom");
        }

        boolean isTeacher = classroomRepository.findById(classroomId)
                .map(c -> authorizationService.canManageClassroom(c, user))
                .orElse(false);

        if (!post.getAuthor().getId().equals(user.getId()) && !isTeacher && user.getRole() != com.uranus.lms.modules.user.Role.ADMIN) {
            throw new BadRequestException("Bạn không có quyền xóa bài viết này.");
        }

        commentRepository.deleteByPostId(postId);
        likeRepository.deleteByPostId(postId);
        classPostRepository.delete(post);
    }

    @Transactional
    public ClassPostResponse toggleLike(UUID classroomId, UUID postId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        ClassPost post = classPostRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));

        if (!post.getClassroom().getId().equals(classroomId)) {
            throw new BadRequestException("Post does not belong to this classroom");
        }

        likeRepository.findByPostIdAndUserId(postId, user.getId()).ifPresentOrElse(
                likeRepository::delete,
                () -> likeRepository.save(ClassPostLike.builder().post(post).user(user).build())
        );

        return mapToResponse(post, user.getId());
    }

    private ClassPostResponse mapToResponse(ClassPost post, UUID currentUserId) {
        return ClassPostResponse.builder()
                .id(post.getId())
                .classroomId(post.getClassroom().getId())
                .authorId(post.getAuthor().getId())
                .authorName(post.getAuthor().getFullName())
                .authorAvatar(post.getAuthor().getAvatarUrl())
                .type(post.getType())
                .content(post.getContent())
                .attachments(post.getAttachments())
                .createdAt(post.getCreatedAt())
                .commentCount(commentRepository.countByPostId(post.getId()))
                .likeCount(likeRepository.countByPostId(post.getId()))
                .isLikedByCurrentUser(likeRepository.existsByPostIdAndUserId(post.getId(), currentUserId))
                .build();
    }
}
