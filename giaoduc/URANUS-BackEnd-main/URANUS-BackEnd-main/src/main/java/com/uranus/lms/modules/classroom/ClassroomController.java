package com.uranus.lms.modules.classroom;

import com.uranus.lms.common.response.ApiResponse;
import com.uranus.lms.modules.classroom.dto.ClassPostResponse;
import com.uranus.lms.modules.classroom.dto.ClassroomResponse;
import com.uranus.lms.modules.classroom.dto.ClassMemberResponse;
import com.uranus.lms.modules.classroom.dto.ClassPostCommentResponse;
import com.uranus.lms.modules.classroom.dto.CreateClassPostCommentRequest;
import com.uranus.lms.modules.classroom.dto.CreateClassPostRequest;
import com.uranus.lms.modules.classroom.dto.CreateClassroomRequest;
import com.uranus.lms.modules.classroom.dto.LinkedCourseResponse;
import com.uranus.lms.modules.classroom.dto.ClassFolderResponse;
import com.uranus.lms.modules.classroom.dto.ClassResourceResponse;
import com.uranus.lms.modules.classroom.dto.AssignResourceRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import com.uranus.lms.exception.BadRequestException;

import java.util.UUID;

@RestController
@RequestMapping("/api/classes")
@RequiredArgsConstructor
public class ClassroomController {

