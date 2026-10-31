package com.uranus.lms.modules.user;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;

import java.util.UUID;
import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<Page<User>> getAllUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) UserStatus status,
            @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(userService.getAllUsers(search, role, status, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User user) {
        return ResponseEntity.ok(userService.createUser(user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable UUID id, @RequestBody User user) {
        return ResponseEntity.ok(userService.updateUser(id, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID id) {
        userService.deleteUser(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/classrooms")
    public ResponseEntity<List<UUID>> getUserClassrooms(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.getUserClassrooms(id));
    }

    @PutMapping("/{id}/classrooms")
    public ResponseEntity<Void> updateUserClassrooms(@PathVariable UUID id, @RequestBody List<UUID> classroomIds) {
        userService.updateUserClassrooms(id, classroomIds);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/bulk-status")
    public ResponseEntity<Void> bulkUpdateUserStatus(@RequestBody com.uranus.lms.modules.user.dto.BulkUserStatusUpdateRequest request) {
        userService.bulkUpdateUserStatus(request.getUserIds(), request.getStatus());
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/student-code")
    public ResponseEntity<User> updateStudentCode(
            @PathVariable UUID id,
            @RequestBody @jakarta.validation.Valid com.uranus.lms.modules.user.dto.UpdateStudentCodeRequest request) {
        return ResponseEntity.ok(userService.updateStudentCode(id, request.getStudentCode()));
    }
}
