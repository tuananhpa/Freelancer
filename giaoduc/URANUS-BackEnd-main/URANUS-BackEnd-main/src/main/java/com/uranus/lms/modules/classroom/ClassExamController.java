package com.uranus.lms.modules.classroom;

import com.uranus.lms.common.response.ApiResponse;
import com.uranus.lms.modules.classroom.dto.ClassExamRequest;
import com.uranus.lms.modules.classroom.dto.ClassExamResponse;
import com.uranus.lms.modules.classroom.dto.UpdateClassExamRequest;
import com.uranus.lms.security.UserDetailsImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/class-exams")
@RequiredArgsConstructor
public class ClassExamController {

    private final ClassExamService classExamService;

    @GetMapping("/classroom/{classroomId}")
    public ResponseEntity<ApiResponse<List<ClassExamResponse>>> getClassExams(@PathVariable UUID classroomId) {
        return ResponseEntity.ok(ApiResponse.success(classExamService.getClassExams(classroomId)));
    }

    @PostMapping("/classroom/{classroomId}")
    @PreAuthorize("hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN')")
    public ResponseEntity<ApiResponse<ClassExamResponse>> linkExamToClassroom(
            @PathVariable UUID classroomId,
            @Valid @RequestBody ClassExamRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(ApiResponse.success(classExamService.linkExamToClassroom(classroomId, request, userDetails.getUser())));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> unlinkExamFromClassroom(@PathVariable UUID id, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        classExamService.unlinkExamFromClassroom(id, userDetails.getUser());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN')")
    public ResponseEntity<ApiResponse<ClassExamResponse>> updateClassExam(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateClassExamRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(ApiResponse.success(classExamService.updateClassExam(id, request, userDetails.getUser())));
    }

    @GetMapping("/exam/{examId}")
    @PreAuthorize("hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<ClassExamResponse>>> getClassExamsByExamId(@PathVariable UUID examId, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(ApiResponse.success(classExamService.getClassExamsByExamId(examId, userDetails.getUser())));
    }

    @PostMapping("/exam/{examId}/batch-sync")
    @PreAuthorize("hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> batchSyncClassExams(
            @PathVariable UUID examId,
            @RequestBody com.uranus.lms.modules.classroom.dto.BatchSyncClassExamRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        classExamService.batchSyncClassExams(examId, request, userDetails.getUser());
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
