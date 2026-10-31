package com.uranus.lms.modules.classroom;

import com.uranus.lms.exception.BadRequestException;
import com.uranus.lms.exception.ResourceNotFoundException;
import com.uranus.lms.modules.classroom.dto.ClassroomResponse;
import com.uranus.lms.modules.classroom.dto.ClassMemberResponse;
import com.uranus.lms.modules.classroom.dto.CreateClassroomRequest;
import com.uranus.lms.modules.classroom.dto.LinkedCourseResponse;
import com.uranus.lms.modules.classroom.dto.ClassFolderResponse;
import com.uranus.lms.modules.classroom.dto.ClassResourceResponse;
import com.uranus.lms.modules.classroom.dto.AssignResourceRequest;
import com.uranus.lms.modules.course.Course;
import com.uranus.lms.modules.course.CourseRepository;
import com.uranus.lms.modules.user.User;
import com.uranus.lms.modules.user.Role;
import com.uranus.lms.modules.user.UserRepository;
import com.uranus.lms.modules.assignment.Assignment;
import com.uranus.lms.modules.assignment.AssignmentRepository;
import com.uranus.lms.modules.notification.NotificationService;
import com.uranus.lms.modules.notification.NotificationType;
import com.uranus.lms.modules.gamification.GamificationService;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClassroomService {

    private final ClassroomRepository classroomRepository;
    private final ClassMemberRepository classMemberRepository;
    private final ClassroomCourseRepository classroomCourseRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final GamificationService gamificationService;
    private final ClassFolderRepository classFolderRepository;
    private final ClassResourceRepository classResourceRepository;
    private final ClassroomAuthorizationService authorizationService;
    private final AssignmentRepository assignmentRepository;
    private final ClassExamRepository classExamRepository;
    private final com.uranus.lms.modules.flashcard.FlashcardDeckRepository flashcardDeckRepository;

    @Transactional
    public ClassroomResponse createClassroom(CreateClassroomRequest request, String creatorEmail) {
        User creator = userRepository.findByEmail(creatorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        User teacher = creator;
        if (request.getTeacherId() != null && !request.getTeacherId().trim().isEmpty()) {
            teacher = userRepository.findById(UUID.fromString(request.getTeacherId()))
                    .orElseThrow(() -> new ResourceNotFoundException("Teacher not found"));
        }

        String inviteCode;
        do {
            inviteCode = RandomStringUtils.randomAlphanumeric(6).toUpperCase();
        } while (classroomRepository.findByInviteCode(inviteCode).isPresent());

        Classroom classroom = Classroom.builder()
                .name(request.getName())
                .section(request.getSection())
                .subject(request.getSubject())
                .inviteCode(inviteCode)
                .teacher(teacher)
                .thumbnail(request.getThumbnail())
                .status("ACTIVE")
                .build();

        classroom = classroomRepository.save(classroom);

        ClassMember member = ClassMember.builder()
                .classroom(classroom)
                .user(teacher)
                .role(ClassMemberRole.TEACHER)
                .build();
        classMemberRepository.save(member);

        return mapToResponse(classroom, creator);
    }

    /**
     * Admin creates a lightweight "admin group" for student grouping.
     * No teacher member is added, group is flagged as isAdminGroup=true.
     */
    @Transactional
    public ClassroomResponse createAdminGroup(String name, String description, String subject, String adminEmail) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String inviteCode;
        do {
            inviteCode = RandomStringUtils.randomAlphanumeric(6).toUpperCase();
        } while (classroomRepository.findByInviteCode(inviteCode).isPresent());

        Classroom classroom = Classroom.builder()
                .name(name)
                .section(description)
                .subject(subject)
                .inviteCode(inviteCode)
                .isAdminGroup(true)
                .status("ACTIVE")
                .teacher(admin) // Set admin as teacher to bypass DB NOT NULL constraint if migration hasn't run
                .build();

        classroom = classroomRepository.save(classroom);
        return mapToResponse(classroom);
    }

    /**
     * Admin deletes a classroom (admin groups or regular classes).
     */
    @Transactional
    public void deleteAdminGroup(UUID classId) {
        Classroom classroom = classroomRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom not found"));
        classroomRepository.delete(classroom);
    }

    /**
     * Get all admin groups (isAdminGroup=true).
     */
    @Transactional(readOnly = true)
    public List<ClassroomResponse> getAdminGroups() {
        return classroomRepository.findByIsAdminGroupTrue().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ClassroomResponse updateAdminGroup(UUID classId, String name, String section, String subject, UUID teacherId) {
        Classroom classroom = classroomRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học"));
        
        if (name != null && !name.trim().isEmpty()) {
            classroom.setName(name);
        }
        if (section != null) {
            classroom.setSection(section);
        }
        if (subject != null) {
            classroom.setSubject(subject);
        }
        if (teacherId != null) {
            User teacher = userRepository.findById(teacherId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giáo viên"));
            if (teacher.getRole() != com.uranus.lms.modules.user.Role.TEACHER && teacher.getRole() != com.uranus.lms.modules.user.Role.TEACHING_ASSISTANT && teacher.getRole() != com.uranus.lms.modules.user.Role.ADMIN) {
                throw new BadRequestException("Người dùng không phải là giáo viên hoặc trợ giảng");
            }
            classroom.setTeacher(teacher);
        } else {
            classroom.setTeacher(null); // Allow unsetting teacher
        }
        
        classroomRepository.save(classroom);
        return mapToResponse(classroom, null);
    }

    @Transactional
    public ClassroomResponse updateClassroom(UUID classId, String name, String subject, String section, String email) {
        Classroom classroom = classroomRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học"));
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
                
        if (!classroom.getTeacher().getId().equals(user.getId()) && user.getRole() != com.uranus.lms.modules.user.Role.ADMIN) {
            throw new com.uranus.lms.exception.ForbiddenException("Bạn không có quyền sửa thông tin lớp này");
        }
        
        if (name != null && !name.trim().isEmpty()) classroom.setName(name);
        if (subject != null) classroom.setSubject(subject);
        if (section != null) classroom.setSection(section);
        
        classroomRepository.save(classroom);
        return mapToResponse(classroom, user);
    }

    @Transactional
    public ClassroomResponse joinClassroom(String inviteCode, String studentEmail) {
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Classroom classroom = classroomRepository.findByInviteCode(inviteCode.toUpperCase())
                .orElseThrow(() -> new BadRequestException("Mã lớp không hợp lệ hoặc lớp không tồn tại."));

        if ("ARCHIVED".equals(classroom.getStatus())) {
            throw new BadRequestException("Lớp học này đã bị lưu trữ.");
        }

        if (classMemberRepository.existsByClassroomIdAndUserId(classroom.getId(), student.getId())) {
            throw new BadRequestException("Bạn đã tham gia lớp học này rồi.");
        }

        ClassMemberRole memberRole = (student.getRole() == com.uranus.lms.modules.user.Role.TEACHER)
                ? ClassMemberRole.TEACHER
                : (student.getRole() == com.uranus.lms.modules.user.Role.TEACHING_ASSISTANT)
                ? ClassMemberRole.TA
                : ClassMemberRole.STUDENT;

        ClassMember member = ClassMember.builder()
                .classroom(classroom)
                .user(student)
                .role(memberRole)
                .build();
        classMemberRepository.save(member);

        // Send notification to all teachers and TAs of the classroom
        List<ClassMember> teachersAndTAs = classMemberRepository.findByClassroomId(classroom.getId()).stream()
                .filter(m -> m.getRole() == ClassMemberRole.TEACHER || m.getRole() == ClassMemberRole.TA)
                .toList();
        for (ClassMember t : teachersAndTAs) {
            notificationService.sendNotification(
                    t.getUser(),
                    "Học sinh mới tham gia",
                    student.getFullName() + " đã tham gia lớp học " + classroom.getName(),
                    "/classes/" + classroom.getId() + "?tab=people",
                    NotificationType.CLASSROOM,
                    student,
                    "CLASSROOM",
                    classroom.getId().toString()
            );
        }
        if (classroom.getTeacher() != null && teachersAndTAs.stream().noneMatch(t -> t.getUser().getId().equals(classroom.getTeacher().getId()))) {
            notificationService.sendNotification(
                    classroom.getTeacher(),
                    "Học sinh mới tham gia",
                    student.getFullName() + " đã tham gia lớp học " + classroom.getName(),
                    "/classes/" + classroom.getId() + "?tab=people",
                    NotificationType.CLASSROOM,
                    student,
                    "CLASSROOM",
                    classroom.getId().toString()
            );
        }

        // Record gamification activity for student
        gamificationService.recordActivity(student, "CLASSROOM_JOIN");

        return mapToResponse(classroom);
    }

    @Transactional(readOnly = true)
    public Page<ClassroomResponse> getMyClasses(String email, Pageable pageable) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Page<Classroom> classPage = classroomRepository.findAllActiveClassesByUserId(user.getId(), pageable);
        List<ClassroomResponse> responses = classPage.getContent().stream()
                .map(cls -> mapToResponse(cls, user))
                .sorted((a, b) -> {
                    long aPending = a.getPendingCount() != null ? a.getPendingCount() : 0;
                    long bPending = b.getPendingCount() != null ? b.getPendingCount() : 0;
                    if (aPending > 0 && bPending == 0) return -1;
                    if (aPending == 0 && bPending > 0) return 1;

                    if (a.getNearestDeadline() != null && b.getNearestDeadline() != null) {
                        int comp = a.getNearestDeadline().compareTo(b.getNearestDeadline());
                        if (comp != 0) return comp;
                    } else if (a.getNearestDeadline() != null) {
                        return -1;
                    } else if (b.getNearestDeadline() != null) {
                        return 1;
                    }

                    if (aPending != bPending) {
                        return Long.compare(bPending, aPending);
                    }

                    return a.getName().compareToIgnoreCase(b.getName());
                })
                .collect(Collectors.toList());

        return new org.springframework.data.domain.PageImpl<>(responses, pageable, classPage.getTotalElements());
    }
    
    @Transactional(readOnly = true)
    public ClassroomResponse getClassroomById(UUID classId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
                
        Classroom classroom = classroomRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom not found"));
                
        checkClassAccess(classroom, user);
        
        return mapToResponse(classroom, user);
    }

    @Transactional(readOnly = true)
    public List<ClassMemberResponse> getMembers(UUID classId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        Classroom classroom = classroomRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom not found"));
                
        checkClassAccess(classroom, user);
        
        return classMemberRepository.findByClassroomId(classId).stream()
                .map(this::mapToMemberResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void removeMember(UUID classId, UUID studentId, String teacherEmail) {
        User teacher = userRepository.findByEmail(teacherEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher not found"));
                
        Classroom classroom = classroomRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom not found"));
                
        if (!authorizationService.canManageClassroom(classroom, teacher)) {
            throw new BadRequestException("Chỉ giáo viên mới có thể xóa thành viên.");
        }
        
        ClassMember member = classMemberRepository.findByClassroomIdAndUserId(classId, studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found in this class"));
                
        if (classroom.getTeacher() != null && classroom.getTeacher().getId().equals(studentId)) {
            throw new BadRequestException("Không thể xóa chủ sở hữu lớp học khỏi lớp.");
        }
        
        classMemberRepository.delete(member);

        // Notify removed member
        notificationService.sendNotification(
                member.getUser(),
                "Thông báo lớp học",
                "Bạn đã được xóa khỏi lớp học " + classroom.getName(),
                "/classes",
                NotificationType.CLASSROOM,
                teacher,
                "CLASSROOM_MEMBER",
                classroom.getId().toString()
        );
    }

    @Transactional
    public void updateMemberRole(UUID classId, UUID studentId, String roleStr, String teacherEmail) {
        User teacher = userRepository.findByEmail(teacherEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher not found"));
                
        Classroom classroom = classroomRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom not found"));
                
        if (!authorizationService.canManageClassroom(classroom, teacher)) {
            throw new BadRequestException("Chỉ giáo viên và trợ giảng quản lý lớp mới có thể thay đổi vai trò.");
        }
        
        ClassMember member = classMemberRepository.findByClassroomIdAndUserId(classId, studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found in this class"));
                
        if (classroom.getTeacher() != null && classroom.getTeacher().getId().equals(studentId)) {
            throw new BadRequestException("Không thể thay đổi vai trò của chủ sở hữu lớp học.");
        }
        
        try {
            ClassMemberRole newRole = ClassMemberRole.valueOf(roleStr.toUpperCase());
            member.setRole(newRole);
            classMemberRepository.save(member);

            // Notify member about role update
            notificationService.sendNotification(
                    member.getUser(),
                    "Cập nhật vai trò trong lớp",
                    "Vai trò của bạn trong lớp " + classroom.getName() + " đã được cập nhật thành: " + newRole.name(),
                    "/classes/" + classroom.getId(),
                    NotificationType.CLASSROOM,
                    teacher,
                    "CLASSROOM_MEMBER",
                    classroom.getId().toString()
            );
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Vai trò không hợp lệ: " + roleStr);
        }
    }

    @Transactional
    public ClassMemberResponse addMemberByEmail(UUID classId, com.uranus.lms.modules.classroom.dto.AddMemberRequest request, String teacherEmail) {
        User teacher = userRepository.findByEmail(teacherEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher not found"));
                
        Classroom classroom = classroomRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom not found"));
                
        if (!authorizationService.canManageClassroom(classroom, teacher)) {
            throw new BadRequestException("Chỉ giáo viên và trợ giảng quản lý lớp mới có thể thêm thành viên.");
        }
        
        User targetUser = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với email này trên hệ thống."));
                
        if (classroom.getTeacher() != null && classroom.getTeacher().getId().equals(targetUser.getId())) {
            throw new BadRequestException("Người dùng này đã là chủ sở hữu của lớp học.");
        }
        
        ClassMemberRole newRole;
        try {
            newRole = ClassMemberRole.valueOf(request.getRole().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Vai trò không hợp lệ: " + request.getRole());
        }
        
        ClassMember member = classMemberRepository.findByClassroomIdAndUserId(classId, targetUser.getId())
                .orElse(null);
                
        if (newRole == ClassMemberRole.TEACHER) {
            if (classroom.getTeacher() == null || classroom.getTeacher().getRole() == com.uranus.lms.modules.user.Role.ADMIN || classroom.getTeacher().getRole() == com.uranus.lms.modules.user.Role.OFFICE) {
                classroom.setTeacher(targetUser);
                classroomRepository.save(classroom);
            }
        }

        if (member != null) {
            member.setRole(newRole);
            ClassMember saved = classMemberRepository.save(member);
            notificationService.sendNotification(
                    targetUser,
                    "Cập nhật vai trò trong lớp",
                    "Vai trò của bạn trong lớp " + classroom.getName() + " đã được cập nhật thành: " + newRole.name(),
                    "/classes/" + classroom.getId(),
                    NotificationType.CLASSROOM,
                    teacher,
                    "CLASSROOM_MEMBER",
                    classroom.getId().toString()
            );
            return mapToMemberResponse(saved);
        }
        
        ClassMember newMember = ClassMember.builder()
                .classroom(classroom)
                .user(targetUser)
                .role(newRole)
                .build();
                
        ClassMember saved = classMemberRepository.save(newMember);

        // Notify newly added user
        notificationService.sendNotification(
                targetUser,
                "Bạn đã được thêm vào lớp học",
                "Bạn đã được thêm vào lớp học " + classroom.getName() + " với vai trò " + newRole.name(),
                "/classes/" + classroom.getId(),
                NotificationType.CLASSROOM,
                teacher,
                "CLASSROOM_MEMBER",
                classroom.getId().toString()
        );

        return mapToMemberResponse(saved);
    }

    @Transactional
    public void updateLeaderboardEnabled(UUID classId, boolean enabled, String teacherEmail) {
        User teacher = userRepository.findByEmail(teacherEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher not found"));
        Classroom classroom = classroomRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom not found"));
        if (!authorizationService.canManageClassroom(classroom, teacher)) {
            throw new BadRequestException("Chỉ giáo viên và trợ giảng quản lý lớp mới có thể thay đổi cài đặt.");
        }
        classroom.setLeaderboardEnabled(enabled);
        classroomRepository.save(classroom);
    }

    @Transactional
    public void updateMeetingLink(UUID classId, String meetingLink, String teacherEmail) {
        Classroom classroom = getAndCheckClassAccess(classId, teacherEmail, true);
        classroom.setMeetingLink(meetingLink);
        classroomRepository.save(classroom);
    }

    @Transactional
    public void updateThumbnail(UUID classId, String thumbnail, String teacherEmail) {
        Classroom classroom = getAndCheckClassAccess(classId, teacherEmail, true);
        classroom.setThumbnail(thumbnail);
        classroomRepository.save(classroom);
    }

    @Transactional(readOnly = true)
    public List<LinkedCourseResponse> getLinkedCourses(UUID classId, String email) {
        verifyClassAccess(classId, email);
        return classroomCourseRepository.findByClassroomIdOrderByLinkedAtDesc(classId).stream()
                .map(this::mapToLinkedCourse)
                .collect(Collectors.toList());
    }

    @Transactional
    public LinkedCourseResponse linkCourse(UUID classId, UUID courseId, String teacherEmail) {
        User teacher = userRepository.findByEmail(teacherEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher not found"));
        Classroom classroom = classroomRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom not found"));
        if (!authorizationService.canManageClassroom(classroom, teacher)) {
            throw new BadRequestException("Chỉ giáo viên và trợ giảng quản lý lớp mới có thể liên kết khóa học.");
        }
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Khóa học không tồn tại"));
        if (teacher.getRole() != Role.ADMIN && !course.getTeacher().getId().equals(teacher.getId())) {
            throw new BadRequestException("Bạn chỉ có thể liên kết khóa học do mình tạo.");
        }
        if (classroomCourseRepository.existsByClassroomIdAndCourseId(classId, courseId)) {
            throw new BadRequestException("Khóa học đã được liên kết với lớp này.");
        }
        ClassroomCourse link = ClassroomCourse.builder()
                .classroom(classroom)
                .course(course)
                .build();
        return mapToLinkedCourse(classroomCourseRepository.save(link));
    }

    @Transactional
    public void unlinkCourse(UUID classId, UUID courseId, String teacherEmail) {
        User teacher = userRepository.findByEmail(teacherEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher not found"));
        Classroom classroom = classroomRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom not found"));
        if (!authorizationService.canManageClassroom(classroom, teacher)) {
            throw new BadRequestException("Chỉ giáo viên và trợ giảng quản lý lớp mới có thể gỡ liên kết.");
        }
        ClassroomCourse link = classroomCourseRepository.findByClassroomIdAndCourseId(classId, courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Liên kết không tồn tại"));
        classroomCourseRepository.delete(link);
    }

    @Transactional(readOnly = true)
    public List<ClassroomResponse> getAllClassrooms() {
        return classroomRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private void verifyClassAccess(UUID classId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Classroom classroom = classroomRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom not found"));
        checkClassAccess(classroom, user);
    }

    private void checkClassAccess(Classroom classroom, User user) {
        if (user.getRole() == com.uranus.lms.modules.user.Role.ADMIN || user.getRole() == com.uranus.lms.modules.user.Role.OFFICE) {
            return;
        }
        if (classroom.getTeacher() != null && classroom.getTeacher().getId().equals(user.getId())) {
            return;
        }
        if (authorizationService.canManageClassroom(classroom, user)) {
            return;
        }
        if (authorizationService.isTeacherOrTA(classroom, user)) {
            return;
        }
        if (classMemberRepository.existsByClassroomIdAndUserId(classroom.getId(), user.getId())) {
            return;
        }
        throw new BadRequestException("Bạn không có quyền truy cập lớp học này.");
    }

    @Transactional(readOnly = true)
    public List<ClassFolderResponse> getClassFolders(UUID classId, String email) {
        verifyClassAccess(classId, email);
        return classFolderRepository.findByClassroomIdOrderByCreatedAtAsc(classId).stream()
                .map(this::mapToFolderResponse)
                .collect(Collectors.toList());
    }

    /** Chu de long nhau toi da bay nhieu cap, vi du CHUONG / BAI / LUYEN TAP la 3 cap. */
    private static final int MAX_FOLDER_DEPTH = 4;

    @Transactional
    public ClassFolderResponse createClassFolder(UUID classId, String name, UUID parentId, String teacherEmail) {
        User teacher = userRepository.findByEmail(teacherEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Classroom classroom = classroomRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom not found"));
        if (!authorizationService.isTeacherOrTA(classroom, teacher)) {
            throw new BadRequestException("Chỉ giáo viên và trợ giảng quản lý lớp mới có thể tạo thư mục.");
        }
        if (name == null || name.trim().isEmpty()) {
            throw new BadRequestException("Tên thư mục không được để trống.");
        }

        ClassFolder parent = resolveParentFolder(classId, parentId);
        if (parent != null && depthOf(parent) + 1 > MAX_FOLDER_DEPTH) {
            throw new BadRequestException("Chủ đề chỉ được lồng tối đa " + MAX_FOLDER_DEPTH + " cấp.");
        }

        ClassFolder folder = ClassFolder.builder()
                .classroom(classroom)
                .name(name.trim())
                .parent(parent)
                .build();
        return mapToFolderResponse(classFolderRepository.save(folder));
    }

    /**
     * @param parentIdProvided true khi nguoi goi thuc su muon doi chu de cha.
     *                         Phan biet "khong gui truong nay" voi "gui null de
     *                         dua ve cap goc" - hai y nghia hoan toan khac nhau.
     */
    @Transactional
    public ClassFolderResponse updateClassFolder(UUID classId, UUID folderId, String name,
                                                 UUID parentId, boolean parentIdProvided,
                                                 String teacherEmail) {
        User teacher = userRepository.findByEmail(teacherEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Classroom classroom = classroomRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom not found"));
        if (!authorizationService.isTeacherOrTA(classroom, teacher)) {
            throw new BadRequestException("Chỉ giáo viên và trợ giảng quản lý lớp mới có thể sửa thư mục.");
        }
        ClassFolder folder = classFolderRepository.findById(folderId)
                .orElseThrow(() -> new ResourceNotFoundException("Thư mục không tồn tại"));
        if (!folder.getClassroom().getId().equals(classId)) {
            throw new BadRequestException("Thư mục không thuộc lớp học này.");
        }
        if (name != null && !name.trim().isEmpty()) {
            folder.setName(name.trim());
        }

        if (parentIdProvided) {
            ClassFolder newParent = resolveParentFolder(classId, parentId);

            if (newParent != null) {
                if (newParent.getId().equals(folder.getId())) {
                    throw new BadRequestException("Không thể đặt một chủ đề làm chủ đề cha của chính nó.");
                }
                // Keo mot chu de vao trong chinh nhanh con cua no se cat roi ca nhanh
                // khoi cay va tao vong lap vo han khi duyet.
                if (isDescendantOf(newParent, folder)) {
                    throw new BadRequestException("Không thể chuyển một chủ đề vào bên trong chủ đề con của nó.");
                }
                int newDepth = depthOf(newParent) + subtreeHeight(folder, classId);
                if (newDepth > MAX_FOLDER_DEPTH) {
                    throw new BadRequestException("Chuyển vào đây sẽ vượt quá "
                            + MAX_FOLDER_DEPTH + " cấp cho phép.");
                }
            }
            folder.setParent(newParent);
        }

        return mapToFolderResponse(classFolderRepository.save(folder));
    }

    /** Lay chu de cha va bao dam no thuoc dung lop hoc dang thao tac. */
    private ClassFolder resolveParentFolder(UUID classId, UUID parentId) {
        if (parentId == null) return null;
        ClassFolder parent = classFolderRepository.findById(parentId)
                .orElseThrow(() -> new ResourceNotFoundException("Chủ đề cha không tồn tại"));
        if (!parent.getClassroom().getId().equals(classId)) {
            throw new BadRequestException("Chủ đề cha không thuộc lớp học này.");
        }
        return parent;
    }

    /** Cap cua mot chu de: goc la 1. */
    private int depthOf(ClassFolder folder) {
        int depth = 1;
        ClassFolder current = folder.getParent();
        // Chan cung theo MAX_FOLDER_DEPTH: neu du lieu cu tung bi loi va tao ra
        // vong lap, vong lap nay van dung chu khong treo server.
        while (current != null && depth <= MAX_FOLDER_DEPTH + 1) {
            depth++;
            current = current.getParent();
        }
        return depth;
    }

    private boolean isDescendantOf(ClassFolder candidate, ClassFolder ancestor) {
        ClassFolder current = candidate.getParent();
        int guard = 0;
        while (current != null && guard++ <= MAX_FOLDER_DEPTH + 1) {
            if (current.getId().equals(ancestor.getId())) return true;
            current = current.getParent();
        }
        return false;
    }

    /** So cap ma nhanh bat dau tu folder dang chiem cho (chi mot minh no = 1). */
    private int subtreeHeight(ClassFolder folder, UUID classId) {
        List<ClassFolder> all = classFolderRepository.findByClassroomIdOrderByCreatedAtAsc(classId);
        Map<UUID, List<ClassFolder>> childrenOf = new HashMap<>();
        for (ClassFolder f : all) {
            UUID parentKey = f.getParent() != null ? f.getParent().getId() : null;
            if (parentKey != null) {
                childrenOf.computeIfAbsent(parentKey, k -> new ArrayList<>()).add(f);
            }
        }
        return heightFrom(folder.getId(), childrenOf, 0);
    }

    private int heightFrom(UUID folderId, Map<UUID, List<ClassFolder>> childrenOf, int guard) {
        if (guard > MAX_FOLDER_DEPTH + 1) return guard;
        List<ClassFolder> children = childrenOf.get(folderId);
        if (children == null || children.isEmpty()) return 1;
        int best = 1;
        for (ClassFolder child : children) {
            best = Math.max(best, 1 + heightFrom(child.getId(), childrenOf, guard + 1));
        }
        return best;
    }

    @Transactional
    public void deleteClassFolder(UUID classId, UUID folderId, String teacherEmail) {
        User teacher = userRepository.findByEmail(teacherEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Classroom classroom = classroomRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom not found"));
        if (!authorizationService.isTeacherOrTA(classroom, teacher)) {
            throw new BadRequestException("Chỉ giáo viên và trợ giảng quản lý lớp mới có thể xóa thư mục.");
        }
        ClassFolder folder = classFolderRepository.findById(folderId)
                .orElseThrow(() -> new ResourceNotFoundException("Thư mục không tồn tại"));
        if (!folder.getClassroom().getId().equals(classId)) {
            throw new BadRequestException("Thư mục không thuộc lớp học này.");
        }
        classFolderRepository.delete(folder);
    }

    private ClassFolderResponse mapToFolderResponse(ClassFolder folder) {
        return ClassFolderResponse.builder()
                .id(folder.getId())
                .name(folder.getName())
                .classroomId(folder.getClassroom().getId())
                .parentId(folder.getParent() != null ? folder.getParent().getId() : null)
                .createdAt(folder.getCreatedAt())
                .build();
    }

    private LinkedCourseResponse mapToLinkedCourse(ClassroomCourse link) {
        Course course = link.getCourse();
        return LinkedCourseResponse.builder()
                .id(link.getId())
                .courseId(course.getId())
                .title(course.getTitle())
                .description(course.getDescription())
                .status(course.getStatus() != null ? course.getStatus().name() : null)
                .linkedAt(link.getLinkedAt())
                .build();
    }

    private boolean isTeacherOrAdmin(Classroom classroom, User user) {
        if (user.getRole().name().equals("ADMIN")) {
            return true;
        }
        if (authorizationService.canManageClassroom(classroom, user)) {
            return true;
        }
        return classMemberRepository.findByClassroomIdAndUserId(classroom.getId(), user.getId())
                .map(m -> m.getRole().name().equals("TEACHER"))
                .orElse(false);
    }

    private ClassroomResponse mapToResponse(Classroom classroom) {
        return mapToResponse(classroom, null);
    }

    private ClassroomResponse mapToResponse(Classroom classroom, User currentUser) {
        List<ClassMember> members = classMemberRepository.findByClassroomId(classroom.getId());
        int count = members.size();

        User primaryTeacher = classroom.getTeacher();
        if (primaryTeacher == null || primaryTeacher.getRole() == com.uranus.lms.modules.user.Role.ADMIN || primaryTeacher.getRole() == com.uranus.lms.modules.user.Role.OFFICE) {
            Optional<ClassMember> teacherMember = members.stream()
                    .filter(m -> m.getRole() == ClassMemberRole.TEACHER && m.getUser().getRole() == com.uranus.lms.modules.user.Role.TEACHER)
                    .findFirst();
            if (teacherMember.isPresent()) {
                primaryTeacher = teacherMember.get().getUser();
            } else {
                Optional<ClassMember> anyTeacher = members.stream()
                        .filter(m -> m.getRole() == ClassMemberRole.TEACHER)
                        .findFirst();
                if (anyTeacher.isPresent()) {
                    primaryTeacher = anyTeacher.get().getUser();
                }
            }
        }

        Long pendingCount = null;
        java.time.LocalDateTime nearestDeadline = null;
        String nearestTaskTitle = null;
        String nearestTaskType = null;
        java.time.LocalDateTime now = java.time.LocalDateTime.now();

        if (currentUser != null) {
            if (currentUser.getRole() == com.uranus.lms.modules.user.Role.STUDENT) {
                // Students: find unsubmitted assignments and uncompleted exams
                List<Assignment> pendingAssigns = assignmentRepository.findPendingForStudent(classroom.getId(), currentUser.getId(), now);
                List<ClassExam> pendingExams = classExamRepository.findPendingForStudent(classroom.getId(), currentUser.getId(), now);

                pendingCount = (long) (pendingAssigns.size() + pendingExams.size());

                Assignment firstAssign = pendingAssigns.isEmpty() ? null : pendingAssigns.get(0);
                ClassExam firstExam = pendingExams.isEmpty() ? null : pendingExams.get(0);

                if (firstAssign != null && firstExam != null) {
                    if (firstAssign.getDueDate().isBefore(firstExam.getCloseTime())) {
                        nearestDeadline = firstAssign.getDueDate();
                        nearestTaskTitle = firstAssign.getTitle();
                        nearestTaskType = "ASSIGNMENT";
                    } else {
                        nearestDeadline = firstExam.getCloseTime();
                        nearestTaskTitle = firstExam.getExam() != null ? firstExam.getExam().getTitle() : "Đề thi";
                        nearestTaskType = "EXAM";
                    }
                } else if (firstAssign != null) {
                    nearestDeadline = firstAssign.getDueDate();
                    nearestTaskTitle = firstAssign.getTitle();
                    nearestTaskType = "ASSIGNMENT";
                } else if (firstExam != null) {
                    nearestDeadline = firstExam.getCloseTime();
                    nearestTaskTitle = firstExam.getExam() != null ? firstExam.getExam().getTitle() : "Đề thi";
                    nearestTaskType = "EXAM";
                }
            } else {
                // Teachers / Admins: find total active open assignments and exams
                List<Assignment> upcomingAssigns = assignmentRepository.findUpcomingByClassroomId(classroom.getId(), now);
                List<ClassExam> upcomingExams = classExamRepository.findUpcomingByClassroomId(classroom.getId(), now);

                long activeAssign = assignmentRepository.countActiveByClassroomId(classroom.getId(), now);
                long activeExam = classExamRepository.countActiveByClassroomId(classroom.getId(), now);
                pendingCount = activeAssign + activeExam;

                Assignment firstAssign = upcomingAssigns.isEmpty() ? null : upcomingAssigns.get(0);
                ClassExam firstExam = upcomingExams.isEmpty() ? null : upcomingExams.get(0);

                if (firstAssign != null && firstExam != null) {
                    if (firstAssign.getDueDate().isBefore(firstExam.getCloseTime())) {
                        nearestDeadline = firstAssign.getDueDate();
                        nearestTaskTitle = firstAssign.getTitle();
                        nearestTaskType = "ASSIGNMENT";
                    } else {
                        nearestDeadline = firstExam.getCloseTime();
                        nearestTaskTitle = firstExam.getExam() != null ? firstExam.getExam().getTitle() : "Đề thi";
                        nearestTaskType = "EXAM";
                    }
                } else if (firstAssign != null) {
                    nearestDeadline = firstAssign.getDueDate();
                    nearestTaskTitle = firstAssign.getTitle();
                    nearestTaskType = "ASSIGNMENT";
                } else if (firstExam != null) {
                    nearestDeadline = firstExam.getCloseTime();
                    nearestTaskTitle = firstExam.getExam() != null ? firstExam.getExam().getTitle() : "Đề thi";
                    nearestTaskType = "EXAM";
                }
            }
        }

        return ClassroomResponse.builder()
                .id(classroom.getId())
                .name(classroom.getName())
                .section(classroom.getSection())
                .subject(classroom.getSubject())
                .inviteCode(classroom.getInviteCode())
                .teacherId(primaryTeacher != null ? primaryTeacher.getId() : null)
                .teacherName(primaryTeacher != null ? primaryTeacher.getFullName() : null)
                .teacherAvatar(primaryTeacher != null ? primaryTeacher.getAvatarUrl() : null)
                .memberCount(count)
                .leaderboardEnabled(classroom.getLeaderboardEnabled())
                .meetingLink(classroom.getMeetingLink())
                .thumbnail(classroom.getThumbnail())
                .isAdminGroup(classroom.getIsAdminGroup())
                .status(classroom.getStatus())
                .createdAt(classroom.getCreatedAt())
                .pendingCount(pendingCount)
                .nearestDeadline(nearestDeadline)
                .nearestTaskTitle(nearestTaskTitle)
                .nearestTaskType(nearestTaskType)
                .build();
    }

    @Transactional
    public int broadcastDeadlineReminder(UUID classId, String teacherEmail) {
        User teacher = userRepository.findByEmail(teacherEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher not found"));
        Classroom classroom = classroomRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom not found"));

        if (!authorizationService.isTeacherOrTA(classroom, teacher)) {
            throw new BadRequestException("Chỉ giáo viên hoặc trợ giảng mới có thể gửi nhắc nhở deadline.");
        }

        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        List<ClassMember> studentMembers = classMemberRepository.findByClassroomId(classId).stream()
                .filter(m -> m.getRole() == ClassMemberRole.STUDENT)
                .collect(Collectors.toList());

        int notifiedCount = 0;
        String parentLink = "/classes/" + classId + "/classwork";

        for (ClassMember member : studentMembers) {
            User student = member.getUser();
            long pendingAssign = assignmentRepository.countPendingForStudent(classId, student.getId(), now, now.plusDays(30));
            long pendingExam = classExamRepository.countPendingForStudent(classId, student.getId(), now);
            long totalPending = pendingAssign + pendingExam;

            if (totalPending > 0) {
                notificationService.sendNotification(
                        student,
                        "⏰ Nhắc nhở: Lớp " + classroom.getName() + " có " + totalPending + " bài tập/đề thi sắp đến hạn!",
                        "Giáo viên " + teacher.getFullName() + " nhắc bạn hoàn thành các bài tập/đề thi trước hạn chót. Hãy bấm vào để kiểm tra ngay!",
                        parentLink
                );
                notifiedCount++;
            }
        }

        return notifiedCount;
    }

    private ClassMemberResponse mapToMemberResponse(ClassMember member) {
        return ClassMemberResponse.builder()
                .id(member.getId())
                .userId(member.getUser().getId())
                .fullName(member.getUser().getFullName())
                .email(member.getUser().getEmail())
                .role(member.getRole().name())
                .avatarUrl(member.getUser().getAvatarUrl())
                .joinedAt(member.getJoinedAt())
                .lastActiveAt(member.getUser().getLastActiveAt())
                .studentCode(member.getUser().getStudentCode())
                .phone(member.getUser().getPhone())
                .build();
    }

    @Transactional
    public List<ClassResourceResponse> getClassResources(UUID classId, String userEmail) {
        getAndCheckClassAccess(classId, userEmail, false);
        List<ClassResource> resources = classResourceRepository.findByClassroom_Id(classId);
        List<ClassResourceResponse> responses = new java.util.ArrayList<>();
        List<ClassResource> orphaned = new java.util.ArrayList<>();

        for (ClassResource res : resources) {
            Optional<com.uranus.lms.modules.flashcard.FlashcardDeck> deckOpt = flashcardDeckRepository.findById(res.getResourceId());
            if (deckOpt.isPresent()) {
                com.uranus.lms.modules.flashcard.FlashcardDeck deck = deckOpt.get();
                responses.add(ClassResourceResponse.builder()
                        .id(res.getId())
                        .classroomId(res.getClassroom().getId())
                        .folderId(res.getFolderId())
                        .resourceType(res.getResourceType())
                        .resourceId(res.getResourceId())
                        .createdAt(res.getCreatedAt())
                        .title(deck.getTitle())
                        .description(deck.getDescription())
                        .build());
            } else {
                orphaned.add(res);
            }
        }

        if (!orphaned.isEmpty()) {
            classResourceRepository.deleteAll(orphaned);
        }

        return responses;
    }

    private Classroom getAndCheckClassAccess(UUID classId, String email, boolean teacherOnly) {
        Classroom classroom = classroomRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom not found"));
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getRole() == com.uranus.lms.modules.user.Role.ADMIN || user.getRole() == com.uranus.lms.modules.user.Role.OFFICE) {
            return classroom;
        }
        if (teacherOnly) {
            if (!authorizationService.isTeacherOrTA(classroom, user)
                    && !(classroom.getTeacher() != null && classroom.getTeacher().getId().equals(user.getId()))) {
                throw new BadRequestException("Chỉ giáo viên và trợ giảng quản lý lớp mới có quyền thực hiện.");
            }
        } else {
            if (!(classroom.getTeacher() != null && classroom.getTeacher().getId().equals(user.getId()))
                    && !authorizationService.canManageClassroom(classroom, user)
                    && !authorizationService.isTeacherOrTA(classroom, user)
                    && !classMemberRepository.existsByClassroomIdAndUserId(classId, user.getId())) {
                throw new BadRequestException("Bạn không có quyền truy cập lớp học này.");
            }
        }
        return classroom;
    }

    @Transactional
    public ClassResourceResponse assignResource(UUID classId, AssignResourceRequest request, String teacherEmail) {
        Classroom classroom = getAndCheckClassAccess(classId, teacherEmail, true);
        ClassResource resource = classResourceRepository.findByClassroom_IdAndResourceId(classId, request.getResourceId()).orElse(null);
        if (resource == null) {
            resource = ClassResource.builder()
                    .classroom(classroom)
                    .folderId(request.getFolderId())
                    .resourceType(request.getResourceType())
                    .resourceId(request.getResourceId())
                    .build();
        } else {
            resource.setFolderId(request.getFolderId());
            if (request.getResourceType() != null) {
                resource.setResourceType(request.getResourceType());
            }
        }
        resource = classResourceRepository.save(resource);
        return ClassResourceResponse.builder()
                .id(resource.getId())
                .classroomId(resource.getClassroom().getId())
                .folderId(resource.getFolderId())
                .resourceType(resource.getResourceType())
                .resourceId(resource.getResourceId())
                .createdAt(resource.getCreatedAt())
                .build();
    }

    @Transactional
    public void removeResource(UUID classId, UUID resourceId, String teacherEmail) {
        getAndCheckClassAccess(classId, teacherEmail, true);
        classResourceRepository.deleteById(resourceId);
    }
}
