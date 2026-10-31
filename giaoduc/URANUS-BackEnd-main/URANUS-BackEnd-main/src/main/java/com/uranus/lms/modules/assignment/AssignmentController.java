package com.uranus.lms.modules.assignment;

import com.uranus.lms.common.response.ApiResponse;
import com.uranus.lms.modules.assignment.dto.*;
import com.uranus.lms.modules.user.User;
import com.uranus.lms.security.UserDetailsImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/assignments")
@RequiredArgsConstructor
public class AssignmentController {

    private final AssignmentService assignmentService;

    // --- Core Assignment Endpoints ---

    @GetMapping("/course/{courseId}")
    public ResponseEntity<ApiResponse<Page<AssignmentResponse>>> getAssignmentsByCourse(
            @PathVariable UUID courseId,
            Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(assignmentService.getAssignmentsByCourse(courseId, pageable)));
    }

    @GetMapping("/classroom/{classroomId}")
    public ResponseEntity<ApiResponse<Page<AssignmentResponse>>> getAssignmentsByClassroom(
            @PathVariable UUID classroomId,
            Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(assignmentService.getAssignmentsByClassroom(classroomId, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AssignmentResponse>> getAssignmentById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(assignmentService.getAssignmentById(id)));
    }

    @PostMapping
    
    public ResponseEntity<ApiResponse<AssignmentResponse>> createAssignment(
            @Valid @RequestBody CreateAssignmentRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(ApiResponse.success(assignmentService.createAssignment(request, userDetails.getUser())));
    }

    @PutMapping("/{id}")
    
    public ResponseEntity<ApiResponse<AssignmentResponse>> updateAssignment(
            @PathVariable UUID id,
            @Valid @RequestBody CreateAssignmentRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(ApiResponse.success(assignmentService.updateAssignment(id, request, userDetails.getUser())));
    }

    @DeleteMapping("/{id}")
    
    public ResponseEntity<ApiResponse<Void>> deleteAssignment(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        assignmentService.deleteAssignment(id, userDetails.getUser());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // --- Submissions ---

    @PostMapping("/{id}/submit")
    
    public ResponseEntity<ApiResponse<AssignmentSubmissionResponse>> submitAssignment(
            @PathVariable UUID id,
            @RequestBody SubmitAssignmentRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(ApiResponse.success(assignmentService.submitAssignment(id, userDetails.getUser(), request)));
    }

    @GetMapping("/{id}/submissions/my")
    
    public ResponseEntity<ApiResponse<AssignmentSubmissionResponse>> getMySubmission(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(ApiResponse.success(assignmentService.getMySubmission(id, userDetails.getUser())));
    }

    @GetMapping("/{id}/submissions")
    
    public ResponseEntity<ApiResponse<Page<AssignmentSubmissionResponse>>> getSubmissionsByAssignment(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(assignmentService.getSubmissionsByAssignment(id, userDetails.getUser(), pageable)));
    }

    @PostMapping("/submissions/{submissionId}/grade")
    
    public ResponseEntity<ApiResponse<AssignmentSubmissionResponse>> gradeSubmission(
            @PathVariable UUID submissionId,
            @Valid @RequestBody GradeAssignmentRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(ApiResponse.success(assignmentService.gradeSubmission(submissionId, request, userDetails.getUser())));
    }
}
