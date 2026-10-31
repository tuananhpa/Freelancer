package com.uranus.lms.modules.student;

import com.uranus.lms.exception.BadRequestException;
import com.uranus.lms.exception.ResourceNotFoundException;
import com.uranus.lms.modules.auth.AuthService;
import com.uranus.lms.modules.auth.EmailService;
import com.uranus.lms.modules.auth.VerificationToken;
import com.uranus.lms.modules.auth.VerificationTokenRepository;
import com.uranus.lms.modules.auth.dto.AuthResponse;
import com.uranus.lms.modules.classroom.ClassMember;
import com.uranus.lms.modules.classroom.ClassMemberRepository;
import com.uranus.lms.modules.classroom.ClassMemberRole;
import com.uranus.lms.modules.classroom.Classroom;
import com.uranus.lms.modules.classroom.ClassroomRepository;
import com.uranus.lms.modules.student.dto.RegisterWithStudentCodeRequest;
import com.uranus.lms.modules.student.dto.StudentProfileResponse;
import com.uranus.lms.modules.student.dto.UpdateStudentProfileRequest;
import com.uranus.lms.modules.student.dto.CreateStudentProfileRequest;
import com.uranus.lms.modules.student.dto.UpdateStudentClassroomsRequest;
import com.uranus.lms.modules.user.AuthProvider;
import com.uranus.lms.modules.user.Role;
import com.uranus.lms.modules.user.User;
import com.uranus.lms.modules.user.UserRepository;
import com.uranus.lms.modules.user.UserStatus;
import com.uranus.lms.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StudentProfileService {

    private final StudentProfileRepository studentProfileRepository;
    private final StudentClassEnrollmentRepository studentClassEnrollmentRepository;
    private final ClassroomRepository classroomRepository;
    private final ClassMemberRepository classMemberRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final UserDetailsService userDetailsService;
    private final VerificationTokenRepository verificationTokenRepository;
    private final EmailService emailService;

    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    /**
     * Import students from uploaded Excel file.
     * Columns (by index): Facility | "CODE - Name" | DateOfBirth (DD/MM/YYYY) | Phone | ClassName
     * Note: some office files mislabel headers as Subject/Grade — importer uses column index, not header text.
     * Admin passes classroomId (must match the class, e.g. TIẾNG ANH 12 with subject + teacher).
     */
    @Transactional
    public List<StudentProfileResponse> importFromExcel(MultipartFile file, UUID classroomId) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học"));

        List<StudentProfileResponse> results = new ArrayList<>();

        try (InputStream is = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            boolean isFirstRow = true;

            for (Row row : sheet) {
                if (isFirstRow) {
                    isFirstRow = false;
                    continue; // Skip header
                }

                try {
                    String facility = getCellValue(row, 0);
                    String nameCell = getCellValue(row, 1); // "25110194 - NGUYEN VAN A"
                    String dobStr = getCellValue(row, 2);   // "14/07/2009"
                    String phone = getCellValue(row, 3);

                    if (nameCell == null || nameCell.isBlank()) continue;

                    // Parse "CODE - Name" pattern
                    String studentCode;
                    String fullName;
                    if (nameCell.contains("-")) {
                        String[] parts = nameCell.split("-", 2);
                        studentCode = parts[0].trim();
                        fullName = parts[1].trim();
                    } else {
                        log.warn("Row skipped - cannot parse student code from: {}", nameCell);
                        continue;
                    }

                    if (phone != null && !phone.isBlank()) {
                        phone = phone.replaceAll("[^\\d]", "");
                        if (!phone.isEmpty() && !phone.startsWith("0")) {
                            phone = "0" + phone;
                        }
                    }

                    // Parse date
                    LocalDate dateOfBirth = null;
                    if (dobStr != null && !dobStr.isBlank()) {
                        String normalizedDob = dobStr.trim();
                        // If it's already yyyy-MM-dd from POI DateUtil
                        if (normalizedDob.matches("^\\d{4}-\\d{2}-\\d{2}$")) {
                            dateOfBirth = LocalDate.parse(normalizedDob, DateTimeFormatter.ofPattern("yyyy-MM-dd"));
                        } else if (normalizedDob.matches("^\\d+(\\.\\d+)?$")) {
                            // If POI returned raw numeric serial date because isCellDateFormatted failed
                            try {
                                double serial = Double.parseDouble(normalizedDob);
                                dateOfBirth = org.apache.poi.ss.usermodel.DateUtil.getLocalDateTime(serial).toLocalDate();
                            } catch (Exception ignored) {}
                        } else {
                            normalizedDob = normalizedDob.replace("-", "/");
                            // Pre-process common 2-digit years and missing 0s for dd/MM/yyyy or d/M/yy
                            if (normalizedDob.contains("/")) {
                                String[] parts = normalizedDob.split("/");
                                if (parts.length == 3) {
                                    String d = parts[0].length() == 1 ? "0" + parts[0] : parts[0];
                                    String m = parts[1].length() == 1 ? "0" + parts[1] : parts[1];
                                    String y = parts[2];
                                    if (y.length() == 2) {
                                        y = Integer.parseInt(y) < 50 ? "20" + y : "19" + y;
                                    }
                                    normalizedDob = d + "/" + m + "/" + y;
                                }
                            }

                            String[] formats = {
                                "dd/MM/yyyy", "d/M/yyyy"
                            };
                            for (String format : formats) {
                                try {
                                    dateOfBirth = LocalDate.parse(normalizedDob, DateTimeFormatter.ofPattern(format));
                                    break;
                                } catch (Exception ignored) {
                                }
                            }
                        }
                        if (dateOfBirth == null) {
                            log.warn("Could not parse date: {}", dobStr);
                        }
                    }

                    // Upsert student profile
                    StudentProfile profile;
                    if (studentProfileRepository.existsByStudentCode(studentCode)) {
                        profile = studentProfileRepository.findByStudentCode(studentCode).get();
                        // Overwrite contact info if present in Excel
                        if (phone != null && !phone.isBlank()) {
                            profile.setPhone(phone);
                        }
                        if (facility != null && !facility.isBlank()) {
                            profile.setFacility(facility);
                        }
                        if (dateOfBirth != null) {
                            profile.setDateOfBirth(dateOfBirth);
                        }
                        profile = studentProfileRepository.save(profile);
                    } else {
                        profile = StudentProfile.builder()
                                .studentCode(studentCode)
                                .fullName(fullName)
                                .dateOfBirth(dateOfBirth)
                                .phone(phone)
                                .facility(facility)
                                .status("PENDING")
                                .build();
                        profile = studentProfileRepository.save(profile);
                    }

                    // Link to classroom if not already linked
                    if (!studentClassEnrollmentRepository.existsByStudentProfileAndClassroom_Id(profile, classroomId)) {
                        StudentClassEnrollment enrollment = StudentClassEnrollment.builder()
                                .studentProfile(profile)
                                .classroom(classroom)
                                .build();
                        studentClassEnrollmentRepository.save(enrollment);
                    }

                    // If student already has a User account, grant ClassMember → FULL resource access
                    if (profile.getUser() != null) {
                        ensureClassMember(classroom, profile.getUser());
                    }

                    results.add(toResponse(profile));

                } catch (Exception e) {
                    log.error("Error processing row {}: {}", row.getRowNum(), e.getMessage());
                }
            }

        } catch (Exception e) {
            throw new BadRequestException("Lỗi khi đọc file Excel: " + e.getMessage());
        }

        return results;
    }

    @Transactional
    public List<StudentProfileResponse> importGlobalStudents(MultipartFile file) {
        List<StudentProfileResponse> results = new ArrayList<>();

        try (InputStream is = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            boolean isFirstRow = true;

            for (Row row : sheet) {
                if (isFirstRow) {
                    isFirstRow = false;
                    continue; // Skip header
                }

                try {
                    String facility = getCellValue(row, 0);
                    String nameCell = getCellValue(row, 1);
                    String dobStr = getCellValue(row, 2);
                    String phone = getCellValue(row, 3);

                    if (nameCell == null || nameCell.isBlank()) continue;

                    // Parse "CODE - Name" pattern
                    String studentCode;
                    String fullName;
                    if (nameCell.contains("-")) {
                        String[] parts = nameCell.split("-", 2);
                        studentCode = parts[0].trim();
                        fullName = parts[1].trim();
                    } else {
                        log.warn("Row skipped - cannot parse student code from: {}", nameCell);
                        continue;
                    }

                    // Parse date
                    LocalDate dateOfBirth = null;
                    if (dobStr != null && !dobStr.isBlank()) {
                        String normalizedDob = dobStr.replace("-", "/").trim();
                        String[] formats = {
                            "dd/MM/yyyy", "d/M/yyyy", "dd/MM/yy", "d/M/yy",
                            "MM/dd/yyyy", "M/d/yyyy", "MM/dd/yy", "M/d/yy",
                            "yyyy-MM-dd"
                        };
                        for (String format : formats) {
                            try {
                                dateOfBirth = LocalDate.parse(normalizedDob, DateTimeFormatter.ofPattern(format));
                                break;
                            } catch (Exception ignored) {
                            }
                        }
                        if (dateOfBirth == null) {
                            log.warn("Could not parse date: {}", dobStr);
                        }
                    }

                    // Upsert student profile
                    StudentProfile profile;
                    if (studentProfileRepository.existsByStudentCode(studentCode)) {
                        profile = studentProfileRepository.findByStudentCode(studentCode).get();
                    } else {
                        profile = StudentProfile.builder()
                                .studentCode(studentCode)
                                .fullName(fullName)
                                .dateOfBirth(dateOfBirth)
                                .phone(phone)
                                .facility(facility)
                                .status("PENDING")
                                .build();
                        profile = studentProfileRepository.save(profile);
                    }

                    results.add(toResponse(profile));

                } catch (Exception e) {
                    log.error("Error processing row {}: {}", row.getRowNum(), e.getMessage());
                }
            }

        } catch (Exception e) {
            throw new BadRequestException("Lỗi khi đọc file Excel: " + e.getMessage());
        }

        return results;
    }

    /**
     * Làm sạch mã số học sinh: loại bỏ khoảng trắng, ký tự điều khiển, ký tự ẩn không nhìn thấy (zero-width characters).
     */
    public static String sanitizeStudentCode(String code) {
        if (code == null) return "";
        return code.replaceAll("[\\p{Cntrl}\\p{Cf}\\s]", "").trim();
    }

    /**
     * Chuẩn hoá tiếng Việt: đưa về dạng Unicode dựng sẵn (NFC), loại bỏ ký tự điều khiển và thu gọn nhiều dấu cách liền nhau.
     * Giải quyết triệt để lỗi gõ bàn phím điện thoại (iOS / Android xuất ra NFD tổ hợp) so với dữ liệu trên máy tính / Excel (NFC dựng sẵn).
     */
    public static String normalizeVietnamese(String text) {
        if (text == null) return "";
        String cleaned = text.replaceAll("[\\p{Cntrl}\\p{Cf}]", "");
        cleaned = Normalizer.normalize(cleaned, Normalizer.Form.NFC);
        return cleaned.replaceAll("\\s+", " ").trim();
    }

    /**
     * Phân tích ngày sinh linh hoạt: hỗ trợ dd/MM/yyyy, d/M/yyyy, yyyy-MM-dd, dd-MM-yyyy, dd.MM.yyyy.
     */
    public static LocalDate parseFlexibleDob(String dobStr) {
        if (dobStr == null || dobStr.isBlank()) return null;
        String clean = dobStr.trim().replace("-", "/").replace(".", "/");
        if (clean.contains("/")) {
            String[] parts = clean.split("/");
            if (parts.length == 3) {
                String d = parts[0].length() == 1 ? "0" + parts[0] : parts[0];
                String m = parts[1].length() == 1 ? "0" + parts[1] : parts[1];
                String y = parts[2];
                if (y.length() == 2) {
                    y = Integer.parseInt(y) < 50 ? "20" + y : "19" + y;
                }
                clean = d + "/" + m + "/" + y;
            }
        }
        for (String fmt : new String[]{"dd/MM/yyyy", "yyyy/MM/dd", "yyyy-MM-dd"}) {
            try {
                return LocalDate.parse(clean, DateTimeFormatter.ofPattern(fmt));
            } catch (Exception ignored) {}
        }
        return null;
    }

    /**
     * Register a new user account using student code verification.
     */
    @Transactional
    public String registerWithStudentCode(RegisterWithStudentCodeRequest request) {
        // 1. Find profile by student code (case-insensitive & sanitized)
        String cleanCode = sanitizeStudentCode(request.getStudentCode());
        StudentProfile profile = studentProfileRepository.findByStudentCodeIgnoreCase(cleanCode)
                .orElseThrow(() -> new BadRequestException("Mã số học sinh không tồn tại trong hệ thống. Vui lòng kiểm tra lại hoặc liên hệ văn phòng."));

        // Verify date of birth matches (flexible format support)
        if (profile.getDateOfBirth() != null) {
            LocalDate provided = parseFlexibleDob(request.getDateOfBirth());
            if (provided == null) {
                throw new BadRequestException("Định dạng ngày sinh không hợp lệ. Vui lòng nhập theo định dạng DD/MM/YYYY (ví dụ: 14/07/2009).");
            }
            if (!provided.equals(profile.getDateOfBirth())) {
                throw new BadRequestException("Ngày sinh không khớp. Vui lòng kiểm tra lại phiếu đăng ký hoặc liên hệ văn phòng.");
            }
        }

        if (profile.getUser() != null) {
            throw new BadRequestException("Mã số học sinh này đã được liên kết với một tài khoản. Vui lòng đăng nhập hoặc liên hệ hỗ trợ.");
        }

        Optional<User> pendingUserOpt = userRepository.findByPendingStudentCode(profile.getStudentCode());
        User user;

        if (pendingUserOpt.isPresent()) {
            user = pendingUserOpt.get();
            if (user.getStatus() == UserStatus.ACTIVE || user.getStatus() == UserStatus.BANNED) {
                throw new BadRequestException("Tài khoản đang được xử lý hoặc đã kích hoạt.");
            }
            // If INACTIVE, check if the NEW email is used by ANOTHER user
            if (!user.getEmail().equalsIgnoreCase(request.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
                throw new BadRequestException("Email này đã được sử dụng bởi một tài khoản khác.");
            }
            // Update user details
            user.setEmail(request.getEmail());
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            user.setFullName(profile.getFullName());
            user.setPhone(profile.getPhone());
            
            // Delete old verification tokens
            verificationTokenRepository.deleteByUser_Id(user.getId());
            userRepository.save(user);
        } else {
            // 4. Check email uniqueness
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new BadRequestException("Email này đã được sử dụng bởi một tài khoản khác.");
            }

            // 5. Create user account with pending registration reference
            user = User.builder()
                    .email(request.getEmail())
                    .password(passwordEncoder.encode(request.getPassword()))
                    .fullName(profile.getFullName())
                    .phone(profile.getPhone())
                    .role(Role.STUDENT)
                    .status(UserStatus.INACTIVE) // Requires email verification
                    .authProvider(AuthProvider.LOCAL)
                    .pendingStudentCode(profile.getStudentCode())
                    .build();
            userRepository.save(user);
        }

        // 6. (ClassMember synchronization is deferred to email verification)

        // 8. Send verification email with OTP
        String otp = String.format("%06d", new java.util.Random().nextInt(999999));
        VerificationToken verificationToken = VerificationToken.builder()
                .token(otp)
                .user(user)
                .expiryDate(LocalDateTime.now().plusHours(24))
                .build();
        verificationTokenRepository.save(verificationToken);

        String emailContent = "<h3>Xin chào " + user.getFullName() + ",</h3>"
                + "<p>Tài khoản học sinh của bạn đã được liên kết thành công tại URANUS LMS.</p>"
                + "<p>Mã số học sinh: <strong>" + profile.getStudentCode() + "</strong></p>"
                + "<p>Mã xác nhận tài khoản của bạn là:</p>"
                + "<h2 style=\"color: #f97316; font-size: 24px; letter-spacing: 5px;\">" + otp + "</h2>"
                + "<p>Vui lòng nhập mã này trên trang đăng ký để kích hoạt tài khoản của bạn (mã có hiệu lực trong 24 giờ).</p>";

        emailService.sendEmail(user.getEmail(), "Mã xác nhận tài khoản URANUS LMS", emailContent);
        
        log.info("========== LOCAL TESTING EMAIL OTP ==========");
        log.info("OTP for {}: {}", user.getEmail(), otp);
        log.info("==============================================");

        log.info("Student registered: code={}, email={}", profile.getStudentCode(), user.getEmail());
        return "Đăng ký thành công! Vui lòng kiểm tra email để kích hoạt tài khoản và tự động tham gia lớp học.";
    }

    public Page<StudentProfileResponse> getAll(String keyword, String className, String facility, String status, String teacherName, LocalDate fromDate, LocalDate toDate, Pageable pageable) {
        var spec = StudentProfileSpecification.buildSpecification(keyword, className, facility, status, teacherName, fromDate, toDate);
        Page<StudentProfile> profiles = studentProfileRepository.findAll(spec, pageable);
        return profiles.map(this::toResponse);
    }

    /**
     * Admin: Update a student profile's editable fields.
     */
    @Transactional
    public StudentProfileResponse updateProfile(UUID id, UpdateStudentProfileRequest req) {
        StudentProfile profile = studentProfileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found"));

        // Check for duplicate studentCode if changed
        if (req.getStudentCode() != null && !req.getStudentCode().equals(profile.getStudentCode())) {
            if (studentProfileRepository.findByStudentCode(req.getStudentCode()).isPresent()) {
                throw new BadRequestException("Mã số học sinh đã tồn tại: " + req.getStudentCode());
            }
            profile.setStudentCode(req.getStudentCode());
        }
        if (req.getFullName() != null) profile.setFullName(req.getFullName());
        if (req.getDateOfBirth() != null) profile.setDateOfBirth(req.getDateOfBirth());
        if (req.getPhone() != null) profile.setPhone(req.getPhone());
        if (req.getFacility() != null) profile.setFacility(req.getFacility());

        return toResponse(studentProfileRepository.save(profile));
    }

    /**
     * Admin: Manually create a student profile or link an existing one to a classroom.
     */
    @Transactional
    public StudentProfileResponse createOrLinkProfile(CreateStudentProfileRequest request) {
        StudentProfile profile;
        if (studentProfileRepository.existsByStudentCode(request.getStudentCode())) {
            profile = studentProfileRepository.findByStudentCode(request.getStudentCode()).get();
            // We just update info if provided
            if (request.getFullName() != null) profile.setFullName(request.getFullName());
            if (request.getDateOfBirth() != null) profile.setDateOfBirth(request.getDateOfBirth());
            if (request.getPhone() != null) profile.setPhone(request.getPhone());
            if (request.getFacility() != null) profile.setFacility(request.getFacility());
            profile = studentProfileRepository.save(profile);
        } else {
            profile = StudentProfile.builder()
                    .studentCode(request.getStudentCode())
                    .fullName(request.getFullName())
                    .dateOfBirth(request.getDateOfBirth())
                    .phone(request.getPhone())
                    .facility(request.getFacility())
                    .status("PENDING")
                    .build();
            profile = studentProfileRepository.save(profile);
        }

        if (request.getClassroomId() != null) {
            Classroom classroom = classroomRepository.findById(request.getClassroomId())
                    .orElseThrow(() -> new ResourceNotFoundException("Classroom not found"));
            if (!studentClassEnrollmentRepository.existsByStudentProfileAndClassroom_Id(profile, classroom.getId())) {
                StudentClassEnrollment enrollment = StudentClassEnrollment.builder()
                        .studentProfile(profile)
                        .classroom(classroom)
                        .build();
                studentClassEnrollmentRepository.save(enrollment);
                if (profile.getUser() != null) {
                    ensureClassMember(classroom, profile.getUser());
                }
                if (profile.getEnrollments() != null) {
                    profile.getEnrollments().add(enrollment);
                }
            }
        }
        return toResponse(profile);
    }

    /**
     * Admin: Add an existing student to a classroom.
     */
    @Transactional
    public void addStudentToClassroom(UUID studentId, UUID classroomId) {
        StudentProfile profile = studentProfileRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom not found"));
        
        if (!studentClassEnrollmentRepository.existsByStudentProfileAndClassroom_Id(profile, classroomId)) {
            StudentClassEnrollment enrollment = StudentClassEnrollment.builder()
                    .studentProfile(profile)
                    .classroom(classroom)
                    .build();
            studentClassEnrollmentRepository.save(enrollment);
            if (profile.getUser() != null) {
                ensureClassMember(classroom, profile.getUser());
            }
        }
    }

    /**
     * Admin: Remove a student from a classroom.
     */
    @Transactional
    public void removeStudentFromClassroom(UUID studentId, UUID classroomId) {
        StudentProfile profile = studentProfileRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));
        StudentClassEnrollment enrollment = studentClassEnrollmentRepository
                .findByStudentProfile(profile).stream()
                .filter(e -> e.getClassroom().getId().equals(classroomId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Student is not in this classroom"));
        
        studentClassEnrollmentRepository.delete(enrollment);
        if (profile.getUser() != null) {
            classMemberRepository.findByClassroomIdAndUserId(classroomId, profile.getUser().getId())
                    .ifPresent(classMemberRepository::delete);
        }
    }

    /**
     * Admin: Update the full list of classrooms for a student.
     */
    @Transactional
    public StudentProfileResponse updateStudentClassrooms(UUID studentId, UpdateStudentClassroomsRequest request) {
        StudentProfile profile = studentProfileRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));
        
        List<StudentClassEnrollment> existingEnrollments = studentClassEnrollmentRepository.findByStudentProfile(profile);
        List<UUID> existingClassIds = existingEnrollments.stream()
                .map(e -> e.getClassroom().getId())
                .collect(Collectors.toList());
                
        List<UUID> targetClassIds = request.getClassroomIds();
        
        // Classes to remove
        List<StudentClassEnrollment> toRemove = existingEnrollments.stream()
                .filter(e -> !targetClassIds.contains(e.getClassroom().getId()))
                .collect(Collectors.toList());
        studentClassEnrollmentRepository.deleteAll(toRemove);
        if (profile.getUser() != null) {
            for (StudentClassEnrollment e : toRemove) {
                classMemberRepository.findByClassroomIdAndUserId(e.getClassroom().getId(), profile.getUser().getId())
                        .ifPresent(classMemberRepository::delete);
            }
        }
        
        // Classes to add
        for (UUID classId : targetClassIds) {
            if (!existingClassIds.contains(classId)) {
                Classroom classroom = classroomRepository.findById(classId)
                        .orElseThrow(() -> new ResourceNotFoundException("Classroom " + classId + " not found"));
                StudentClassEnrollment enrollment = StudentClassEnrollment.builder()
                        .studentProfile(profile)
                        .classroom(classroom)
                        .build();
                studentClassEnrollmentRepository.save(enrollment);
                if (profile.getUser() != null) {
                    ensureClassMember(classroom, profile.getUser());
                }
                if (profile.getEnrollments() != null) {
                    profile.getEnrollments().add(enrollment);
                }
            }
        }
        
        return toResponse(profile);
    }


    /**
     * Admin: Delete a student profile (only if no linked user account).
     */
    @Transactional
    public void deleteProfile(UUID id) {
        StudentProfile profile = studentProfileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found"));
        
        // Find all enrollments
        List<StudentClassEnrollment> enrollments = studentClassEnrollmentRepository.findByStudentProfile(profile);
        
        // Remove from all classes
        studentClassEnrollmentRepository.deleteAll(enrollments);
    }

    /**
     * Admin: Bulk delete student profiles.
     */
    @Transactional
    public void bulkDeleteProfiles(List<UUID> ids) {
        List<StudentProfile> profiles = studentProfileRepository.findAllById(ids);
        for (StudentProfile profile : profiles) {
            List<StudentClassEnrollment> enrollments = studentClassEnrollmentRepository.findByStudentProfile(profile);
            studentClassEnrollmentRepository.deleteAll(enrollments);
        }
    }

    /**
     * Admin: Import students from Excel, optionally enrolling them into a classroom.
     * - If classroomId is provided, links each student to that classroom (additive — student can already be in other classes).
     * - If classroomId is null, imports globally without any class assignment.
     */
    @Transactional
    public List<StudentProfileResponse> importAdminStudents(MultipartFile file, UUID classroomId) {
        if (classroomId != null) {
            return importFromExcel(file, classroomId);
        } else {
            return importGlobalStudents(file);
        }
    }

    /**
     * Admin: Get all students enrolled in a specific classroom.
     */
    @Transactional(readOnly = true)
    public List<StudentProfileResponse> getStudentsByClassroom(UUID classroomId) {
        List<StudentClassEnrollment> enrollments = studentClassEnrollmentRepository.findByClassroomId(classroomId);
        return enrollments.stream()
                .map(e -> toResponse(e.getStudentProfile()))
                .collect(Collectors.toList());
    }

    public StudentProfileResponse verifyStudentCode(String studentCode, String fullName) {
        String cleanCode = sanitizeStudentCode(studentCode);
        if (cleanCode.isBlank()) {
            throw new BadRequestException("Vui lòng nhập mã số học sinh");
        }

        StudentProfile profile = studentProfileRepository.findByStudentCodeIgnoreCase(cleanCode)
                .orElseThrow(() -> new ResourceNotFoundException("Mã số học sinh không tồn tại"));

        String normDbName = normalizeVietnamese(profile.getFullName());
        String normInputName = normalizeVietnamese(fullName);
        if (fullName == null || fullName.isBlank() || !normDbName.equalsIgnoreCase(normInputName)) {
            throw new BadRequestException("Họ và tên không khớp với mã số học sinh này");
        }

        return toResponse(profile);
    }

    /**
     * Chuẩn hoá tên trước khi so sánh: gộp khoảng trắng thừa (kể cả non-breaking space bàn phím mobile
     * hay chèn) và ép về dạng Unicode NFC. Bàn phím tiếng Việt trên một số điện thoại (đặc biệt iOS)
     * gõ ra dấu ở dạng NFD (chữ cái + dấu rời), trong khi dữ liệu học sinh import từ Excel thường ở
     * dạng NFC — hai chuỗi trông giống hệt nhau nhưng so sánh bằng byte sẽ luôn khác nhau nếu không chuẩn hoá.
     */
    private String normalizeName(String s) {
        if (s == null) return "";
        String noExtraSpaces = s.trim().replaceAll("[\\s\\u00A0]+", " ");
        return java.text.Normalizer.normalize(noExtraSpaces, java.text.Normalizer.Form.NFC);
    }

    /**
     * Ensure the user is a ClassMember of the classroom so resource access (FULL) works.
     */
    private void ensureClassMember(Classroom classroom, User user) {
        if (classroom == null || user == null) return;
        if (classMemberRepository.existsByClassroomIdAndUserId(classroom.getId(), user.getId())) {
            return;
        }
        ClassMember member = ClassMember.builder()
                .classroom(classroom)
                .user(user)
                .role(ClassMemberRole.STUDENT)
                .build();
        classMemberRepository.save(member);
        log.info("Created ClassMember for user {} in classroom {}", user.getId(), classroom.getId());
    }

    /**
     * Synchronize all existing enrollments to active ClassMember access.
     */
    public void synchronizeClassMembers(StudentProfile profile, User user) {
        List<StudentClassEnrollment> enrollments = studentClassEnrollmentRepository.findByStudentProfile(profile);
        for (StudentClassEnrollment enrollment : enrollments) {
            ensureClassMember(enrollment.getClassroom(), user);
            log.info("Student {} enrolled in classroom {} ({}/{})",
                    user.getEmail(),
                    enrollment.getClassroom().getName(),
                    enrollment.getClassroom().getSubject(),
                    enrollment.getClassroom().getTeacher() != null
                            ? enrollment.getClassroom().getTeacher().getFullName()
                            : "?");
        }
    }

    /**
     * Called after successful email verification to link the pending StudentProfile.
     * Uses PESSIMISTIC_WRITE lock to prevent concurrent claims.
     */
    @Transactional
    public void linkPendingAccount(User user) {
        if (user.getPendingStudentCode() == null) {
            return;
        }

        String cleanCode = sanitizeStudentCode(user.getPendingStudentCode());
        StudentProfile profile = studentProfileRepository.findByStudentCodeForUpdate(cleanCode)
                .orElseThrow(() -> new BadRequestException("Mã học sinh không tồn tại trong hệ thống."));

        if (profile.getUser() != null) {
            if (profile.getUser().getId().equals(user.getId())) {
                return; // Already linked to this user
            }
            throw new BadRequestException("Mã học sinh này đã được xác thực bởi một tài khoản khác trong lúc bạn chờ xác nhận. Vui lòng liên hệ hỗ trợ.");
        }

        profile.setUser(user);
        profile.setStatus("ACTIVE");
        studentProfileRepository.save(profile);

        synchronizeClassMembers(profile, user);

        user.setPendingStudentCode(null);
        userRepository.save(user);
    }

    /**
     * Manually link an orphan STUDENT account to a StudentProfile.
     */
    @Transactional
    public String linkLegacyAccount(User user, RegisterWithStudentCodeRequest request) {
        if (user.getRole() != Role.STUDENT) {
            throw new BadRequestException("Chỉ học sinh mới có thể liên kết tài khoản.");
        }

        if (studentProfileRepository.findByUser_Id(user.getId()).isPresent()) {
            throw new BadRequestException("Tài khoản này đã được liên kết với một hồ sơ học sinh.");
        }

        String cleanCode = sanitizeStudentCode(request.getStudentCode());
        StudentProfile profile = studentProfileRepository.findByStudentCodeForUpdate(cleanCode)
                .orElseThrow(() -> new BadRequestException("Mã số học sinh không tồn tại trong hệ thống."));

        if (profile.getUser() != null) {
            throw new BadRequestException("Mã học sinh này đã được liên kết với một tài khoản khác.");
        }

        // Verify date of birth
        if (profile.getDateOfBirth() != null) {
            LocalDate provided = parseFlexibleDob(request.getDateOfBirth());
            if (provided == null) {
                throw new BadRequestException("Định dạng ngày sinh không hợp lệ. Vui lòng nhập theo định dạng DD/MM/YYYY (ví dụ: 14/07/2009).");
            }
            if (!provided.equals(profile.getDateOfBirth())) {
                throw new BadRequestException("Ngày sinh không khớp. Vui lòng kiểm tra lại.");
            }
        }

        profile.setUser(user);
        profile.setStatus("ACTIVE");
        studentProfileRepository.save(profile);

        synchronizeClassMembers(profile, user);

        return "Liên kết tài khoản thành công!";
    }

    @Transactional(readOnly = true)
    public StudentProfileResponse getProfileByUserId(UUID userId) {
        StudentProfile profile = studentProfileRepository.findByUser_Id(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ học sinh cho user này."));
        return mapToResponse(profile);
    }

    private StudentProfileResponse mapToResponse(StudentProfile profile) {
        List<StudentProfileResponse.EnrolledClassInfo> enrolledClasses = profile.getEnrollments().stream()
                .map(e -> StudentProfileResponse.EnrolledClassInfo.builder()
                        .classroomId(e.getClassroom().getId())
                        .classroomName(e.getClassroom().getName())
                        .build())
                .collect(Collectors.toList());

        return StudentProfileResponse.builder()
                .id(profile.getId())
                .studentCode(profile.getStudentCode())
                .fullName(profile.getFullName())
                .dateOfBirth(profile.getDateOfBirth())
                .phone(profile.getPhone())
                .facility(profile.getFacility())
                .status(profile.getStatus())
                .userId(profile.getUser() != null ? profile.getUser().getId() : null)
                .userStatus(profile.getUser() != null && profile.getUser().getStatus() != null ? profile.getUser().getStatus().name() : null)
                .enrollments(enrolledClasses)
                .createdAt(profile.getCreatedAt())
                .build();
    }

    private StudentProfileResponse toResponse(StudentProfile p) {
        List<StudentProfileResponse.EnrolledClassInfo> enrolledClasses = p.getEnrollments().stream()
                .map(e -> StudentProfileResponse.EnrolledClassInfo.builder()
                        .classroomId(e.getClassroom().getId())
                        .classroomName(e.getClassroom().getName())
                        .build())
                .collect(Collectors.toList());

        return StudentProfileResponse.builder()
                .id(p.getId())
                .studentCode(p.getStudentCode())
                .fullName(p.getFullName())
                .dateOfBirth(p.getDateOfBirth())
                .phone(p.getPhone())
                .facility(p.getFacility())
                .status(p.getStatus())
                .userId(p.getUser() != null ? p.getUser().getId() : null)
                .userStatus(p.getUser() != null && p.getUser().getStatus() != null ? p.getUser().getStatus().name() : null)
                .enrollments(enrolledClasses)
                .createdAt(p.getCreatedAt())
                .build();
    }

    private String getCellValue(Row row, int index) {
        Cell cell = row.getCell(index);
        if (cell == null) return null;

        // Always use DataFormatter so date cells return their display string (e.g. "6/7/2009")
        // which we then parse ourselves strictly as dd/MM/yyyy.
        // Do NOT use getLocalDateTimeCellValue() — Excel may have stored the date with US locale
        // (MM/dd) which would swap day and month silently.
        DataFormatter formatter = new DataFormatter();
        return formatter.formatCellValue(cell).trim();
    }
}
