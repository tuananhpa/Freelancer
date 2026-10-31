package com.uranus.lms.modules.analytics;

import com.uranus.lms.modules.user.User;
import com.uranus.lms.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/teacher")
    public ResponseEntity<AnalyticsDto.TeacherDashboardStats> getTeacherStats(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(analyticsService.getTeacherStats(userDetails.getUser()));
    }

    @GetMapping("/student")
    public ResponseEntity<AnalyticsDto.StudentDashboardStats> getStudentStats(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(analyticsService.getStudentStats(userDetails.getUser()));
    }

    @GetMapping("/progress-report")
    public ResponseEntity<AnalyticsDto.ProgressReport> getProgressReport(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(analyticsService.getProgressReport(userDetails.getUser()));
    }

    @GetMapping("/admin")
    public ResponseEntity<AnalyticsDto.AdminDashboardStats> getAdminStats() {
        return ResponseEntity.ok(analyticsService.getAdminStats());
    }
}
