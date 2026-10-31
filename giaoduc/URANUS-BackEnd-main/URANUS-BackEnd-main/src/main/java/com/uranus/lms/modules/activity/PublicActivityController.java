package com.uranus.lms.modules.activity;

import com.uranus.lms.modules.activity.dto.PublicActivityResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Endpoint cho khách ghé thăm, không cần đăng nhập.
 * Nằm dưới /api/public/** nên đã được permitAll trong SecurityConfig.
 */
@RestController
@RequestMapping("/api/public/activities")
@RequiredArgsConstructor
public class PublicActivityController {

    private final ActivityService activityService;

    @GetMapping
    public ResponseEntity<Page<PublicActivityResponse>> list(
            @RequestParam(required = false) ActivityCategory category,
            @PageableDefault(size = 6) Pageable pageable) {
        return ResponseEntity.ok(activityService.getPublicActivities(category, pageable));
    }

    @GetMapping("/{slug}")
    public ResponseEntity<PublicActivityResponse> getBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(activityService.getPublicActivityBySlug(slug));
    }
}
