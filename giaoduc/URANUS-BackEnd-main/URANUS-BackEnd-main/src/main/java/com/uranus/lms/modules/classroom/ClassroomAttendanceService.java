package com.uranus.lms.modules.classroom;

import com.uranus.lms.exception.BadRequestException;
import com.uranus.lms.exception.ResourceNotFoundException;
import com.uranus.lms.modules.classroom.dto.AttendanceResponse;
import com.uranus.lms.modules.classroom.dto.RecordAttendanceRequest;
import com.uranus.lms.modules.user.User;
import com.uranus.lms.modules.user.UserRepository;
import com.uranus.lms.modules.classroom.ClassroomAuthorizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClassroomAttendanceService {

    private final ClassroomRepository classroomRepository;
    private final ClassMemberRepository classMemberRepository;
    private final AttendanceRepository attendanceRepository;
    private final UserRepository userRepository;
    private final ClassroomAuthorizationService authorizationService;
    private final com.uranus.lms.modules.notification.NotificationService notificationService;

    private void verifyTeacherOrTA(Classroom classroom, User currentUser) {
        if (authorizationService.canManageClassroom(classroom, currentUser)) {
            return; // OK, is owner/teacher/admin
        }
        ClassMember member = classMemberRepository.findByClassroomIdAndUserId(classroom.getId(), currentUser.getId())
                .orElseThrow(() -> new BadRequestException("Bạn không phải thành viên lớp này"));
        if (member.getRole() != ClassMemberRole.TA) {
            throw new BadRequestException("Chỉ Giáo viên hoặc Trợ giảng mới có quyền điểm danh");
        }
    }

    public AttendanceResponse getAttendance(UUID classroomId, Integer weekNumber, Integer sessionNumber, String email) {
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Lớp học không tồn tại"));

        verifyTeacherOrTA(classroom, currentUser);

        List<ClassMember> students = classMemberRepository.findByClassroomId(classroomId).stream()
                .filter(m -> m.getRole() == ClassMemberRole.STUDENT)
                .collect(Collectors.toList());

        List<Attendance> attendances = attendanceRepository.findByClassroomAndWeekNumberAndSessionNumber(classroom, weekNumber, sessionNumber);
        Map<UUID, AttendanceStatus> attendanceMap = attendances.stream()
                .collect(Collectors.toMap(a -> a.getStudent().getId(), Attendance::getStatus));

        List<AttendanceResponse.StudentAttendance> records = students.stream()
                .map(s -> AttendanceResponse.StudentAttendance.builder()
                        .studentId(s.getUser().getId())
                        .studentName(s.getUser().getFullName())
                        .avatarUrl(s.getUser().getAvatarUrl())
                        .status(attendanceMap.get(s.getUser().getId())) // Can be null if not recorded yet
                        .build())
                .collect(Collectors.toList());

        return AttendanceResponse.builder()
                .weekNumber(weekNumber)
                .sessionNumber(sessionNumber)
                .records(records)
                .build();
    }

    @Transactional
    public AttendanceResponse recordAttendance(UUID classroomId, RecordAttendanceRequest request, String email) {
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Lớp học không tồn tại"));

        verifyTeacherOrTA(classroom, currentUser);

        Integer weekNumber = request.getWeekNumber();
        Integer sessionNumber = request.getSessionNumber();

        for (RecordAttendanceRequest.StudentAttendance record : request.getRecords()) {
            User student = userRepository.findById(record.getStudentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Học sinh không tồn tại: " + record.getStudentId()));

            Optional<Attendance> existing = attendanceRepository.findByClassroomAndStudentIdAndWeekNumberAndSessionNumber(classroom, student.getId(), weekNumber, sessionNumber);

            if (existing.isPresent()) {
                Attendance att = existing.get();
                att.setStatus(record.getStatus());
                att.setRecordedBy(currentUser);
                attendanceRepository.save(att);
            } else {
                Attendance att = Attendance.builder()
                        .classroom(classroom)
                        .student(student)
                        .date(LocalDate.now())
                        .weekNumber(weekNumber)
                        .sessionNumber(sessionNumber)
                        .status(record.getStatus())
                        .recordedBy(currentUser)
                        .build();
                attendanceRepository.save(att);
            }

            // If marked Absent, notify student
            if (record.getStatus() != null && record.getStatus() != AttendanceStatus.PRESENT) {
                String statusLabel = record.getStatus() == AttendanceStatus.ABSENT_EXCUSED ? "Vắng có phép" : "Vắng không phép";
                notificationService.sendNotification(
                        student,
                        "Thông báo điểm danh: " + statusLabel,
                        "Bạn được ghi nhận " + statusLabel + " trong buổi học Tuần " + weekNumber + " - Buổi " + sessionNumber + " (" + classroom.getName() + ").",
                        "/classes/" + classroomId,
                        com.uranus.lms.modules.notification.NotificationType.CLASSROOM,
                        currentUser,
                        "ATTENDANCE",
                        classroomId + "_" + weekNumber + "_" + sessionNumber
                );
            }
        }

        return getAttendance(classroomId, weekNumber, sessionNumber, email);
    }
}
