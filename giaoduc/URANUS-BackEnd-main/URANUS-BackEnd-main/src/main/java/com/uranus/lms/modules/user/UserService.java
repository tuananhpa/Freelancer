package com.uranus.lms.modules.user;

import com.uranus.lms.exception.BadRequestException;
import com.uranus.lms.exception.ResourceNotFoundException;
import com.uranus.lms.modules.user.AuthProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.uranus.lms.modules.classroom.Classroom;
import com.uranus.lms.modules.classroom.ClassroomRepository;
import com.uranus.lms.modules.classroom.ClassMember;
import com.uranus.lms.modules.classroom.ClassMemberRole;
import com.uranus.lms.modules.classroom.ClassMemberRepository;
import com.uranus.lms.modules.student.StudentClassEnrollment;
import com.uranus.lms.modules.student.StudentClassEnrollmentRepository;
import com.uranus.lms.modules.student.StudentProfile;
import com.uranus.lms.modules.student.StudentProfileRepository;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import jakarta.annotation.PostConstruct;
import org.springframework.jdbc.core.JdbcTemplate;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final StudentProfileRepository studentProfileRepository;
    private final ClassroomRepository classroomRepository;
    private final ClassMemberRepository classMemberRepository;
    private final StudentClassEnrollmentRepository enrollmentRepository;
    private final JdbcTemplate jdbcTemplate;
    private final com.uranus.lms.modules.notification.NotificationService notificationService;

    @PostConstruct
    public void fixPostgresConstraint() {
        try {
            jdbcTemplate.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");
        } catch (Exception e) {
            log.warn("Could not drop users_role_check constraint, it might not exist: {}", e.getMessage());
        }
    }

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

    public Page<User> getAllUsers(String search, Role role, UserStatus status, Pageable pageable) {
        Specification<User> spec = Specification.where(null);

        if (search != null && !search.trim().isEmpty()) {
            String searchPattern = "%" + search.trim().toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> {
                jakarta.persistence.criteria.Subquery<UUID> subquery = query.subquery(UUID.class);
                jakarta.persistence.criteria.Root<com.uranus.lms.modules.student.StudentProfile> subRoot = subquery.from(com.uranus.lms.modules.student.StudentProfile.class);
                subquery.select(subRoot.get("user").get("id"));
                subquery.where(cb.like(cb.lower(subRoot.get("studentCode")), searchPattern));

                return cb.or(
                    cb.like(cb.lower(root.get("fullName")), searchPattern),
                    cb.like(cb.lower(root.get("email")), searchPattern),
                    cb.like(cb.lower(root.get("phone")), searchPattern),
                    cb.in(root.get("id")).value(subquery)
                );
            });
        }

        if (role != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("role"), role));
        }

        if (status != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }

        return userRepository.findAll(spec, pageable);
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    public User updateProfile(User user, String fullName, String phone, String avatarUrl) {
        String newName = formatFullName(fullName);
        if (user.getRole() == Role.STUDENT && newName != null && !newName.trim().equalsIgnoreCase(user.getFullName().trim())) {
            throw new BadRequestException("Học sinh không được phép tự thay đổi họ tên hợp lệ. Vui lòng liên hệ trung tâm.");
        }
        user.setFullName(newName);
        user.setPhone(phone);
        user.setAvatarUrl(avatarUrl != null && avatarUrl.isBlank() ? null : avatarUrl);
        return userRepository.save(user);
    }

    public void changePassword(User user, String currentPassword, String newPassword) {
        if (user.getAuthProvider() != AuthProvider.LOCAL) {
            throw new BadRequestException("Tài khoản đăng nhập bằng Google không thể đổi mật khẩu tại đây.");
        }
        if (user.getPassword() == null || !passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new BadRequestException("Mật khẩu hiện tại không chính xác.");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    public User getUserById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    public User createUser(User user) {
        user.setFullName(formatFullName(user.getFullName()));
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    public User updateUser(UUID id, User userDetails) {
        User user = getUserById(id);
        if (userDetails.getEmail() != null && !userDetails.getEmail().trim().isEmpty() && !userDetails.getEmail().equalsIgnoreCase(user.getEmail())) {
            if (userRepository.existsByEmail(userDetails.getEmail().trim())) {
                throw new BadRequestException("Email này đã được sử dụng bởi một tài khoản khác.");
            }
            user.setEmail(userDetails.getEmail().trim());
        }
        if (userDetails.getFullName() != null) {
            String newFullName = formatFullName(userDetails.getFullName());
            user.setFullName(newFullName);
            if (user.getRole() == Role.STUDENT) {
                studentProfileRepository.findByUser_Id(user.getId()).ifPresent(profile -> {
                    profile.setFullName(newFullName);
                    studentProfileRepository.save(profile);
                });
            }
        }
        if (userDetails.getPhone() != null) {
            user.setPhone(userDetails.getPhone());
            if (user.getRole() == Role.STUDENT) {
                studentProfileRepository.findByUser_Id(user.getId()).ifPresent(profile -> {
                    profile.setPhone(userDetails.getPhone());
                    studentProfileRepository.save(profile);
                });
            }
        }
        if (userDetails.getAvatarUrl() != null) {
            user.setAvatarUrl(userDetails.getAvatarUrl());
        }
        Role oldRole = user.getRole();
        if (userDetails.getRole() != null) {
            user.setRole(userDetails.getRole());
            if (oldRole != userDetails.getRole()) {
                notificationService.sendNotification(
                        user,
                        "Cập nhật vai trò tài khoản",
                        "Vai trò tài khoản của bạn đã được cập nhật thành: " + userDetails.getRole().name(),
                        "/dashboard",
                        com.uranus.lms.modules.notification.NotificationType.SYSTEM,
                        null,
                        "USER_ROLE",
                        user.getId().toString()
                );
            }
        }
        if (userDetails.getStatus() != null) {
            user.setStatus(userDetails.getStatus());
        }
        if (userDetails.getPassword() != null && !userDetails.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(userDetails.getPassword()));
        }
        return userRepository.save(user);
    }

    @Transactional
    public void bulkUpdateUserStatus(List<UUID> userIds, UserStatus status) {
        if (userIds == null || userIds.isEmpty()) return;
        List<User> users = userRepository.findAllById(userIds);
        for (User user : users) {
            user.setStatus(status);
        }
        userRepository.saveAll(users);
    }

    public void deleteUser(UUID id) {
        User user = getUserById(id);
        
        // Instead of deleting the student profile, unlink the user and reset status to PENDING
        studentProfileRepository.findByUser_Id(id).ifPresent(profile -> {
            profile.setUser(null);
            profile.setStatus("PENDING");
            studentProfileRepository.save(profile);
        });
        
        userRepository.delete(user);
    }

    public List<UUID> getUserClassrooms(UUID userId) {
        User user = getUserById(userId);
        java.util.Set<UUID> classroomIds = classMemberRepository.findByUserIdWithClassroom(user.getId()).stream()
                .map(m -> m.getClassroom().getId())
                .collect(Collectors.toSet());
        if (user.getRole() == Role.STUDENT) {
            studentProfileRepository.findByUser_Id(userId).ifPresent(profile -> {
                enrollmentRepository.findByStudentProfile(profile).forEach(e -> {
                    if (e.getClassroom() != null) {
                        classroomIds.add(e.getClassroom().getId());
                    }
                });
            });
        }
        if (user.getRole() == Role.TEACHER || user.getRole() == Role.TEACHING_ASSISTANT) {
            classroomRepository.findByTeacherId(userId)
                    .forEach(c -> classroomIds.add(c.getId()));
        }
        return new java.util.ArrayList<>(classroomIds);
    }

    @Transactional
    public void updateUserClassrooms(UUID userId, List<UUID> classroomIds) {
        User user = getUserById(userId);

        ClassMemberRole memberRole = user.getRole() == Role.STUDENT
                ? ClassMemberRole.STUDENT
                : (user.getRole() == Role.TEACHING_ASSISTANT ? ClassMemberRole.TA : ClassMemberRole.TEACHER);

        // If teacher/TA, also clear primary teacher reference on classrooms that are being removed
        if (user.getRole() == Role.TEACHER || user.getRole() == Role.TEACHING_ASSISTANT) {
            List<Classroom> teacherClasses = classroomRepository.findByTeacherId(userId);
            for (Classroom tc : teacherClasses) {
                if (!classroomIds.contains(tc.getId())) {
                    tc.setTeacher(null);
                    classroomRepository.save(tc);
                }
            }
        }

        // Update ClassMembers
        List<ClassMember> existingMembers = classMemberRepository.findByUserIdWithClassroom(user.getId());
        for (ClassMember member : existingMembers) {
            if (!classroomIds.contains(member.getClassroom().getId())) {
                classMemberRepository.delete(member);
                if (member.getClassroom().getTeacher() != null && member.getClassroom().getTeacher().getId().equals(user.getId())) {
                    Classroom cls = member.getClassroom();
                    cls.setTeacher(null);
                    classroomRepository.save(cls);
                }
            }
        }
        List<UUID> existingClassroomIds = existingMembers.stream()
                .map(m -> m.getClassroom().getId())
                .collect(Collectors.toList());

        for (UUID classroomId : classroomIds) {
            Classroom classroom = classroomRepository.findById(classroomId)
                    .orElseThrow(() -> new ResourceNotFoundException("Classroom not found"));

            if (user.getRole() == Role.TEACHER && classroom.getTeacher() == null) {
                classroom.setTeacher(user);
                classroomRepository.save(classroom);
            }

            if (!existingClassroomIds.contains(classroomId) && !classMemberRepository.existsByClassroomIdAndUserId(classroomId, user.getId())) {
                ClassMember newMember = ClassMember.builder()
                        .user(user)
                        .classroom(classroom)
                        .role(memberRole)
                        .build();
                classMemberRepository.save(newMember);
            }
        }

        // If user is STUDENT, also update StudentClassEnrollment
        if (user.getRole() == Role.STUDENT) {
            studentProfileRepository.findByUser_Id(userId).ifPresent(profile -> {
                List<StudentClassEnrollment> existingEnrollments = enrollmentRepository.findByStudentProfile(profile);
                for (StudentClassEnrollment enrollment : existingEnrollments) {
                    if (!classroomIds.contains(enrollment.getClassroom().getId())) {
                        enrollmentRepository.delete(enrollment);
                    }
                }
                List<UUID> existingEnrolledIds = existingEnrollments.stream()
                        .map(e -> e.getClassroom().getId())
                        .collect(Collectors.toList());

                for (UUID classroomId : classroomIds) {
                    if (!existingEnrolledIds.contains(classroomId)) {
                        Classroom classroom = classroomRepository.findById(classroomId).orElse(null);
                        if (classroom != null) {
                            StudentClassEnrollment newEnrollment = StudentClassEnrollment.builder()
                                    .studentProfile(profile)
                                    .classroom(classroom)
                                    .build();
                            enrollmentRepository.save(newEnrollment);
                        }
                    }
                }
            });
        }
    }

    @Transactional
    public User updateStudentCode(UUID userId, String newStudentCode) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy người dùng."));

        if (user.getRole() != Role.STUDENT) {
            throw new BadRequestException("Chỉ có thể thay đổi mã học sinh cho tài khoản có vai trò STUDENT.");
        }

        if (user.getStatus() == UserStatus.INACTIVE && user.getPendingStudentCode() != null) {
            throw new BadRequestException("Tài khoản đang trong quá trình chờ xác thực email. Không thể thay đổi mã học sinh lúc này.");
        }

        StudentProfile profile = studentProfileRepository.findByUser_Id(user.getId())
                .orElse(null);

        if (profile != null && profile.getStudentCode().equals(newStudentCode)) {
            return user; // No change
        }

        StudentProfile existingProfile = studentProfileRepository.findByStudentCode(newStudentCode).orElse(null);

        if (existingProfile != null) {
            if (existingProfile.getUser() != null && !existingProfile.getUser().getId().equals(user.getId())) {
                throw new BadRequestException("Mã học sinh " + newStudentCode + " đã được sử dụng bởi học sinh khác.");
            }

            if (profile != null && !profile.getId().equals(existingProfile.getId())) {
                studentProfileRepository.delete(profile);
                studentProfileRepository.flush(); // Flush DB first so the user_id slot is freed
            }

            // Existing unlinked profile found (e.g., from Excel import)
            existingProfile.setUser(user);
            existingProfile.setStatus(user.getStatus() == UserStatus.ACTIVE ? "ACTIVE" : "PENDING");
            
            studentProfileRepository.save(existingProfile);

            // Sync classrooms if the profile has enrollments
            if (existingProfile.getEnrollments() != null && !existingProfile.getEnrollments().isEmpty()) {
                List<UUID> classroomIds = existingProfile.getEnrollments().stream()
                        .map(e -> e.getClassroom().getId())
                        .collect(Collectors.toList());
                updateUserClassrooms(user.getId(), classroomIds);
            }
        } else {
            // No profile with this code exists yet
            if (profile == null) {
                profile = StudentProfile.builder()
                        .user(user)
                        .fullName(user.getFullName())
                        .phone(user.getPhone())
                        .studentCode(newStudentCode)
                        .status(user.getStatus() == UserStatus.ACTIVE ? "ACTIVE" : "PENDING")
                        .build();
            } else {
                profile.setStudentCode(newStudentCode);
            }
            studentProfileRepository.save(profile);
        }

        return user;
    }
}
