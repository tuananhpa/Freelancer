package com.uranus.lms.modules.activity;

import com.uranus.lms.modules.activity.dto.ActivityRequest;
import com.uranus.lms.modules.activity.dto.ActivityResponse;
import com.uranus.lms.modules.activity.dto.ReviewActivityRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * Quản lý hoạt động / poster hiển thị trên landing page.
 * Phân quyền tập trung tại {@link ActivityRoles}.
 */
@RestController
@RequestMapping("/api/activities")
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityService activityService;

    @GetMapping
    @PreAuthorize(ActivityRoles.CAN_AUTHOR)
    public ResponseEntity<Page<ActivityResponse>> list(
            @RequestParam(required = false) ActivityStatus status,
            @RequestParam(required = false) ActivityCategory category,
            @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(activityService.getForManagement(status, category, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize(ActivityRoles.CAN_AUTHOR)
    public ResponseEntity<ActivityResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(activityService.getById(id));
    }

    @PostMapping
    @PreAuthorize(ActivityRoles.CAN_AUTHOR)
    public ResponseEntity<ActivityResponse> create(@Valid @RequestBody ActivityRequest request) {
        return ResponseEntity.ok(activityService.create(request, currentEmail()));
    }

    @PutMapping("/{id}")
    @PreAuthorize(ActivityRoles.CAN_AUTHOR)
    public ResponseEntity<ActivityResponse> update(@PathVariable UUID id,
                                                   @Valid @RequestBody ActivityRequest request) {
        return ResponseEntity.ok(activityService.update(id, request));
    }

    @PostMapping("/{id}/submit")
    @PreAuthorize(ActivityRoles.CAN_AUTHOR)
    public ResponseEntity<ActivityResponse> submit(@PathVariable UUID id) {
        return ResponseEntity.ok(activityService.submitForReview(id));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize(ActivityRoles.CAN_REVIEW)
    public ResponseEntity<ActivityResponse> approve(@PathVariable UUID id,
                                                    @RequestBody(required = false) ReviewActivityRequest request) {
        String note = request != null ? request.getNote() : null;
        return ResponseEntity.ok(activityService.approve(id, note, currentEmail()));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize(ActivityRoles.CAN_REVIEW)
    public ResponseEntity<ActivityResponse> reject(@PathVariable UUID id,
                                                   @RequestBody(required = false) ReviewActivityRequest request) {
        String note = request != null ? request.getNote() : null;
        return ResponseEntity.ok(activityService.reject(id, note, currentEmail()));
    }

    @PostMapping("/{id}/archive")
    @PreAuthorize(ActivityRoles.CAN_REVIEW)
    public ResponseEntity<ActivityResponse> archive(@PathVariable UUID id) {
        return ResponseEntity.ok(activityService.archive(id));
    }

    @PatchMapping("/{id}/pin")
    @PreAuthorize(ActivityRoles.CAN_REVIEW)
    public ResponseEntity<ActivityResponse> setPinned(@PathVariable UUID id,
                                                      @RequestParam boolean pinned) {
        return ResponseEntity.ok(activityService.setPinned(id, pinned));
    }

    @GetMapping("/pending-count")
    @PreAuthorize(ActivityRoles.CAN_REVIEW)
    public ResponseEntity<Map<String, Long>> pendingCount() {
        return ResponseEntity.ok(Map.of("count", activityService.countPendingReview()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize(ActivityRoles.CAN_REVIEW)
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        activityService.delete(id);
        return ResponseEntity.noContent().build();
    }

    private String currentEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}
