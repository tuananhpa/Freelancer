package com.uranus.lms.modules.gamification;

import com.uranus.lms.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/gamification")
@RequiredArgsConstructor
public class GamificationController {

    private final GamificationService gamificationService;

    @GetMapping
    public ResponseEntity<GamificationDto> getStats(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(gamificationService.getStats(userDetails.getUser()));
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<java.util.List<LeaderboardUserDto>> getLeaderboard(
            @RequestParam(required = false, defaultValue = "WEEK") String timeframe,
            @RequestParam(required = false, defaultValue = "TIME") String metric) {
        return ResponseEntity.ok(gamificationService.getGlobalLeaderboard(timeframe, metric));
    }

    @PostMapping("/activity")
    public ResponseEntity<GamificationDto> recordActivity(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        String type = body.getOrDefault("activityType", "DAILY_LOGIN");
        gamificationService.recordActivity(userDetails.getUser(), type);
        return ResponseEntity.ok(gamificationService.getStats(userDetails.getUser()));
    }
}
