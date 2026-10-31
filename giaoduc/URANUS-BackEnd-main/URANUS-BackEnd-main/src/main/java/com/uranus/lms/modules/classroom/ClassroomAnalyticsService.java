package com.uranus.lms.modules.classroom;

import com.uranus.lms.exception.BadRequestException;
import com.uranus.lms.exception.ResourceNotFoundException;
import com.uranus.lms.modules.assignment.Assignment;
import com.uranus.lms.modules.assignment.AssignmentRepository;
import com.uranus.lms.modules.assignment.AssignmentSubmission;
import com.uranus.lms.modules.assignment.AssignmentSubmissionRepository;
import com.uranus.lms.modules.classroom.dto.GradebookResponse;
import com.uranus.lms.modules.user.User;
import com.uranus.lms.modules.classroom.ClassroomAuthorizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.uranus.lms.modules.exam.Exam;
import com.uranus.lms.modules.exam.StudentExamResult;
import com.uranus.lms.modules.exam.StudentExamResultRepository;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClassroomAnalyticsService {

    private final ClassroomRepository classroomRepository;
    private final ClassMemberRepository classMemberRepository;
    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository submissionRepository;
    private final ClassExamRepository classExamRepository;
    private final StudentExamResultRepository studentExamResultRepository;
    private final ClassroomAuthorizationService authorizationService;

    public GradebookResponse getGradebook(UUID classroomId, User requester) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom not found"));

        // Check if teacher or TA (in this class context) or Admin
        // We will skip strict check here or do a basic one
        
        List<GradebookResponse.ClassworkInfo> classworks = new ArrayList<>();
        Map<UUID, Map<UUID, GradebookResponse.SubmissionStatus>> studentScoreMap = new HashMap<>();

        // 1. Fetch Assignments
        List<Assignment> assignments = assignmentRepository.findByClassroom(classroom, Pageable.unpaged()).getContent();
        for (Assignment a : assignments) {
            classworks.add(GradebookResponse.ClassworkInfo.builder()
                    .id(a.getId())
                    .title(a.getTitle())
                    .type("ASSIGNMENT")
                    .maxScore(a.getMaxScore())
                    .dueDate(a.getDueDate() != null ? a.getDueDate().toString() : null)
                    .build());
        }

        // 2. Fetch ClassExams
        List<ClassExam> classExams = classExamRepository.findByClassroom(classroom);
        List<Exam> exams = new ArrayList<>();
        for (ClassExam ce : classExams) {
            exams.add(ce.getExam());
            classworks.add(GradebookResponse.ClassworkInfo.builder()
                    .id(ce.getExam().getId()) // using Exam ID as the key for submissions
                    .title(ce.getExam().getTitle())
                    .type("EXAM")
                    .maxScore(10.0) // Exam score is usually out of 10 or 100, we'll assume 10.0 for now
                    .dueDate(ce.getCloseTime() != null ? ce.getCloseTime().toString() : null)
                    .build());
        }

        // 3. Fetch all student members
        List<ClassMember> members = classMemberRepository.findByClassroomId(classroomId);
        List<ClassMember> students = members.stream()
                .filter(m -> m.getRole() == ClassMemberRole.STUDENT)
                .collect(Collectors.toList());

        // Initialize score map for all students to handle ASSIGNED / MISSING defaults
        for (ClassMember s : students) {
            studentScoreMap.put(s.getUser().getId(), new HashMap<>());
        }

        // 4. Process Assignment Submissions
        List<AssignmentSubmission> submissions = assignments.isEmpty() ? List.of() : submissionRepository.findByAssignmentIn(assignments);
        Map<String, AssignmentSubmission> subMap = new HashMap<>();
        for (AssignmentSubmission sub : submissions) {
            subMap.put(sub.getStudent().getId() + "_" + sub.getAssignment().getId(), sub);
        }

        LocalDateTime now = LocalDateTime.now();

        for (ClassMember student : students) {
            UUID studentId = student.getUser().getId();
            for (Assignment a : assignments) {
                AssignmentSubmission sub = subMap.get(studentId + "_" + a.getId());
                GradebookResponse.SubmissionStatus status = GradebookResponse.SubmissionStatus.builder().build();

                if (sub == null) {
                    if (a.getDueDate() != null && a.getDueDate().isBefore(now)) {
                        status.setStatus("MISSING");
                    } else {
                        status.setStatus("ASSIGNED");
                    }
                } else {
                    if ("GRADED".equals(sub.getStatus())) {
                        status.setStatus("GRADED");
                        status.setScore(sub.getScore() != null ? Math.round(sub.getScore() * 10.0) / 10.0 : 0.0);
                    } else {
                        status.setStatus("TURNED_IN");
                    }
                }
                studentScoreMap.get(studentId).put(a.getId(), status);
            }
        }

        // 5. Process Exam Results
        List<StudentExamResult> examResults = exams.isEmpty() ? List.of() : studentExamResultRepository.findByExamIn(exams);
        Map<String, StudentExamResult> resultMap = new HashMap<>();
        for (StudentExamResult res : examResults) {
            // we might have multiple attempts, we'll take the highest score or first completed. 
            // The repository can be tricky if returning multiple, so we just keep replacing to get one (or sort).
            // For simplicity, we just put it in.
            resultMap.put(res.getStudent().getId() + "_" + res.getExam().getId(), res);
        }

        for (ClassMember student : students) {
            UUID studentId = student.getUser().getId();
            for (ClassExam ce : classExams) {
                Exam exam = ce.getExam();
                StudentExamResult res = resultMap.get(studentId + "_" + exam.getId());
                GradebookResponse.SubmissionStatus status = GradebookResponse.SubmissionStatus.builder().build();

                if (res == null || res.getSubmittedAt() == null) {
                    if (ce.getCloseTime() != null && ce.getCloseTime().isBefore(now)) {
                        status.setStatus("MISSING");
                    } else {
                        status.setStatus("ASSIGNED");
                    }
                } else {
                    status.setStatus("GRADED");
                    status.setScore(res.getTotalScore() != null ? Math.round(res.getTotalScore() * 10.0) / 10.0 : 0.0); // Exam scores are usually pre-graded
                }
                studentScoreMap.get(studentId).put(exam.getId(), status);
            }
        }

        // 6. Build final response
        List<GradebookResponse.StudentGrades> studentGrades = students.stream()
                .map(s -> GradebookResponse.StudentGrades.builder()
                        .studentId(s.getUser().getId())
                        .studentName(s.getUser().getFullName())
                        .avatarUrl(s.getUser().getAvatarUrl())
                        .grades(studentScoreMap.get(s.getUser().getId()))
                        .build())
                .collect(Collectors.toList());

        return GradebookResponse.builder()
                .classworks(classworks)
                .students(studentGrades)
                .build();
    }

    public List<LeaderboardEntryDto> getLeaderboard(UUID classroomId, User requester) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom not found"));

        boolean isTeacher = authorizationService.canManageClassroom(classroom, requester);
        if (!Boolean.TRUE.equals(classroom.getLeaderboardEnabled()) && !isTeacher) {
            throw new BadRequestException("Bảng xếp hạng chưa được bật cho lớp này");
        }

        GradebookResponse gradebook = getGradebook(classroomId, classroom.getTeacher());
        List<LeaderboardEntryDto> entries = new ArrayList<>();

        for (GradebookResponse.StudentGrades sg : gradebook.getStudents()) {
            double total = 0;
            int count = 0;
            for (GradebookResponse.SubmissionStatus st : sg.getGrades().values()) {
                if (st.getScore() != null) {
                    total += st.getScore();
                    count++;
                }
            }
            double avg = count > 0 ? total / count : 0;
            entries.add(LeaderboardEntryDto.builder()
                    .studentId(sg.getStudentId())
                    .studentName(sg.getStudentName())
                    .avatarUrl(sg.getAvatarUrl())
                    .averageScore(Math.round(avg * 10.0) / 10.0)
                    .completedCount(count)
                    .build());
        }

        entries.sort((a, b) -> Double.compare(b.getAverageScore(), a.getAverageScore()));
        for (int i = 0; i < entries.size(); i++) {
            entries.get(i).setRank(i + 1);
        }
        return entries;
    }

    @lombok.Data
    @lombok.Builder
    public static class LeaderboardEntryDto {
        private int rank;
        private UUID studentId;
        private String studentName;
        private String avatarUrl;
        private double averageScore;
        private int completedCount;
    }
}
