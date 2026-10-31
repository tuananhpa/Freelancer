package com.uranus.lms.modules.classroom;

import com.uranus.lms.modules.assignment.Assignment;
import com.uranus.lms.modules.assignment.AssignmentRepository;
import com.uranus.lms.modules.notification.NotificationService;
import com.uranus.lms.modules.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
@Slf4j
public class ClassDeadlineReminderScheduler {

    private final AssignmentRepository assignmentRepository;
    private final ClassExamRepository classExamRepository;
    private final ClassMemberRepository classMemberRepository;
    private final NotificationService notificationService;

    // Cache to prevent duplicate automated notifications (key: studentId_itemId_milestone)
    private final Map<String, Long> recentReminderCache = new ConcurrentHashMap<>();

    private static final long DEDUPLICATE_WINDOW_MS = 36 * 60 * 60 * 1000L; // 36 hours
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy");

    /**
     * Tự động quét liên tục mỗi 30 phút.
     * Quét tất cả bài tập & đề thi của mọi lớp học để gửi thông báo nhắc nhở tự động
     * theo 2 mốc thời gian quan trọng:
     *   1. Mốc 24 Giờ trước hạn chót.
     *   2. Mốc Khẩn Cấp (trong vòng 6 giờ cuối cùng).
     */
    @Scheduled(fixedRate = 1800000, initialDelay = 15000) // Every 30 minutes, initial delay 15 seconds
    public void scanAndRemindUpcomingDeadlines() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime next24h = now.plusHours(24);
        long currentTimeMs = System.currentTimeMillis();

        // Clean up expired cache entries older than 36 hours
        recentReminderCache.entrySet().removeIf(entry -> currentTimeMs - entry.getValue() > DEDUPLICATE_WINDOW_MS);

