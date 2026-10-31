package com.uranus.lms.modules.discussion;

import com.uranus.lms.modules.course.Course;
import com.uranus.lms.modules.course.CourseRepository;
import com.uranus.lms.modules.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DiscussionService {
    private final DiscussionRepository discussionRepository;
    private final DiscussionReplyRepository replyRepository;
    private final CourseRepository courseRepository;
    private final com.uranus.lms.modules.notification.NotificationService notificationService;

    public Page<DiscussionDtos.DiscussionDto> getCourseDiscussions(UUID courseId, Pageable pageable) {
        return discussionRepository.findByCourseIdOrderByIsPinnedDescCreatedAtDesc(courseId, pageable)
                .map(this::mapToDtoWithoutReplies);
    }

    public DiscussionDtos.DiscussionDto getDiscussionDetails(UUID discussionId) {
        Discussion discussion = discussionRepository.findById(discussionId)
                .orElseThrow(() -> new IllegalArgumentException("Discussion not found"));
        return mapToDtoWithReplies(discussion);
    }

    @Transactional
    public DiscussionDtos.DiscussionDto createDiscussion(User author, UUID courseId, String title, String content) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("Course not found"));

        Discussion discussion = Discussion.builder()
                .course(course)
                .author(author)
                .title(title)
                .content(content)
                .isPinned(false)
                .isResolved(false)
                .build();

        return mapToDtoWithoutReplies(discussionRepository.save(discussion));
    }

    @Transactional
    public DiscussionDtos.ReplyDto addReply(User author, UUID discussionId, String content) {
        Discussion discussion = discussionRepository.findById(discussionId)
                .orElseThrow(() -> new IllegalArgumentException("Discussion not found"));

        DiscussionReply reply = DiscussionReply.builder()
                .discussion(discussion)
                .author(author)
                .content(content)
                .isAcceptedAnswer(false)
                .build();

        DiscussionReply saved = replyRepository.save(reply);

        // Notify discussion author if not self
        if (discussion.getAuthor() != null && !discussion.getAuthor().getId().equals(author.getId())) {
            notificationService.sendNotification(
                    discussion.getAuthor(),
                    "Phản hồi trong chủ đề thảo luận",
                    author.getFullName() + " đã trả lời chủ đề '" + discussion.getTitle() + "' của bạn.",
                    "/courses/" + discussion.getCourse().getId() + "/discussions/" + discussion.getId(),
                    com.uranus.lms.modules.notification.NotificationType.COMMENT,
                    author,
                    "DISCUSSION_REPLY",
                    saved.getId().toString()
            );
        }

        return mapReplyToDto(saved);
    }

    private DiscussionDtos.DiscussionDto mapToDtoWithoutReplies(Discussion discussion) {
        return DiscussionDtos.DiscussionDto.builder()
                .id(discussion.getId())
                .courseId(discussion.getCourse().getId())
                .authorId(discussion.getAuthor().getId())
                .authorName(discussion.getAuthor().getFullName())
                .authorAvatar(discussion.getAuthor().getAvatarUrl())
                .title(discussion.getTitle())
                .content(discussion.getContent())
                .isPinned(discussion.isPinned())
                .isResolved(discussion.isResolved())
                .createdAt(discussion.getCreatedAt())
                .updatedAt(discussion.getUpdatedAt())
                .replyCount(discussion.getReplies() != null ? discussion.getReplies().size() : 0)
                .build();
    }

    private DiscussionDtos.DiscussionDto mapToDtoWithReplies(Discussion discussion) {
        DiscussionDtos.DiscussionDto dto = mapToDtoWithoutReplies(discussion);
        if (discussion.getReplies() != null) {
            dto.setReplies(discussion.getReplies().stream()
                    .map(this::mapReplyToDto)
                    .collect(Collectors.toList()));
        }
        return dto;
    }

    private DiscussionDtos.ReplyDto mapReplyToDto(DiscussionReply reply) {
        return DiscussionDtos.ReplyDto.builder()
                .id(reply.getId())
                .discussionId(reply.getDiscussion().getId())
                .authorId(reply.getAuthor().getId())
                .authorName(reply.getAuthor().getFullName())
                .authorAvatar(reply.getAuthor().getAvatarUrl())
                .content(reply.getContent())
                .isAcceptedAnswer(reply.isAcceptedAnswer())
                .createdAt(reply.getCreatedAt())
                .updatedAt(reply.getUpdatedAt())
                .build();
    }
}
