package com.uranus.lms.modules.learningpath;

import com.uranus.lms.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/learning-path")
@RequiredArgsConstructor
public class LearningPathController {

    private final LearningPathService learningPathService;

    @GetMapping("/status")
    public ResponseEntity<LearningPathDto.StatusResponse> getStatus(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(learningPathService.getStatus(userDetails.getUser()));
    }

    @PostMapping("/placement")
    public ResponseEntity<LearningPathDto.StatusResponse> submitPlacement(
            @RequestBody Map<String, Integer> skillScores,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(learningPathService.submitPlacement(userDetails.getUser(), skillScores));
    }

    @GetMapping("/placement-test")
    public ResponseEntity<LearningPathDto.PlacementTestResponse> getPlacementTest() {
        return ResponseEntity.ok(learningPathService.getPlacementTest());
    }

    @PostMapping("/placement-test/submit")
    public ResponseEntity<LearningPathDto.StatusResponse> submitPlacementTest(
            @RequestBody Map<String, String> answers,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(learningPathService.submitPlacementTest(userDetails.getUser(), answers));
    }

    @GetMapping("/recommendations")
    public ResponseEntity<LearningPathDto.RecommendationsResponse> getRecommendations(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(learningPathService.getRecommendations(userDetails.getUser()));
    }
}