        try {
            // ── 1. Quét BÀI TẬP (Assignments) sắp hết hạn ──────────────────────
            List<Assignment> upcomingAssignments = assignmentRepository.findAllDueBetween(now, next24h);
            for (Assignment a : upcomingAssignments) {
                if (a.getClassroom() == null || a.getDueDate() == null) continue;

                Classroom classroom = a.getClassroom();
                List<ClassMember> members = classMemberRepository.findByClassroomId(classroom.getId());
                String dueStr = a.getDueDate().format(TIME_FORMATTER);
                String link = "/classes/" + classroom.getId() + "/classwork";
                long hoursLeft = Duration.between(now, a.getDueDate()).toHours();
                boolean isUrgent = hoursLeft <= 6;
                String milestone = isUrgent ? "urgent" : "24h";

                int missingStudentCount = 0;

                for (ClassMember member : members) {
                    if (member.getRole() != ClassMemberRole.STUDENT) continue;
                    User student = member.getUser();

                    long pending = assignmentRepository.countPendingForStudent(classroom.getId(), student.getId(), now, a.getDueDate());
                    if (pending > 0) {
                        missingStudentCount++;
                        String cacheKey = student.getId() + "_assign_" + a.getId() + "_" + milestone;

                        if (!recentReminderCache.containsKey(cacheKey)) {
                            recentReminderCache.put(cacheKey, currentTimeMs);

                            if (isUrgent) {
                                notificationService.sendNotification(
                                        student,
                                        "🔥 KHẨN CẤP: Bài tập " + a.getTitle() + " sắp hết hạn!",
                                        "Chỉ còn " + (hoursLeft > 0 ? hoursLeft + " giờ" : "ít phút") + " nữa là hết hạn nộp bài trong lớp " + classroom.getName() + " (" + dueStr + "). Vui lòng nộp ngay!",
                                        link
                                );
                            } else {
                                notificationService.sendNotification(
                                        student,
                                        "⏰ Nhắc nhở hạn chót: " + a.getTitle(),
                                        "Bài tập trong lớp " + classroom.getName() + " sẽ hết hạn nộp vào lúc " + dueStr + ". Hãy sắp xếp hoàn thành sớm!",
                                        link
                                );
                            }
                            log.info("Sent automated assignment [{}] reminder to student {} for assignment {}", milestone, student.getId(), a.getId());
                        }
                    }
                }

                // Báo cáo tóm tắt tự động cho Giáo viên phụ trách
                if (classroom.getTeacher() != null && missingStudentCount > 0 && isUrgent) {
                    String teacherCacheKey = classroom.getTeacher().getId() + "_assign_summary_" + a.getId();
                    if (!recentReminderCache.containsKey(teacherCacheKey)) {
                        recentReminderCache.put(teacherCacheKey, currentTimeMs);
                        notificationService.sendNotification(
                                classroom.getTeacher(),
                                "📊 Tiến độ bài tập: " + a.getTitle(),
                                "Lớp " + classroom.getName() + " có bài tập sắp đến hạn lúc " + dueStr + ". Hiện còn " + missingStudentCount + " học viên chưa nộp bài.",
                                link
                        );
                    }
                }
            }

            // ── 2. Quét ĐỀ THI (Class Exams) sắp đóng ──────────────────────────
            List<ClassExam> upcomingExams = classExamRepository.findAllDueBetween(now, next24h);
            for (ClassExam ce : upcomingExams) {
                if (ce.getClassroom() == null || ce.getExam() == null || ce.getCloseTime() == null) continue;

                Classroom classroom = ce.getClassroom();
                List<ClassMember> members = classMemberRepository.findByClassroomId(classroom.getId());
                String closeStr = ce.getCloseTime().format(TIME_FORMATTER);
                String link = "/classes/" + classroom.getId() + "/classwork";
                long hoursLeft = Duration.between(now, ce.getCloseTime()).toHours();
                boolean isUrgent = hoursLeft <= 6;
                String milestone = isUrgent ? "urgent" : "24h";

                int missingStudentCount = 0;

                for (ClassMember member : members) {
                    if (member.getRole() != ClassMemberRole.STUDENT) continue;
                    User student = member.getUser();

                    long pending = classExamRepository.countPendingForStudent(classroom.getId(), student.getId(), now);
                    if (pending > 0) {
                        missingStudentCount++;
                        String cacheKey = student.getId() + "_exam_" + ce.getId() + "_" + milestone;

                        if (!recentReminderCache.containsKey(cacheKey)) {
                            recentReminderCache.put(cacheKey, currentTimeMs);

                            if (isUrgent) {
                                notificationService.sendNotification(
                                        student,
                                        "🔥 KHẨN CẤP: Đề thi " + ce.getExam().getTitle() + " sắp đóng!",
                                        "Chỉ còn " + (hoursLeft > 0 ? hoursLeft + " giờ" : "ít phút") + " nữa là kết thúc thời gian thi trong lớp " + classroom.getName() + " (" + closeStr + "). Hãy làm bài thi ngay!",
                                        link
                                );
                            } else {
                                notificationService.sendNotification(
                                        student,
                                        "⏰ Nhắc nhở đóng đề thi: " + ce.getExam().getTitle(),
                                        "Đề thi trong lớp " + classroom.getName() + " sẽ đóng vào lúc " + closeStr + ". Hãy chuẩn bị và làm bài sớm!",
                                        link
                                );
                            }
                            log.info("Sent automated exam [{}] reminder to student {} for class exam {}", milestone, student.getId(), ce.getId());
                        }
                    }
                }

                // Báo cáo tóm tắt tự động cho Giáo viên phụ trách
                if (classroom.getTeacher() != null && missingStudentCount > 0 && isUrgent) {
                    String teacherCacheKey = classroom.getTeacher().getId() + "_exam_summary_" + ce.getId();
                    if (!recentReminderCache.containsKey(teacherCacheKey)) {
                        recentReminderCache.put(teacherCacheKey, currentTimeMs);
                        notificationService.sendNotification(
                                classroom.getTeacher(),
                                "📊 Tiến độ đề thi: " + ce.getExam().getTitle(),
                                "Lớp " + classroom.getName() + " có đề thi sắp đóng lúc " + closeStr + ". Hiện còn " + missingStudentCount + " học viên chưa hoàn thành bài thi.",
                                link
                        );
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error in automated deadline reminder scheduler: ", e);
        }
    }
}
