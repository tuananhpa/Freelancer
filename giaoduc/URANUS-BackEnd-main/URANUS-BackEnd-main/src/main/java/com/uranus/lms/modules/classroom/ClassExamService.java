package com.uranus.lms.modules.classroom;

import com.uranus.lms.exception.BadRequestException;
import com.uranus.lms.exception.ResourceNotFoundException;
import com.uranus.lms.modules.classroom.dto.ClassExamRequest;
import com.uranus.lms.modules.classroom.dto.ClassExamResponse;
import com.uranus.lms.modules.classroom.dto.UpdateClassExamRequest;
import com.uranus.lms.modules.exam.Exam;
import com.uranus.lms.modules.exam.ExamRepository;
import com.uranus.lms.modules.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClassExamService {

    private final ClassExamRepository classExamRepository;
    private final ClassroomRepository classroomRepository;
    private final ExamRepository examRepository;
    private final ClassroomAuthorizationService authorizationService;
    private final ClassMemberRepository classMemberRepository;
    private final com.uranus.lms.modules.notification.NotificationService notificationService;

    public List<ClassExamResponse> getClassExams(UUID classroomId) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom not found"));
        return classExamRepository.findByClassroom(classroom).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ClassExamResponse linkExamToClassroom(UUID classroomId, ClassExamRequest request, User teacher) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom not found"));

        if (!authorizationService.isTeacherOrTA(classroom, teacher)) {
            throw new BadRequestException("Bạn không có quyền quản lý lớp học này");
        }

        Exam exam = examRepository.findById(request.getExamId())
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found"));

        if (classExamRepository.existsByClassroomAndExamId(classroom, exam.getId())) {
            throw new BadRequestException("Bài thi này đã được gán cho lớp học này rồi");
        }

        ClassExam classExam = ClassExam.builder()
                .classroom(classroom)
                .exam(exam)
                .openTime(request.getOpenTime())
                .closeTime(request.getCloseTime())
                .folderId(request.getFolderId())
                .build();

        ClassExam saved = classExamRepository.save(classExam);

        // Notify Students in Classroom
        List<ClassMember> members = classMemberRepository.findByClassroomId(classroom.getId());
        String parentLink = "/classes/" + classroom.getId() + "/classwork";
        String closeStr = saved.getCloseTime() != null
                ? saved.getCloseTime().format(java.time.format.DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy"))
                : "Không giới hạn";

        for (ClassMember m : members) {
            if (m.getRole() == ClassMemberRole.STUDENT) {
                notificationService.sendNotification(
                        m.getUser(),
                        "Đề thi mới: " + exam.getTitle(),
                        "Lớp " + classroom.getName() + " vừa giao đề thi mới. Hạn chót: " + closeStr,
                        parentLink,
                        com.uranus.lms.modules.notification.NotificationType.EXAM,
                        teacher,
                        "CLASS_EXAM",
                        saved.getId().toString()
                );
            }
        }

        return toResponse(saved);
    }

    @Transactional
    public void unlinkExamFromClassroom(UUID classExamId, User teacher) {
        ClassExam classExam = classExamRepository.findById(classExamId)
                .orElseThrow(() -> new ResourceNotFoundException("ClassExam record not found"));

        if (!authorizationService.isTeacherOrTA(classExam.getClassroom(), teacher)) {
            throw new BadRequestException("Bạn không có quyền gỡ bài thi khỏi lớp này");
        }

        classExamRepository.delete(classExam);
    }

    @Transactional
    public ClassExamResponse updateClassExam(UUID classExamId, UpdateClassExamRequest request, User teacher) {
        ClassExam classExam = classExamRepository.findById(classExamId)
                .orElseThrow(() -> new ResourceNotFoundException("ClassExam not found"));

        if (!authorizationService.isTeacherOrTA(classExam.getClassroom(), teacher)) {
            throw new BadRequestException("Bạn không có quyền thao tác với đề thi trong lớp này");
        }

        classExam.setOpenTime(request.getOpenTime());
        classExam.setCloseTime(request.getCloseTime());
        classExam.setFolderId(request.getFolderId());

        return toResponse(classExamRepository.save(classExam));
    }

    private boolean canViewOrManageExamAssignments(Exam exam, User user) {
        if (user == null || exam == null) return false;
        if (user.getRole() == com.uranus.lms.modules.user.Role.ADMIN) return true;
        if (user.getRole() == com.uranus.lms.modules.user.Role.TEACHER || user.getRole() == com.uranus.lms.modules.user.Role.TEACHING_ASSISTANT) return true;
        if (exam.getTeacher() != null && exam.getTeacher().getId().equals(user.getId())) return true;

        List<ClassExam> assigned = classExamRepository.findByExamId(exam.getId());
        for (ClassExam ce : assigned) {
            if (ce.getClassroom() != null && authorizationService.isTeacherOrTA(ce.getClassroom(), user)) {
                return true;
            }
        }

        return false;
    }

    public List<ClassExamResponse> getClassExamsByExamId(UUID examId, User teacher) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found"));

        if (!canViewOrManageExamAssignments(exam, teacher)) {
            throw new BadRequestException("Bạn không có quyền xem thông tin giao đề của đề thi này");
        }

        return classExamRepository.findByExamId(examId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void batchSyncClassExams(UUID examId, com.uranus.lms.modules.classroom.dto.BatchSyncClassExamRequest request, User teacher) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found: " + examId));

        if (!canViewOrManageExamAssignments(exam, teacher)) {
            throw new BadRequestException("Bạn không có quyền thao tác với đề thi này");
        }

        List<ClassExam> existingAssignments = classExamRepository.findByExamId(examId);

        // Delete assignments that are not in the new list
        for (ClassExam existing : existingAssignments) {
            boolean keep = request.getAssignments().stream()
                    .anyMatch(a -> a.getClassroomId().equals(existing.getClassroom().getId()));
            if (!keep) {
                // Remove this assignment
                classExamRepository.delete(existing);
            }
        }

        // Add or update assignments
        for (com.uranus.lms.modules.classroom.dto.BatchSyncClassExamRequest.ClassExamConfig config : request.getAssignments()) {
            Classroom classroom = classroomRepository.findById(config.getClassroomId())
                    .orElseThrow(() -> new ResourceNotFoundException("Classroom not found: " + config.getClassroomId()));

            if (!authorizationService.isTeacherOrTA(classroom, teacher)) {
                continue; // Skip classrooms not owned by the teacher
            }

            ClassExam existing = existingAssignments.stream()
                    .filter(a -> a.getClassroom().getId().equals(config.getClassroomId()))
                    .findFirst()
                    .orElse(null);

            if (existing != null) {
                existing.setFolderId(config.getFolderId());
                existing.setOpenTime(config.getOpenTime());
                existing.setCloseTime(config.getCloseTime());
                classExamRepository.save(existing);
            } else {
                ClassExam newAssign = ClassExam.builder()
                        .classroom(classroom)
                        .exam(exam)
                        .folderId(config.getFolderId())
                        .openTime(config.getOpenTime())
                        .closeTime(config.getCloseTime())
                        .build();
                classExamRepository.save(newAssign);
            }
        }
    }

    private ClassExamResponse toResponse(ClassExam ce) {
        return ClassExamResponse.builder()
                .id(ce.getId())
                .classroomId(ce.getClassroom().getId())
                .examId(ce.getExam().getId())
                .examTitle(ce.getExam().getTitle())
                .durationMinutes(ce.getExam().getDurationMinutes())
                .openTime(ce.getOpenTime())
                .closeTime(ce.getCloseTime())
                .folderId(ce.getFolderId())
                .createdAt(ce.getCreatedAt())
                .questionCount(ce.getExam().getQuestions() != null ? ce.getExam().getQuestions().size() : 0)
                .examType(ce.getExam().getExamType())
                .examEndTime(ce.getExam().getEndTime())
                .examStartTime(ce.getExam().getStartTime())
                .build();
    }
}
