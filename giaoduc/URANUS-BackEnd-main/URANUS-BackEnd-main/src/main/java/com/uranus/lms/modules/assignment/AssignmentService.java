package com.uranus.lms.modules.assignment;

import com.uranus.lms.exception.BadRequestException;
import com.uranus.lms.exception.ResourceNotFoundException;
import com.uranus.lms.modules.assignment.dto.*;
import com.uranus.lms.modules.course.Course;
import com.uranus.lms.modules.course.CourseRepository;
import com.uranus.lms.modules.classroom.Classroom;
import com.uranus.lms.modules.classroom.ClassroomRepository;
import com.uranus.lms.modules.classroom.ClassroomAuthorizationService;
import com.uranus.lms.modules.notification.NotificationService;
import com.uranus.lms.modules.user.Role;
import com.uranus.lms.modules.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository submissionRepository;
    private final CourseRepository courseRepository;
    private final ClassroomRepository classroomRepository;
    private final com.uranus.lms.modules.classroom.ClassMemberRepository classMemberRepository;
    private final NotificationService notificationService;
    private final ClassroomAuthorizationService authorizationService;
    private final AiWritingGradingService aiWritingGradingService;

    private boolean canManageAssignment(Assignment assignment, User user) {
        if (user.getRole() == Role.ADMIN) return true;
        if (assignment.getTeacher().getId().equals(user.getId())) return true;
        if (assignment.getClassroom() != null) {
            return authorizationService.isTeacherOrTA(assignment.getClassroom(), user);
        }
        if (assignment.getCourse() != null) {
            return assignment.getCourse().getTeacher().getId().equals(user.getId());
        }
        return false;
    }

    public Page<AssignmentResponse> getAssignmentsByCourse(UUID courseId, Pageable pageable) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));
        return assignmentRepository.findByCourse(course, pageable).map(this::toResponse);
    }

    public Page<AssignmentResponse> getAssignmentsByClassroom(UUID classroomId, Pageable pageable) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom not found"));
        return assignmentRepository.findByClassroom(classroom, pageable).map(this::toResponse);
    }

    public Page<AssignmentResponse> getTeacherAssignments(User teacher, Pageable pageable) {
        return assignmentRepository.findByTeacher(teacher, pageable).map(this::toResponse);
    }

    public AssignmentResponse getAssignmentById(UUID id) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found"));
        return toResponse(assignment);
    }

    @Transactional
    public AssignmentResponse createAssignment(CreateAssignmentRequest request, User teacher) {
        Course course = null;
        Classroom classroom = null;

        if (request.getCourseId() != null) {
            course = courseRepository.findById(request.getCourseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Course not found"));
            if (teacher.getRole() != Role.ADMIN && !course.getTeacher().getId().equals(teacher.getId())) {
                throw new BadRequestException("Bạn không có quyền tạo bài tập trong khóa học này");
            }
        } else if (request.getClassroomId() != null) {
            classroom = classroomRepository.findById(request.getClassroomId())
                    .orElseThrow(() -> new ResourceNotFoundException("Classroom not found"));
            if (!authorizationService.isTeacherOrTA(classroom, teacher)) {
                throw new BadRequestException("Bạn không có quyền tạo bài tập trong lớp học này");
            }
        } else {
            throw new BadRequestException("Phải cung cấp courseId hoặc classroomId");
        }

        Assignment assignment = Assignment.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .attachmentUrl(request.getAttachmentUrl())
                .dueDate(request.getDueDate())
                .maxScore(request.getMaxScore() != null ? request.getMaxScore() : 100.0)
                .assignmentType(request.getAssignmentType() != null ? request.getAssignmentType() : "WRITING")
                .instructions(request.getInstructions())
                .minWordCount(request.getMinWordCount())
                .maxWordCount(request.getMaxWordCount())
                .expectedAnswer(request.getExpectedAnswer())
                .languageLevel(request.getLanguageLevel())
                .rubricConfig(request.getRubricConfig())
                .course(course)
                .classroom(classroom)
                .teacher(teacher)
                .build();

        Assignment saved = assignmentRepository.save(assignment);

        // Notify Students in Classroom
        if (classroom != null) {
            List<com.uranus.lms.modules.classroom.ClassMember> members = classMemberRepository.findByClassroomId(classroom.getId());
            String parentLink = "/classes/" + classroom.getId() + "/classwork";
            String dueStr = saved.getDueDate() != null 
                    ? saved.getDueDate().format(java.time.format.DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy"))
                    : "Không giới hạn";

            for (com.uranus.lms.modules.classroom.ClassMember m : members) {
                if (m.getRole() == com.uranus.lms.modules.classroom.ClassMemberRole.STUDENT) {
                    notificationService.sendNotification(
                            m.getUser(),
                            "Bài tập mới: " + saved.getTitle(),
                            "Lớp " + classroom.getName() + " có bài tập mới. Hạn nộp: " + dueStr,
                            parentLink + "/assignments/" + saved.getId(),
                            com.uranus.lms.modules.notification.NotificationType.ASSIGNMENT,
                            saved.getTeacher(),
                            "ASSIGNMENT",
                            saved.getId().toString()
                    );
                }
            }
        }

        return toResponse(saved);
    }

    @Transactional
    public AssignmentResponse updateAssignment(UUID id, CreateAssignmentRequest request, User teacher) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found"));

        if (!canManageAssignment(assignment, teacher)) {
            throw new BadRequestException("Bạn không có quyền chỉnh sửa bài tập này");
        }

        assignment.setTitle(request.getTitle());
        assignment.setDescription(request.getDescription());
        assignment.setAttachmentUrl(request.getAttachmentUrl());
        assignment.setDueDate(request.getDueDate());
        if (request.getMaxScore() != null) assignment.setMaxScore(request.getMaxScore());
        if (request.getAssignmentType() != null) assignment.setAssignmentType(request.getAssignmentType());
        if (request.getInstructions() != null) assignment.setInstructions(request.getInstructions());
        if (request.getMinWordCount() != null) assignment.setMinWordCount(request.getMinWordCount());
        if (request.getMaxWordCount() != null) assignment.setMaxWordCount(request.getMaxWordCount());
        if (request.getExpectedAnswer() != null) assignment.setExpectedAnswer(request.getExpectedAnswer());
        if (request.getLanguageLevel() != null) assignment.setLanguageLevel(request.getLanguageLevel());
        if (request.getRubricConfig() != null) assignment.setRubricConfig(request.getRubricConfig());

        return toResponse(assignmentRepository.save(assignment));
    }

    @Transactional
    public void deleteAssignment(UUID id, User teacher) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found"));
        if (!canManageAssignment(assignment, teacher)) {
            throw new BadRequestException("Bạn không có quyền xóa bài tập này");
        }
        assignmentRepository.delete(assignment);
    }

    // --- Submissions ---

    @Transactional
    public AssignmentSubmissionResponse submitAssignment(UUID assignmentId, User student, SubmitAssignmentRequest request) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found"));

        AssignmentSubmission submission = submissionRepository.findByAssignmentAndStudent(assignment, student)
                .orElse(AssignmentSubmission.builder()
                        .assignment(assignment)
                        .student(student)
                        .build());

        submission.setContent(request.getContent());
        submission.setFileUrl(request.getFileUrl());
        submission.setStatus("PENDING");
        submission.setSubmittedAt(LocalDateTime.now());

        AssignmentSubmission saved = submissionRepository.save(submission);

        // Auto-grade sau khi có bài nộp (nếu có nội dung văn bản)
        if (request.getContent() != null && AiWritingGradingService.countWords(request.getContent()) > 0) {
            aiWritingGradingService.gradeSubmissionAsync(saved.getId(), false, student);
        }

        // Notify Teacher
        String parentLink = assignment.getCourse() != null 
                ? "/courses/" + assignment.getCourse().getId() 
                : "/classes/" + assignment.getClassroom().getId() + "/classwork";
                
        if (assignment.getTeacher() != null) {
            notificationService.sendNotification(
                    assignment.getTeacher(),
                    "Học sinh đã nộp bài tập",
                    student.getFullName() + " đã nộp bài tập '" + assignment.getTitle() + "'",
                    parentLink + "/assignments/" + assignmentId + "/submissions",
                    com.uranus.lms.modules.notification.NotificationType.SUBMISSION,
                    student,
                    "ASSIGNMENT_SUBMISSION",
                    saved.getId().toString()
            );
        }

        return toSubmissionResponse(saved);
    }

    public Page<AssignmentSubmissionResponse> getSubmissionsByAssignment(UUID assignmentId, User teacher, Pageable pageable) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found"));
        
        if (!canManageAssignment(assignment, teacher)) {
            throw new BadRequestException("Bạn không có quyền xem danh sách nộp bài này");
        }

        return submissionRepository.findByAssignment(assignment, pageable).map(this::toSubmissionResponse);
    }

    public AssignmentSubmissionResponse getMySubmission(UUID assignmentId, User student) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found"));
        
        return submissionRepository.findByAssignmentAndStudent(assignment, student)
                .map(this::toSubmissionResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Bạn chưa nộp bài tập này"));
    }

    @Transactional
    public AssignmentSubmissionResponse gradeSubmission(UUID submissionId, GradeAssignmentRequest request, User teacher) {
        AssignmentSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found"));

        if (!canManageAssignment(submission.getAssignment(), teacher)) {
            throw new BadRequestException("Bạn không có quyền chấm bài này");
        }

        if (request.getScore() > submission.getAssignment().getMaxScore()) {
            throw new BadRequestException("Điểm không được vượt quá điểm tối đa: " + submission.getAssignment().getMaxScore());
        }

        submission.setScore(request.getScore());
        submission.setFeedback(request.getFeedback());
        submission.setStatus("GRADED");
        submission.setGradedAt(LocalDateTime.now());

        AssignmentSubmission saved = submissionRepository.save(submission);

        // Notify Student
        String parentLink = submission.getAssignment().getCourse() != null 
                ? "/courses/" + submission.getAssignment().getCourse().getId() 
                : "/classes/" + submission.getAssignment().getClassroom().getId() + "/classwork";

        String feedbackInfo = (request.getFeedback() != null && !request.getFeedback().isBlank())
                ? " · Nhận xét: \"" + (request.getFeedback().length() > 50 ? request.getFeedback().substring(0, 50) + "..." : request.getFeedback()) + "\""
                : "";

        notificationService.sendNotification(
                submission.getStudent(),
                "Bài tập đã được chấm điểm",
                "Bài tập '" + submission.getAssignment().getTitle() + "' đã được chấm điểm: " + request.getScore() + "/" + submission.getAssignment().getMaxScore() + feedbackInfo,
                parentLink + "/assignments/" + submission.getAssignment().getId(),
                com.uranus.lms.modules.notification.NotificationType.GRADE,
                teacher,
                "ASSIGNMENT_GRADE",
                saved.getId().toString()
        );

        return toSubmissionResponse(saved);
    }

    private AssignmentResponse toResponse(Assignment a) {
        return AssignmentResponse.builder()
                .id(a.getId())
                .title(a.getTitle())
                .description(a.getDescription())
                .attachmentUrl(a.getAttachmentUrl())
                .dueDate(a.getDueDate())
                .maxScore(a.getMaxScore())
                .courseId(a.getCourse() != null ? a.getCourse().getId() : null)
                .courseName(a.getCourse() != null ? a.getCourse().getTitle() : null)
                .classroomId(a.getClassroom() != null ? a.getClassroom().getId() : null)
                .classroomName(a.getClassroom() != null ? a.getClassroom().getName() : null)
                .teacherName(a.getTeacher().getFullName())
                .assignmentType(a.getAssignmentType())
                .instructions(a.getInstructions())
                .minWordCount(a.getMinWordCount())
                .maxWordCount(a.getMaxWordCount())
                .expectedAnswer(a.getExpectedAnswer())
                .languageLevel(a.getLanguageLevel())
                .rubricConfig(a.getRubricConfig())
                .createdAt(a.getCreatedAt())
                .build();
    }

    private AssignmentSubmissionResponse toSubmissionResponse(AssignmentSubmission s) {
        return AssignmentSubmissionResponse.builder()
                .id(s.getId())
                .assignmentId(s.getAssignment().getId())
                .studentId(s.getStudent().getId())
                .studentName(s.getStudent().getFullName())
                .content(s.getContent())
                .fileUrl(s.getFileUrl())
                .score(s.getScore())
                .feedback(s.getFeedback())
                .status(s.getStatus())
                .submittedAt(s.getSubmittedAt())
                .gradedAt(s.getGradedAt())
                .build();
    }
}
