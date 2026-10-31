package com.uranus.lms.modules.assignment;

import com.uranus.lms.common.response.ApiResponse;
import com.uranus.lms.modules.assignment.dto.writing.*;
import com.uranus.lms.security.UserDetailsImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class AiWritingGradingController {

    private final AiWritingGradingService gradingService;

    // --- Single Submission AI Grading ---

    @PostMapping({"/api/v1/assignments/submissions/{submissionId}/ai-grade", "/api/submissions/{submissionId}/ai-grade"})
    public ResponseEntity<ApiResponse<WritingAssessmentResponseDto>> gradeSubmission(
            @PathVariable UUID submissionId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        WritingAssessmentResponseDto response = gradingService.gradeSubmissionSync(submissionId, false, userDetails.getUser());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping({"/api/v1/assignments/submissions/{submissionId}/ai-grading/regrade", "/api/submissions/{submissionId}/ai-grading/regrade"})
    public ResponseEntity<ApiResponse<WritingAssessmentResponseDto>> regradeSubmission(
            @PathVariable UUID submissionId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        WritingAssessmentResponseDto response = gradingService.regradeSubmission(submissionId, userDetails.getUser());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping({"/api/v1/assignments/submissions/{submissionId}/ai-grading", "/api/submissions/{submissionId}/ai-grading"})
    public ResponseEntity<ApiResponse<WritingAssessmentResponseDto>> getAssessment(
            @PathVariable UUID submissionId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        WritingAssessmentResponseDto response = gradingService.getAssessmentBySubmissionId(submissionId, userDetails.getUser());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping({"/api/v1/assignments/submissions/{submissionId}/ai-grading", "/api/submissions/{submissionId}/ai-grading"})
    public ResponseEntity<ApiResponse<WritingAssessmentResponseDto>> updateTeacherAssessment(
            @PathVariable UUID submissionId,
            @Valid @RequestBody UpdateAssessmentRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        WritingAssessmentResponseDto response = gradingService.updateTeacherAssessment(submissionId, request, userDetails.getUser());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // --- Batch AI Grading ---

    @PostMapping("/api/v1/assignments/{assignmentId}/ai-grade")
    public ResponseEntity<ApiResponse<BatchAiGradingStatusResponse>> gradeAllInAssignment(
            @PathVariable UUID assignmentId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        BatchAiGradingStatusResponse response = gradingService.batchGradeSubmissions(assignmentId, null, userDetails.getUser());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping({"/api/v1/assignments/ai-grading/batch", "/api/ai-grading/batch"})
    public ResponseEntity<ApiResponse<BatchAiGradingStatusResponse>> batchGradeSelected(
            @RequestParam(required = false) UUID assignmentId,
            @RequestBody BatchAiGradingRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        UUID targetAssignmentId = assignmentId;
        if (targetAssignmentId == null && request.getSubmissionIds() != null && !request.getSubmissionIds().isEmpty()) {
            // Lấy assignmentId từ submission đầu tiên nếu không truyền
            targetAssignmentId = gradingService.getAssessmentBySubmissionId(request.getSubmissionIds().get(0), userDetails.getUser()).getAssignmentId();
        }
        BatchAiGradingStatusResponse response = gradingService.batchGradeSubmissions(targetAssignmentId, request.getSubmissionIds(), userDetails.getUser());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping({"/api/v1/assignments/{assignmentId}/ai-grading/batch-status/{batchId}", "/api/ai-grading/batch-status/{batchId}"})
    public ResponseEntity<ApiResponse<BatchAiGradingStatusResponse>> getBatchStatus(
            @PathVariable String batchId) {
        BatchAiGradingStatusResponse response = gradingService.getBatchStatus(batchId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
