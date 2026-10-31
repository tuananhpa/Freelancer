package com.uranus.lms.modules.analytics;

import com.uranus.lms.modules.course.CourseRepository;
import com.uranus.lms.modules.course.EnrollmentRepository;
import com.uranus.lms.modules.course.LessonProgressRepository;
import com.uranus.lms.modules.exam.ExamRepository;
import com.uranus.lms.modules.exam.StudentExamResultRepository;
import com.uranus.lms.modules.exam.StudentExamResult;
import com.uranus.lms.modules.flashcard.FlashcardDeckRepository;
import com.uranus.lms.modules.gamification.GamificationService;
import com.uranus.lms.modules.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private static final int DASHBOARD_HISTORY_SIZE = 8;
    private static final int PROGRESS_HISTORY_SIZE = 10;
    private static final List<String> DEFAULT_SKILLS =
            List.of("GRAMMAR", "VOCABULARY", "READING", "LISTENING", "WRITING");

    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ExamRepository examRepository;
    private final StudentExamResultRepository studentExamResultRepository;
    private final FlashcardDeckRepository flashcardDeckRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final GamificationService gamificationService;
    private final com.uranus.lms.modules.user.UserRepository userRepository;
    private final com.uranus.lms.modules.classroom.ClassroomRepository classroomRepository;

    public AnalyticsDto.AdminDashboardStats getAdminStats() {
        long totalUsers = userRepository.count();
        long totalTeachers = userRepository.countByRole(com.uranus.lms.modules.user.Role.TEACHER);
        long totalStudents = userRepository.countByRole(com.uranus.lms.modules.user.Role.STUDENT);
        long totalCourses = courseRepository.count();
        long totalClasses = classroomRepository.count();
        long totalExams = examRepository.count();

        // Truoc day khong duoc gan, nen frontend luon nhan null va bieu do
        // luon bao "chua co du lieu" du he thong da co nguoi dung dang ky.
        List<AnalyticsDto.MonthlyEnrollmentStat> newUsersByMonth = new ArrayList<>();
        for (Object[] row : userRepository.countNewUsersByMonth()) {
            newUsersByMonth.add(AnalyticsDto.MonthlyEnrollmentStat.builder()
                    .month((String) row[0])
                    .count(((Number) row[1]).longValue())
                    .build());
        }

        return AnalyticsDto.AdminDashboardStats.builder()
                .totalUsers(totalUsers)
                .totalTeachers(totalTeachers)
                .totalStudents(totalStudents)
                .totalCourses(totalCourses)
                .totalClasses(totalClasses)
                .totalExams(totalExams)
                .newUsersByMonth(newUsersByMonth)
                .build();
    }

    public AnalyticsDto.TeacherDashboardStats getTeacherStats(User teacher) {
        long totalCourses = courseRepository.findByTeacher(teacher, org.springframework.data.domain.Pageable.unpaged()).getTotalElements();
        long totalExams = examRepository.findByTeacherOrderByCreatedAtDesc(teacher, org.springframework.data.domain.Pageable.unpaged()).getTotalElements();
        
        long totalStudents = enrollmentRepository.countDistinctStudentByCourseTeacher(teacher);
        long totalDecks = flashcardDeckRepository.countByOwner(teacher);

        List<Object[]> rawMonthlyStats = enrollmentRepository.countEnrollmentsByMonthForTeacher(teacher.getId());
        List<AnalyticsDto.MonthlyEnrollmentStat> monthlyStats = new ArrayList<>();
        
        for (Object[] row : rawMonthlyStats) {
            String month = (String) row[0];
            Long count = ((Number) row[1]).longValue();
            monthlyStats.add(AnalyticsDto.MonthlyEnrollmentStat.builder().month(month).count(count).build());
        }

        return AnalyticsDto.TeacherDashboardStats.builder()
                .totalCourses(totalCourses)
                .totalExams(totalExams)
                .totalStudents(totalStudents)
                .totalDecks(totalDecks)
                .enrollmentsByMonth(monthlyStats)
                .build();
    }

    @Transactional(readOnly = true)
    public AnalyticsDto.StudentDashboardStats getStudentStats(User student) {
        long enrolledCourses = enrollmentRepository.countByStudent(student);
        long completedLessons = lessonProgressRepository.countByStudentAndIsCompletedTrue(student);
        long totalExamsTaken = studentExamResultRepository.countByStudentAndSubmittedAtIsNotNull(student);

        int streakDays = calculateStreak(studentExamResultRepository.findSubmittedDates(student));
        double avgScore = calculateAverageScore(studentExamResultRepository.findScoreRows(student));
        List<AnalyticsDto.RadarSkillStat> radar = buildRadar(studentExamResultRepository.findSkillTotals(student));
        List<AnalyticsDto.ExamScorePoint> examHistory = buildHistory(studentExamResultRepository
                .findRecentHistory(student, org.springframework.data.domain.PageRequest.of(0, DASHBOARD_HISTORY_SIZE)));

        // Goi mot lan thay vi ba lan nhu truoc
        var gamification = gamificationService.getStats(student);

        return AnalyticsDto.StudentDashboardStats.builder()
                .enrolledCourses(enrolledCourses)
                .completedLessons(completedLessons)
                .totalExamsTaken(totalExamsTaken)
                .averageExamScore(Math.round(avgScore * 10.0) / 10.0)
                .learningStreakDays(streakDays)
                .radarSkills(radar)
                .examHistory(examHistory)
                .totalXp(gamification.getTotalXp())
                .currentStreak(gamification.getCurrentStreak())
                .badges(gamification.getBadges())
                .build();
    }

    /** Chuoi ngay nop bai lien tiep, tinh nguoc tu hom nay hoac hom qua. */
    private int calculateStreak(List<java.time.LocalDateTime> submittedDates) {
        if (submittedDates.isEmpty()) return 0;

        java.time.LocalDate today = java.time.LocalDate.now();
        java.time.LocalDate last = submittedDates.get(0).toLocalDate();
        if (!last.isEqual(today) && !last.isEqual(today.minusDays(1))) return 0;

        int streak = 1;
        for (int i = 1; i < submittedDates.size(); i++) {
            java.time.LocalDate current = submittedDates.get(i).toLocalDate();
            if (current.isEqual(last)) continue;
            if (current.isEqual(last.minusDays(1))) {
                streak++;
                last = current;
            } else {
                break;
            }
        }
        return streak;
    }

    /** Diem trung binh theo phan tram tren tung bai, bo qua bai khong co thang diem. */
    private double calculateAverageScore(List<StudentExamResultRepository.ScoreRow> rows) {
        if (rows.isEmpty()) return 0;
        double total = 0;
        for (StudentExamResultRepository.ScoreRow row : rows) {
            double max = row.getMaxScore() != null ? row.getMaxScore() : 0;
            double score = row.getScore() != null ? row.getScore() : 0;
            if (max > 0) total += (score / max) * 100;
        }
        return total / rows.size();
    }

    private List<AnalyticsDto.RadarSkillStat> buildRadar(List<StudentExamResultRepository.SkillRow> skillRows) {
        if (skillRows.isEmpty()) {
            return DEFAULT_SKILLS.stream()
                    .map(skill -> AnalyticsDto.RadarSkillStat.builder()
                            .subject(skill).score(0).fullMark(100).build())
                    .toList();
        }
        return skillRows.stream().map(row -> {
            double max = row.getMaxScore() != null ? row.getMaxScore() : 0;
            double earned = row.getEarned() != null ? row.getEarned() : 0;
            int percentage = max > 0 ? (int) Math.round((earned / max) * 100) : 0;
            return AnalyticsDto.RadarSkillStat.builder()
                    .subject(row.getSkill()).score(percentage).fullMark(100).build();
        }).toList();
    }

    /** scorePercent la diem quy ve thang 10 - bieu do o dashboard dung truc 0..10. */
    private List<AnalyticsDto.ExamScorePoint> buildHistory(List<StudentExamResultRepository.HistoryRow> rows) {
        return rows.stream().map(row -> {
            double max = row.getMaxScore() != null ? row.getMaxScore() : 0;
            double score = row.getScore() != null ? row.getScore() : 0;
            double outOfTen = max > 0 ? (score / max) * 10.0 : score;
            return AnalyticsDto.ExamScorePoint.builder()
                    .resultId(row.getResultId())
                    .examTitle(row.getExamTitle() != null ? row.getExamTitle() : "Đề đã xóa")
                    .scorePercent(Math.round(outOfTen * 10.0) / 10.0)
                    .score(Math.round(score * 10.0) / 10.0)
                    .maxScore(max)
                    .submittedAt(row.getSubmittedAt() != null ? row.getSubmittedAt().toString() : "")
                    .build();
        }).toList();
    }

    @Transactional(readOnly = true)
    public AnalyticsDto.ProgressReport getProgressReport(User student) {
        AnalyticsDto.StudentDashboardStats summary = getStudentStats(student);

        List<AnalyticsDto.ExamScorePoint> examHistory = buildHistory(studentExamResultRepository
                .findRecentHistory(student, org.springframework.data.domain.PageRequest.of(0, PROGRESS_HISTORY_SIZE)));

        var activities = gamificationService.getStats(student).getRecentActivities().stream()
                .map(a -> AnalyticsDto.ActivityItem.builder()
                        .activityType(a.getActivityType())
                        .xpEarned(a.getXpEarned())
                        .activityDate(a.getActivityDate())
                        .build())
                .toList();

        return AnalyticsDto.ProgressReport.builder()
                .summary(summary)
                .examHistory(examHistory)
                .recentActivities(activities)
                .build();
    }
}
