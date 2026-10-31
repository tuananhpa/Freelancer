package com.uranus.lms.modules.student;

import com.uranus.lms.common.response.ApiResponse;
import com.uranus.lms.modules.student.dto.CreateStudentProfileRequest;
import com.uranus.lms.modules.student.dto.UpdateStudentClassroomsRequest;
import com.uranus.lms.modules.student.dto.RegisterWithStudentCodeRequest;
import com.uranus.lms.modules.student.dto.StudentProfileResponse;
import com.uranus.lms.modules.student.dto.UpdateStudentProfileRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/students")
@RequiredArgsConstructor
public class StudentProfileController {

    private final StudentProfileService studentProfileService;

    /**
     * Admin imports a list of students from Excel and maps them to a classroom.
     */
    @PostMapping("/import")
    @PreAuthorize("hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN', 'OFFICE')")
    public ResponseEntity<ApiResponse<List<StudentProfileResponse>>> importStudents(
            @RequestParam("file") MultipartFile file,
            @RequestParam("classroomId") UUID classroomId) {
        List<StudentProfileResponse> results = studentProfileService.importFromExcel(file, classroomId);
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    /**
     * Admin imports a list of students from Excel globally (without a classroom).
     */
    @PostMapping("/import-global")
    @PreAuthorize("hasAnyRole('ADMIN', 'OFFICE')")
    public ResponseEntity<ApiResponse<List<StudentProfileResponse>>> importGlobalStudents(
            @RequestParam("file") MultipartFile file) {
        List<StudentProfileResponse> results = studentProfileService.importGlobalStudents(file);
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    /**
     * Admin imports students from Excel with optional classroom assignment.
     * If classroomId is provided, students are added to that class (additive — they keep existing classes).
     * If omitted, students are imported globally.
     */
    @PostMapping("/import-admin")
    @PreAuthorize("hasAnyRole('ADMIN', 'OFFICE')")
    public ResponseEntity<ApiResponse<List<StudentProfileResponse>>> importAdminStudents(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "classroomId", required = false) UUID classroomId) {
        List<StudentProfileResponse> results = studentProfileService.importAdminStudents(file, classroomId);
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    /**
     * Admin: get all students enrolled in a specific classroom (by classroomId).
     */
    @GetMapping("/by-classroom/{classroomId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OFFICE')")
    public ResponseEntity<ApiResponse<List<StudentProfileResponse>>> getStudentsByClassroom(
            @PathVariable UUID classroomId) {
        List<StudentProfileResponse> results = studentProfileService.getStudentsByClassroom(classroomId);
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    /**
     * Admin views all imported student profiles with optional search.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN', 'OFFICE')")
    public ResponseEntity<ApiResponse<Page<StudentProfileResponse>>> getStudents(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String className,
            @RequestParam(required = false) String facility,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String teacherName,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(studentProfileService.getAll(keyword, className, facility, status, teacherName, fromDate, toDate, pageable)));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN', 'OFFICE')")
    public ResponseEntity<ApiResponse<StudentProfileResponse>> getStudentProfileByUserId(
            @PathVariable UUID userId) {
        StudentProfileResponse response = studentProfileService.getProfileByUserId(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Admin: Update a student profile's editable info.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OFFICE')")
    public ResponseEntity<ApiResponse<StudentProfileResponse>> updateProfile(
            @PathVariable UUID id,
            @RequestBody UpdateStudentProfileRequest request) {
        StudentProfileResponse updated = studentProfileService.updateProfile(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated));
    }

    /**
     * Admin: Delete a student profile.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OFFICE')")
    public ResponseEntity<ApiResponse<Void>> deleteProfile(@PathVariable UUID id) {
        studentProfileService.deleteProfile(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /**
     * Admin: Bulk delete student profiles.
     */
    @DeleteMapping("/bulk")
    @PreAuthorize("hasAnyRole('ADMIN', 'OFFICE')")
    public ResponseEntity<ApiResponse<Void>> bulkDeleteProfiles(@RequestBody List<UUID> ids) {
        studentProfileService.bulkDeleteProfiles(ids);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /**
     * Admin: Manually create a student profile or link an existing one to a classroom.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OFFICE')")
    public ResponseEntity<ApiResponse<StudentProfileResponse>> createOrLinkProfile(
            @Valid @RequestBody CreateStudentProfileRequest request) {
        StudentProfileResponse response = studentProfileService.createOrLinkProfile(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Admin: Add an existing student to a classroom.
     */
    @PostMapping("/{id}/classrooms/{classroomId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OFFICE')")
    public ResponseEntity<ApiResponse<Void>> addStudentToClassroom(
            @PathVariable UUID id, @PathVariable UUID classroomId) {
        studentProfileService.addStudentToClassroom(id, classroomId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /**
     * Admin: Remove a student from a classroom.
     */
    @DeleteMapping("/{id}/classrooms/{classroomId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OFFICE')")
    public ResponseEntity<ApiResponse<Void>> removeStudentFromClassroom(
            @PathVariable UUID id, @PathVariable UUID classroomId) {
        studentProfileService.removeStudentFromClassroom(id, classroomId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /**
     * Admin: Update the full list of classrooms for a student.
     */
    @PutMapping("/{id}/classrooms")
    @PreAuthorize("hasAnyRole('ADMIN', 'OFFICE')")
    public ResponseEntity<ApiResponse<StudentProfileResponse>> updateStudentClassrooms(
            @PathVariable UUID id, @Valid @RequestBody UpdateStudentClassroomsRequest request) {
        StudentProfileResponse response = studentProfileService.updateStudentClassrooms(id, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Public endpoint: check if a student code exists (used before registration to show info).
     */
    @GetMapping("/verify-code")
    public ResponseEntity<ApiResponse<StudentProfileResponse>> verifyStudentCode(
            @RequestParam String code,
            @RequestParam String fullName) {
        StudentProfileResponse response = studentProfileService.verifyStudentCode(code, fullName);
        // Mask phone for privacy
        if (response.getPhone() != null && response.getPhone().length() > 4) {
            response.setPhone("****" + response.getPhone().substring(response.getPhone().length() - 4));
        }
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Public endpoint: register a new user account linked to student code.
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<String>> register(@Valid @RequestBody RegisterWithStudentCodeRequest request) {
        String result = studentProfileService.registerWithStudentCode(request);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Manually link an orphan STUDENT account to a StudentProfile.
     */
    @PostMapping("/link-account")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<String>> linkAccount(
            @Valid @RequestBody RegisterWithStudentCodeRequest request,
            org.springframework.security.core.Authentication authentication) {
        com.uranus.lms.security.UserDetailsImpl userDetails = (com.uranus.lms.security.UserDetailsImpl) authentication.getPrincipal();
        String result = studentProfileService.linkLegacyAccount(userDetails.getUser(), request);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
