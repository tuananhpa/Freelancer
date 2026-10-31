package com.uranus.lms.modules.discussion;

import com.uranus.lms.modules.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/discussions")
@RequiredArgsConstructor
public class DiscussionController {
    private final DiscussionService discussionService;

    public record CreateDiscussionRequest(String title, String content) {}
    public record CreateReplyRequest(String content) {}

    @GetMapping("/course/{courseId}")
    public ResponseEntity<Page<DiscussionDtos.DiscussionDto>> getCourseDiscussions(
            @PathVariable UUID courseId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(discussionService.getCourseDiscussions(courseId, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DiscussionDtos.DiscussionDto> getDiscussion(@PathVariable UUID id) {
        return ResponseEntity.ok(discussionService.getDiscussionDetails(id));
    }

    @PostMapping("/course/{courseId}")
    public ResponseEntity<DiscussionDtos.DiscussionDto> createDiscussion(
            @AuthenticationPrincipal User user,
            @PathVariable UUID courseId,
            @RequestBody CreateDiscussionRequest request) {
        return ResponseEntity.ok(discussionService.createDiscussion(user, courseId, request.title(), request.content()));
    }

    @PostMapping("/{discussionId}/replies")
    public ResponseEntity<DiscussionDtos.ReplyDto> addReply(
            @AuthenticationPrincipal User user,
            @PathVariable UUID discussionId,
            @RequestBody CreateReplyRequest request) {
        return ResponseEntity.ok(discussionService.addReply(user, discussionId, request.content()));
    }
}
