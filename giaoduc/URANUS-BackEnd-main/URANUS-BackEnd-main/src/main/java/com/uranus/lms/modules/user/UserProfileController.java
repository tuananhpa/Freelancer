package com.uranus.lms.modules.user;

import com.uranus.lms.exception.BadRequestException;
import com.uranus.lms.modules.user.dto.ChangePasswordRequest;
import com.uranus.lms.modules.user.dto.RoleUpdateRequest;
import com.uranus.lms.modules.user.dto.UpdateProfileRequest;
import com.uranus.lms.modules.user.dto.UserProfileResponse;
import com.uranus.lms.security.JwtUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users/me")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserRepository userRepository;
    private final UserService userService;
    private final UserDetailsService userDetailsService;
    private final JwtUtils jwtUtils;

    @Value("${app.teacher.secret-code}")
    private String teacherSecretCode;

    @GetMapping
    public ResponseEntity<UserProfileResponse> getMyProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.getUserByEmail(userDetails.getUsername());
        return ResponseEntity.ok(UserProfileResponse.from(user));
    }

    @PutMapping
    public ResponseEntity<UserProfileResponse> updateMyProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateProfileRequest request) {
        User user = userService.getUserByEmail(userDetails.getUsername());
        User updated = userService.updateProfile(
                user,
                request.getFullName(),
                request.getPhone(),
                request.getAvatarUrl()
        );
        return ResponseEntity.ok(UserProfileResponse.from(updated));
    }

    @PutMapping("/password")
    public ResponseEntity<Map<String, String>> changeMyPassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ChangePasswordRequest request) {
        User user = userService.getUserByEmail(userDetails.getUsername());
        userService.changePassword(user, request.getCurrentPassword(), request.getNewPassword());
        return ResponseEntity.ok(Map.of("message", "Đổi mật khẩu thành công"));
    }

    @PutMapping("/role")
    public ResponseEntity<?> updateMyRole(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody RoleUpdateRequest request) {

        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new BadRequestException("Người dùng không tồn tại"));

        if (user.getRole() != Role.UNASSIGNED) {
            throw new BadRequestException("Bạn đã có vai trò trên hệ thống, không thể cập nhật lại.");
        }

        if (request.getRole() != Role.STUDENT && request.getRole() != Role.TEACHER && request.getRole() != Role.TEACHING_ASSISTANT) {
            throw new BadRequestException("Chỉ được chọn vai trò Học viên, Giáo viên hoặc Trợ giảng.");
        }

        if (request.getRole() == Role.TEACHER || request.getRole() == Role.TEACHING_ASSISTANT) {
            if (request.getSecurityCode() == null || !request.getSecurityCode().equals(teacherSecretCode)) {
                throw new BadRequestException("Mã xác nhận nội bộ không chính xác.");
            }
        }

        user.setRole(request.getRole());
        userRepository.save(user);

        UserDetails updatedUserDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String newAccessToken = jwtUtils.generateToken(updatedUserDetails);

        return ResponseEntity.ok(Map.of(
                "message", "Cập nhật vai trò thành công",
                "accessToken", newAccessToken,
                "role", user.getRole().name()
        ));
    }
}
