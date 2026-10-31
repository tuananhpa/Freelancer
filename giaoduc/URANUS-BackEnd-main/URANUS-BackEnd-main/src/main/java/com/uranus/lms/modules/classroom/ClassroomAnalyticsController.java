package com.uranus.lms.modules.classroom;

import com.uranus.lms.common.response.ApiResponse;
import com.uranus.lms.modules.classroom.dto.GradebookResponse;
import com.uranus.lms.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/classrooms")
@RequiredArgsConstructor
public class ClassroomAnalyticsController {

    private final ClassroomAnalyticsService analyticsService;

    @GetMapping("/{id}/gradebook")
    @PreAuthorize("hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN', 'STUDENT')")
    public ResponseEntity<ApiResponse<GradebookResponse>> getGradebook(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getGradebook(id, userDetails.getUser())));
    }

    @GetMapping("/{id}/leaderboard")
    public ResponseEntity<ApiResponse<java.util.List<ClassroomAnalyticsService.LeaderboardEntryDto>>> getLeaderboard(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getLeaderboard(id, userDetails.getUser())));
    }
}
