package com.uranus.lms.modules.resource;

import com.uranus.lms.modules.resource.dto.GradeResourceSubmissionRequest;
import com.uranus.lms.modules.resource.dto.ResourceRequest;
import com.uranus.lms.modules.resource.dto.ResourceResponse;
import com.uranus.lms.modules.resource.dto.ResourceSubmissionResponse;
import com.uranus.lms.modules.resource.dto.SubmitResourceWritingRequest;
import com.uranus.lms.modules.user.User;
import com.uranus.lms.modules.user.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
public class ContentResourceController {

    private final ContentResourceService resourceService;
    private final ResourceSubmissionService submissionService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<Page<ResourceResponse>> getResources(
            @RequestParam(required = false) String resourceType,
            @RequestParam(required = false) String grade,
            @RequestParam(required = false) String subject,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 15, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        User currentUser = getOptionalCurrentUser();
        return ResponseEntity.ok(resourceService.getResources(resourceType, grade, subject, search, currentUser, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResourceResponse> getResourceById(@PathVariable UUID id) {
        User currentUser = getOptionalCurrentUser();
        return ResponseEntity.ok(resourceService.getResourceById(id, currentUser));
    }

    @PostMapping
    public ResponseEntity<ResourceResponse> createResource(@Valid @RequestBody ResourceRequest request) {
        User currentUser = getCurrentUser();
        return ResponseEntity.ok(resourceService.createResource(request, currentUser));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ResourceResponse> updateResource(
            @PathVariable UUID id,
            @Valid @RequestBody ResourceRequest request
    ) {
        User currentUser = getCurrentUser();
        return ResponseEntity.ok(resourceService.updateResource(id, request, currentUser));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResource(@PathVariable UUID id) {
        User currentUser = getCurrentUser();
        resourceService.deleteResource(id, currentUser);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<Map<String, Object>> toggleLike(@PathVariable UUID id) {
        User currentUser = getCurrentUser();
        boolean liked = resourceService.toggleLike(id, currentUser);
        return ResponseEntity.ok(Map.of("liked", liked));
    }

    @PostMapping("/{id}/bookmark")
    public ResponseEntity<Map<String, Object>> toggleBookmark(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID folderId
    ) {
        User currentUser = getCurrentUser();
        boolean bookmarked = resourceService.toggleBookmark(id, folderId, currentUser);
        return ResponseEntity.ok(Map.of("bookmarked", bookmarked));
    }

    @GetMapping("/my-bookmarks")
    public ResponseEntity<Page<ResourceResponse>> getMyBookmarks(
            @PageableDefault(size = 15, sort = "savedAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        User currentUser = getCurrentUser();
        return ResponseEntity.ok(resourceService.getMyBookmarks(currentUser, pageable));
    }

    @GetMapping("/my-uploads")
    public ResponseEntity<Page<ResourceResponse>> getMyUploads(
            @PageableDefault(size = 15, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        User currentUser = getCurrentUser();
        return ResponseEntity.ok(resourceService.getMyUploads(currentUser, pageable));
    }

    // --- Writing prompt submissions ---

    @PostMapping("/{id}/submissions")
    public ResponseEntity<ResourceSubmissionResponse> submitWriting(
            @PathVariable UUID id,
            @Valid @RequestBody SubmitResourceWritingRequest request
    ) {
        User currentUser = getCurrentUser();
        return ResponseEntity.ok(submissionService.submit(id, currentUser, request));
    }

    @GetMapping("/{id}/submissions/me")
    public ResponseEntity<ResourceSubmissionResponse> getMySubmission(@PathVariable UUID id) {
        User currentUser = getCurrentUser();
        return ResponseEntity.ok(submissionService.getMySubmission(id, currentUser));
    }

    @GetMapping("/{id}/submissions")
    public ResponseEntity<List<ResourceSubmissionResponse>> getSubmissions(@PathVariable UUID id) {
        User currentUser = getCurrentUser();
        return ResponseEntity.ok(submissionService.getSubmissionsForResource(id, currentUser));
    }

    @PostMapping("/submissions/{submissionId}/grade")
    public ResponseEntity<ResourceSubmissionResponse> gradeSubmission(
            @PathVariable UUID submissionId,
            @Valid @RequestBody GradeResourceSubmissionRequest request
    ) {
        User currentUser = getCurrentUser();
        return ResponseEntity.ok(submissionService.grade(submissionId, currentUser, request));
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow();
    }

    private User getOptionalCurrentUser() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !auth.getName().equalsIgnoreCase("anonymousUser")) {
                return userRepository.findByEmail(auth.getName()).orElse(null);
            }
        } catch (Exception ignored) {
        }
        return null;
    }
}
