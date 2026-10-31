package com.uranus.lms.modules.auth;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.uranus.lms.common.exception.AppException;
import com.uranus.lms.common.exception.ErrorCode;
import com.uranus.lms.exception.BadRequestException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import com.uranus.lms.modules.auth.dto.AuthResponse;
import com.uranus.lms.modules.auth.dto.GoogleLoginRequest;
import com.uranus.lms.modules.auth.dto.LoginRequest;
import com.uranus.lms.modules.auth.dto.RegisterRequest;
import com.uranus.lms.modules.user.AuthProvider;
import com.uranus.lms.modules.user.Role;
import com.uranus.lms.modules.user.User;
import com.uranus.lms.modules.user.UserRepository;
import com.uranus.lms.modules.user.UserStatus;
import com.uranus.lms.modules.student.StudentProfile;
import com.uranus.lms.modules.student.StudentProfileRepository;
import com.uranus.lms.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    
    private final VerificationTokenRepository verificationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailService emailService;
    private final StudentProfileRepository studentProfileRepository;
    
    @org.springframework.context.annotation.Lazy
    @org.springframework.beans.factory.annotation.Autowired
    private com.uranus.lms.modules.student.StudentProfileService studentProfileService;

    @Value("${app.google.client-id}")
    private String googleClientId;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    private String formatFullName(String name) {
        if (name == null || name.trim().isEmpty()) return name;
        String[] words = name.trim().toLowerCase().split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String word : words) {
            if (!word.isEmpty()) {
                sb.append(Character.toUpperCase(word.charAt(0))).append(word.substring(1)).append(" ");
            }
        }
        return sb.toString().trim();
    }

    @Transactional
    public String register(RegisterRequest request) {
        if (request.getEmail() != null) {
            request.setEmail(request.getEmail().toLowerCase());
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email đã được sử dụng.");
        }
        java.util.Optional<User> existingUserOpt = userRepository.findByEmail(request.getEmail());
        User user;

        if (existingUserOpt.isPresent()) {
            user = existingUserOpt.get();
            if (user.getStatus() == UserStatus.ACTIVE) {
                throw new BadRequestException("Tài khoản với email này đã được kích hoạt.");
            }
            user.setFullName(formatFullName(request.getFullName()));
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            user.setPhone(request.getPhone());
            user.setRole(Role.STUDENT);
            user.setAuthProvider(AuthProvider.LOCAL);
            
            // Delete old verification tokens
            verificationTokenRepository.deleteByUser_Id(user.getId());
        } else {
            user = User.builder()
                    .fullName(formatFullName(request.getFullName()))
                    .email(request.getEmail())
                    .password(passwordEncoder.encode(request.getPassword()))
                    .phone(request.getPhone())
                    .role(Role.STUDENT)
                    .status(UserStatus.INACTIVE) // Requires email verification
                    .authProvider(AuthProvider.LOCAL)
                    .build();
        }

        userRepository.save(user);

        // Create verification token (6 digit OTP)
        String otp = String.format("%06d", new java.util.Random().nextInt(999999));
        VerificationToken verificationToken = VerificationToken.builder()
                .token(otp)
                .user(user)
                .expiryDate(LocalDateTime.now().plusHours(24))
                .build();
        verificationTokenRepository.save(verificationToken);

        // Send email
        String emailContent = "<h3>Xin chào " + user.getFullName() + ",</h3>"
                + "<p>Cảm ơn bạn đã đăng ký tài khoản tại URANUS LMS.</p>"
                + "<p>Mã xác nhận tài khoản của bạn là:</p>"
                + "<h2 style=\"color: #f97316; font-size: 24px; letter-spacing: 5px;\">" + otp + "</h2>"
                + "<p>Vui lòng nhập mã này trên trang đăng ký để kích hoạt tài khoản của bạn (mã có hiệu lực trong 24 giờ).</p>"
                + "<p>Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email.</p>";
                
        emailService.sendEmail(user.getEmail(), "Mã xác nhận tài khoản URANUS LMS", emailContent);
        
        log.info("========== LOCAL TESTING EMAIL OTP ==========");
        log.info("OTP for {}: {}", user.getEmail(), otp);
        log.info("==============================================");

        return "Đăng ký thành công. Vui lòng kiểm tra email để kích hoạt tài khoản.";
    }

    @Transactional
    public String verifyEmail(String email, String otp) {
        if (email != null) email = email.toLowerCase();
        VerificationToken verificationToken = verificationTokenRepository.findByUser_EmailAndToken(email, otp)
                .orElseThrow(() -> new BadRequestException("Mã xác nhận không hợp lệ hoặc đã hết hạn."));

        if (verificationToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            verificationTokenRepository.delete(verificationToken);
            throw new BadRequestException("Mã xác nhận đã hết hạn. Vui lòng yêu cầu gửi lại mã.");
        }

        User user = verificationToken.getUser();
        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);

        if (user.getPendingStudentCode() != null && !user.getPendingStudentCode().trim().isEmpty()) {
            try {
                studentProfileService.linkPendingAccount(user);
            } catch (Exception e) {
                // If it fails (e.g. someone else claimed it), we should throw an exception to roll back the transaction
                // This means the user will NOT be activated, and the OTP remains until expiration.
                throw new BadRequestException("Lỗi khi liên kết mã học sinh: " + e.getMessage());
            }
        }

        verificationTokenRepository.delete(verificationToken);
        return "Xác thực email thành công!";
    }

    @Transactional
    public String resendVerificationCode(String email) {
        if (email != null) email = email.toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy người dùng với email này."));

        if (user.getStatus() == UserStatus.ACTIVE) {
            throw new BadRequestException("Tài khoản này đã được kích hoạt.");
        }

        // Xóa token cũ
        verificationTokenRepository.deleteByUser_Id(user.getId());

        // Tạo token mới
        String otp = String.format("%06d", new java.util.Random().nextInt(999999));
        VerificationToken verificationToken = VerificationToken.builder()
                .token(otp)
                .user(user)
                .expiryDate(LocalDateTime.now().plusHours(24))
                .build();
        verificationTokenRepository.save(verificationToken);

        // Send email
        String emailContent = "<h3>Xin chào " + user.getFullName() + ",</h3>"
                + "<p>Mã xác nhận tài khoản mới của bạn là:</p>"
                + "<h2 style=\"color: #f97316; font-size: 24px; letter-spacing: 5px;\">" + otp + "</h2>"
                + "<p>Vui lòng nhập mã này để kích hoạt tài khoản của bạn (mã có hiệu lực trong 24 giờ).</p>"
                + "<p>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email.</p>";

        emailService.sendEmail(user.getEmail(), "Mã xác nhận tài khoản URANUS LMS", emailContent);

        log.info("========== LOCAL TESTING EMAIL OTP ==========");
        log.info("Resend OTP for {}: {}", user.getEmail(), otp);
        log.info("==============================================");

        return "Đã gửi lại mã xác nhận. Vui lòng kiểm tra email.";
    }

    @Transactional
    public String forgotPassword(String email) {
        if (email != null) email = email.toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy người dùng với email này."));

        if (user.getAuthProvider() != AuthProvider.LOCAL) {
            throw new BadRequestException("Tài khoản này được đăng nhập bằng " + user.getAuthProvider().name() + " nên không thể đặt lại mật khẩu.");
        }

        // Delete existing reset tokens
        passwordResetTokenRepository.deleteByUser_Id(user.getId());

        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .user(user)
                .expiryDate(LocalDateTime.now().plusMinutes(15))
                .build();
        passwordResetTokenRepository.save(resetToken);

        // Send email
        String resetLink = frontendUrl + "/reset-password?token=" + token;

        String emailContent = "<h3>Xin chào " + user.getFullName() + ",</h3>"
                + "<p>Bạn đã yêu cầu đặt lại mật khẩu tại URANUS LMS.</p>"
                + "<p>Vui lòng click vào đường dẫn sau để đặt mật khẩu mới (có hiệu lực trong 15 phút):</p>"
                + "<a href=\"" + resetLink + "\">Đặt lại mật khẩu</a>"
                + "<p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>";

        emailService.sendEmail(user.getEmail(), "Yêu cầu khôi phục mật khẩu URANUS LMS", emailContent);

        log.info("========== LOCAL TESTING EMAIL LINK ==========");
        log.info("Password Reset link for {}: {}", user.getEmail(), resetLink);
        log.info("==============================================");

        return "Vui lòng kiểm tra email để đặt lại mật khẩu.";
    }

    @Transactional
    public String resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new BadRequestException("Token không hợp lệ hoặc đã hết hạn."));

        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            passwordResetTokenRepository.delete(resetToken);
            throw new BadRequestException("Token đã hết hạn. Vui lòng gửi lại yêu cầu.");
        }

        User user = resetToken.getUser();
        userRepository.updatePassword(user.getId(), passwordEncoder.encode(newPassword));

        passwordResetTokenRepository.delete(resetToken);
        return "Đặt lại mật khẩu thành công!";
    }

    public AuthResponse login(LoginRequest request) {
        User user;

        // Determine login method: studentCode or email
        if (request.getStudentCode() != null && !request.getStudentCode().isBlank()) {
            // Login by student code (sanitized and case-insensitive)
            String cleanCode = com.uranus.lms.modules.student.StudentProfileService.sanitizeStudentCode(request.getStudentCode());
            StudentProfile profile = studentProfileRepository.findByStudentCodeIgnoreCase(cleanCode)
                    .orElseThrow(() -> new BadRequestException("Mã số học sinh không tồn tại trong hệ thống."));

            if (profile.getUser() == null) {
                throw new BadRequestException("Mã số học sinh này chưa được liên kết với tài khoản. Vui lòng đăng ký trước.");
            }

            user = profile.getUser();
        } else if (request.getEmail() != null && !request.getEmail().isBlank()) {
            // Login by email (backward compatibility for admin/teacher)
            String email = request.getEmail().toLowerCase();
            user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new BadRequestException("Email hoặc mật khẩu không đúng"));
        } else {
            throw new BadRequestException("Vui lòng nhập mã số học sinh hoặc email.");
        }

        if (user.getAuthProvider() != AuthProvider.LOCAL) {
            throw new BadRequestException("Tài khoản này đăng nhập bằng " + user.getAuthProvider().name() + ". Vui lòng sử dụng đúng phương thức.");
        }

        if (user.getStatus() == UserStatus.INACTIVE) {
            throw new BadRequestException("Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email để xác thực tài khoản.");
        }

        if (user.getStatus() == UserStatus.BANNED) {
            throw new AppException(ErrorCode.ACCOUNT_LOCKED);
        }

        // Wrap authenticate() to prevent BadCredentialsException from bypassing GlobalExceptionHandler
        // Spring Security's ExceptionTranslationFilter would otherwise intercept it and return 403
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(user.getEmail(), request.getPassword())
            );
        } catch (BadCredentialsException e) {
            throw new BadRequestException("Mã số học sinh hoặc mật khẩu không đúng");
        } catch (DisabledException | LockedException e) {
            throw new BadRequestException("Tài khoản đã bị khóa hoặc vô hiệu hóa.");
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String accessToken = jwtUtils.generateToken(userDetails);
        String refreshToken = jwtUtils.generateRefreshToken(userDetails);

        return buildAuthResponse(user, accessToken, refreshToken);
    }

    @Transactional
    public AuthResponse loginWithGoogle(GoogleLoginRequest request) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(request.getToken());
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<java.util.Map> response = restTemplate.exchange(
                    "https://www.googleapis.com/oauth2/v3/userinfo",
                    HttpMethod.GET,
                    entity,
                    java.util.Map.class
            );

            java.util.Map<String, Object> payload = response.getBody();
            if (payload == null || !payload.containsKey("email")) {
                throw new BadRequestException("Không thể lấy thông tin người dùng từ Google.");
            }

            String email = (String) payload.get("email");
            String name = (String) payload.get("name");
            String pictureUrl = (String) payload.get("picture");

            User user = userRepository.findByEmail(email).orElseGet(() -> {
                User newUser = User.builder()
                        .email(email)
                        .fullName(name)
                        .avatarUrl(pictureUrl)
                        .role(Role.STUDENT)
                        .status(UserStatus.ACTIVE)
                        .authProvider(AuthProvider.GOOGLE)
                        .build();
                return userRepository.save(newUser);
            });

            if (user.getStatus() == UserStatus.BANNED) {
                throw new BadRequestException("Tài khoản của bạn đã bị khóa.");
            }

            if (user.getAuthProvider() == AuthProvider.LOCAL) {
                throw new BadRequestException("Email này đã được đăng ký bằng mật khẩu. Vui lòng đăng nhập bằng mật khẩu.");
            }

            UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
            String accessToken = jwtUtils.generateToken(userDetails);
            String refreshToken = jwtUtils.generateRefreshToken(userDetails);

            return buildAuthResponse(user, accessToken, refreshToken);
        } catch (BadRequestException e) {
            throw e; // Re-throw known application errors as-is
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            // Google rejected the access token (401 or 400 from Google API)
            throw new BadRequestException("Token Google không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.");
        } catch (Exception e) {
            throw new BadRequestException("Xác thực Google thất bại: " + e.getMessage());
        }
    }


    private AuthResponse buildAuthResponse(User user, String accessToken, String refreshToken) {
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(AuthResponse.UserDto.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .fullName(user.getFullName())
                        .role(user.getRole().name())
                        .avatarUrl(user.getAvatarUrl())
                        .build())
                .build();
    }
}