    private final ClassroomService classroomService;
    private final ClassPostService classPostService;
    private final ClassPostCommentService classPostCommentService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ClassroomResponse>> createClassroom(
            @Valid @RequestBody CreateClassroomRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        ClassroomResponse response = classroomService.createClassroom(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response));
    }

    @PostMapping("/join")
    public ResponseEntity<ApiResponse<ClassroomResponse>> joinClassroom(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        String inviteCode = body.get("inviteCode");
        ClassroomResponse response = classroomService.joinClassroom(inviteCode, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ClassroomResponse>>> getMyClasses(
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(size = 1000, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ClassroomResponse> response = classroomService.getMyClasses(userDetails.getUsername(), pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'OFFICE')")
    public ResponseEntity<ApiResponse<List<ClassroomResponse>>> getAllClassroomsAdmin() {
        List<ClassroomResponse> response = classroomService.getAllClassrooms();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // --- ADMIN GROUPS (lớp tạm thời) ---

    @PostMapping("/admin/groups")
    @PreAuthorize("hasAnyRole('ADMIN', 'OFFICE')")
    public ResponseEntity<ApiResponse<ClassroomResponse>> createAdminGroup(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        String name = body.get("name");
        String description = body.getOrDefault("description", "");
        String subject = body.get("subject");
        ClassroomResponse response = classroomService.createAdminGroup(name, description, subject, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @GetMapping("/admin/groups")
    @PreAuthorize("hasAnyRole('ADMIN', 'OFFICE')")
    public ResponseEntity<ApiResponse<List<ClassroomResponse>>> getAdminGroups() {
        List<ClassroomResponse> response = classroomService.getAdminGroups();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/admin/groups/{classId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OFFICE')")
    public ResponseEntity<ApiResponse<ClassroomResponse>> updateAdminGroup(
            @PathVariable UUID classId,
            @RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        String section = (String) body.get("section");
        String subject = (String) body.get("subject");
        String teacherIdStr = (String) body.get("teacherId");
        UUID teacherId = null;
        if (teacherIdStr != null && !teacherIdStr.isEmpty()) {
            teacherId = UUID.fromString(teacherIdStr);
        }
        
        ClassroomResponse response = classroomService.updateAdminGroup(classId, name, section, subject, teacherId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/admin/groups/{classId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OFFICE')")
    public ResponseEntity<ApiResponse<Void>> deleteAdminGroup(@PathVariable UUID classId) {
        classroomService.deleteAdminGroup(classId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/{classId}")
    public ResponseEntity<ApiResponse<ClassroomResponse>> getClassroomById(
            @PathVariable UUID classId,
            @AuthenticationPrincipal UserDetails userDetails) {
        ClassroomResponse response = classroomService.getClassroomById(classId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // --- FOLDERS ---

    @GetMapping("/{classId}/folders")
    public ResponseEntity<ApiResponse<List<ClassFolderResponse>>> getClassFolders(
            @PathVariable UUID classId,
            @AuthenticationPrincipal UserDetails userDetails) {
        List<ClassFolderResponse> response = classroomService.getClassFolders(classId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{classId}/folders")
    
    public ResponseEntity<ApiResponse<ClassFolderResponse>> createClassFolder(
            @PathVariable UUID classId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        String name = body.get("name");
        UUID parentId = parseFolderId(body.get("parentId"));
        ClassFolderResponse response = classroomService.createClassFolder(
                classId, name, parentId, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @PutMapping("/{classId}/folders/{folderId}")
    
    public ResponseEntity<ApiResponse<ClassFolderResponse>> updateClassFolder(
            @PathVariable UUID classId,
            @PathVariable UUID folderId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        String name = body.get("name");
        // Co gui khoa "parentId" moi doi chu de cha. Gui kem gia tri rong nghia la
        // dua chu de ve cap goc; khong gui thi giu nguyen vi tri hien tai.
        boolean parentIdProvided = body.containsKey("parentId");
        UUID parentId = parseFolderId(body.get("parentId"));
        ClassFolderResponse response = classroomService.updateClassFolder(
                classId, folderId, name, parentId, parentIdProvided, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{classId}/folders/{folderId}")
    
    public ResponseEntity<ApiResponse<Void>> deleteClassFolder(
            @PathVariable UUID classId,
            @PathVariable UUID folderId,
            @AuthenticationPrincipal UserDetails userDetails) {
        classroomService.deleteClassFolder(classId, folderId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /** Chuoi rong hoac "null" tu giao dien deu duoc hieu la khong co chu de cha. */
    private UUID parseFolderId(String raw) {
        if (raw == null || raw.isBlank() || "null".equalsIgnoreCase(raw)) return null;
        try {
            return UUID.fromString(raw.trim());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Mã chủ đề cha không hợp lệ.");
        }
    }

    // --- MEMBERS ---

    @GetMapping("/{classId}/members")
    public ResponseEntity<ApiResponse<List<ClassMemberResponse>>> getMembers(
            @PathVariable UUID classId,
            @AuthenticationPrincipal UserDetails userDetails) {
        List<ClassMemberResponse> response = classroomService.getMembers(classId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{classId}/members")
    
    public ResponseEntity<ApiResponse<ClassMemberResponse>> addMember(
            @PathVariable UUID classId,
            @Valid @RequestBody com.uranus.lms.modules.classroom.dto.AddMemberRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        ClassMemberResponse response = classroomService.addMemberByEmail(classId, request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{classId}/members/{studentId}")
    
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @PathVariable UUID classId,
            @PathVariable UUID studentId,
            @AuthenticationPrincipal UserDetails userDetails) {
        classroomService.removeMember(classId, studentId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PutMapping("/{classId}/members/{studentId}/role")
    public ResponseEntity<ApiResponse<Void>> updateMemberRole(
            @PathVariable UUID classId,
            @PathVariable UUID studentId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        String role = body.get("role");
        classroomService.updateMemberRole(classId, studentId, role, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/{classId}/remind-deadline")
    public ResponseEntity<ApiResponse<Map<String, Object>>> remindDeadline(
            @PathVariable UUID classId,
            @AuthenticationPrincipal UserDetails userDetails) {
        int count = classroomService.broadcastDeadlineReminder(classId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(Map.of("notifiedCount", count, "message", "Đã gửi thông báo nhắc hạn chót tới " + count + " học viên.")));
    }

    // --- CLASS POSTS ---

    @PostMapping("/{classId}/posts")
    public ResponseEntity<ApiResponse<ClassPostResponse>> createPost(
            @PathVariable UUID classId,
            @Valid @RequestBody CreateClassPostRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        ClassPostResponse response = classPostService.createPost(classId, request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response));
    }

    @GetMapping("/{classId}/posts")
    public ResponseEntity<ApiResponse<Page<ClassPostResponse>>> getClassPosts(
            @PathVariable UUID classId,
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<ClassPostResponse> response = classPostService.getClassPosts(classId, userDetails.getUsername(), pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{classId}/posts/{postId}")
    public ResponseEntity<ApiResponse<ClassPostResponse>> updatePost(
            @PathVariable UUID classId,
            @PathVariable UUID postId,
            @Valid @RequestBody CreateClassPostRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        ClassPostResponse response = classPostService.updatePost(classId, postId, request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{classId}/posts/{postId}")
    public ResponseEntity<ApiResponse<Void>> deletePost(
            @PathVariable UUID classId,
            @PathVariable UUID postId,
            @AuthenticationPrincipal UserDetails userDetails) {
        classPostService.deletePost(classId, postId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/{classId}/posts/{postId}/like")
    public ResponseEntity<ApiResponse<ClassPostResponse>> toggleLike(
            @PathVariable UUID classId,
            @PathVariable UUID postId,
            @AuthenticationPrincipal UserDetails userDetails) {
        ClassPostResponse response = classPostService.toggleLike(classId, postId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{classId}/posts/{postId}/comments")
    public ResponseEntity<ApiResponse<List<ClassPostCommentResponse>>> getPostComments(
            @PathVariable UUID classId,
            @PathVariable UUID postId,
            @AuthenticationPrincipal UserDetails userDetails) {
        List<ClassPostCommentResponse> response = classPostCommentService.getComments(classId, postId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{classId}/posts/{postId}/comments")
    public ResponseEntity<ApiResponse<ClassPostCommentResponse>> addPostComment(
            @PathVariable UUID classId,
            @PathVariable UUID postId,
            @Valid @RequestBody CreateClassPostCommentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        ClassPostCommentResponse response = classPostCommentService.addComment(classId, postId, request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @PutMapping("/{classId}/posts/{postId}/comments/{commentId}")
    public ResponseEntity<ApiResponse<ClassPostCommentResponse>> updatePostComment(
            @PathVariable UUID classId,
            @PathVariable UUID postId,
            @PathVariable UUID commentId,
            @Valid @RequestBody CreateClassPostCommentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        ClassPostCommentResponse response = classPostCommentService.updateComment(classId, postId, commentId, request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{classId}/posts/{postId}/comments/{commentId}")
    public ResponseEntity<ApiResponse<Void>> deletePostComment(
            @PathVariable UUID classId,
            @PathVariable UUID postId,
            @PathVariable UUID commentId,
            @AuthenticationPrincipal UserDetails userDetails) {
        classPostCommentService.deleteComment(classId, postId, commentId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/{classId}/posts/{postId}/comments/{commentId}/like")
    public ResponseEntity<ApiResponse<ClassPostCommentResponse>> toggleLikeComment(
            @PathVariable UUID classId,
            @PathVariable UUID postId,
            @PathVariable UUID commentId,
            @AuthenticationPrincipal UserDetails userDetails) {
        ClassPostCommentResponse response = classPostCommentService.toggleLike(classId, postId, commentId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{classId}/courses")
    public ResponseEntity<ApiResponse<List<LinkedCourseResponse>>> getLinkedCourses(
            @PathVariable UUID classId,
            @AuthenticationPrincipal UserDetails userDetails) {
        List<LinkedCourseResponse> response = classroomService.getLinkedCourses(classId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{classId}/courses/{courseId}")
    
    public ResponseEntity<ApiResponse<LinkedCourseResponse>> linkCourse(
            @PathVariable UUID classId,
            @PathVariable UUID courseId,
            @AuthenticationPrincipal UserDetails userDetails) {
        LinkedCourseResponse response = classroomService.linkCourse(classId, courseId, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @DeleteMapping("/{classId}/courses/{courseId}")
    
    public ResponseEntity<ApiResponse<Void>> unlinkCourse(
            @PathVariable UUID classId,
            @PathVariable UUID courseId,
            @AuthenticationPrincipal UserDetails userDetails) {
        classroomService.unlinkCourse(classId, courseId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PutMapping("/{classId}/settings/leaderboard")
    
    public ResponseEntity<ApiResponse<Void>> updateLeaderboard(
            @PathVariable UUID classId,
            @RequestBody Map<String, Boolean> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        classroomService.updateLeaderboardEnabled(classId, Boolean.TRUE.equals(body.get("enabled")), userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PutMapping("/{classId}/settings/meeting-link")
    
    public ResponseEntity<ApiResponse<Void>> updateMeetingLink(
            @PathVariable UUID classId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        classroomService.updateMeetingLink(classId, body.get("meetingLink"), userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PutMapping("/{classId}/settings/info")
    public ResponseEntity<ApiResponse<ClassroomResponse>> updateClassInfo(
            @PathVariable UUID classId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        String name = body.get("name");
        String subject = body.get("subject");
        String section = body.get("section");
        
        ClassroomResponse response = classroomService.updateClassroom(classId, name, subject, section, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{classId}/settings/thumbnail")
    public ResponseEntity<ApiResponse<Void>> updateThumbnail(
            @PathVariable UUID classId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        classroomService.updateThumbnail(classId, body.get("thumbnail"), userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/{classId}/resources")
    public ResponseEntity<ApiResponse<List<ClassResourceResponse>>> getClassResources(
            @PathVariable UUID classId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(classroomService.getClassResources(classId, userDetails.getUsername())));
    }

    @PostMapping("/{classId}/resources")
    
    public ResponseEntity<ApiResponse<ClassResourceResponse>> assignResource(
            @PathVariable UUID classId,
            @RequestBody AssignResourceRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(classroomService.assignResource(classId, request, userDetails.getUsername())));
    }

    @DeleteMapping("/{classId}/resources/{resourceId}")
    
    public ResponseEntity<ApiResponse<Void>> removeResource(
            @PathVariable UUID classId,
            @PathVariable UUID resourceId,
            @AuthenticationPrincipal UserDetails userDetails) {
        classroomService.removeResource(classId, resourceId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
