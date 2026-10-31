package com.uranus.lms.modules.certification;

import com.uranus.lms.modules.course.Course;
import com.uranus.lms.modules.course.CourseRepository;
import com.uranus.lms.modules.course.EnrollmentRepository;
import com.uranus.lms.modules.course.LessonProgress;
import com.uranus.lms.modules.course.LessonProgressRepository;
import com.uranus.lms.modules.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CertificateService {
    private final CertificateRepository certificateRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final com.uranus.lms.modules.notification.NotificationService notificationService;

    public CertificateDto issueCertificate(UUID courseId, User student) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("Course not found"));

        if (certificateRepository.existsByUserAndCourse(student, course)) {
            throw new IllegalArgumentException("Chứng chỉ cho khóa học này đã được cấp trước đó.");
        }

        // Truoc day khong kiem tra gi ca - hoc sinh chua tham gia hoac chua hoc
        // bai nao cung cap duoc chung chi. Doi chieu dung logic tinh % o
        // CourseViewer.tsx: phai da dang ky va hoan thanh 100% so bai hoc.
        if (!enrollmentRepository.existsByStudentAndCourse(student, course)) {
            throw new IllegalArgumentException("Bạn cần tham gia khóa học trước khi nhận chứng chỉ.");
        }
        long totalLessons = course.getSections().stream()
                .mapToLong(s -> s.getLessons() != null ? s.getLessons().size() : 0)
                .sum();
        long completedLessons = lessonProgressRepository.findByStudentAndCourseId(student, courseId).stream()
                .filter(LessonProgress::isCompleted)
                .count();
        if (totalLessons == 0 || completedLessons < totalLessons) {
            throw new IllegalArgumentException("Bạn cần hoàn thành tất cả bài học trước khi nhận chứng chỉ.");
        }

        String uniqueCode = "CERT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase() + "-" + LocalDateTime.now().getYear();

        Certificate certificate = Certificate.builder()
                .user(student)
                .course(course)
                .uniqueCode(uniqueCode)
                .build();

        Certificate saved = certificateRepository.save(certificate);

        // Notify student
        notificationService.sendNotification(
                student,
                "Chứng chỉ khóa học mới",
                "Chúc mừng bạn đã hoàn thành khóa học '" + course.getTitle() + "' và nhận được chứng chỉ (Mã: " + uniqueCode + ")",
                "/certificates/" + uniqueCode,
                com.uranus.lms.modules.notification.NotificationType.CERTIFICATE,
                null,
                "CERTIFICATE",
                saved.getId().toString()
        );

        return mapToDto(saved);
    }

    public CertificateDto getCertificateByCode(String code) {
        return certificateRepository.findByUniqueCode(code)
                .map(this::mapToDto)
                .orElseThrow(() -> new IllegalArgumentException("Certificate not found"));
    }

    public Page<CertificateDto> getMyCertificates(User user, Pageable pageable) {
        return certificateRepository.findByUser(user, pageable)
                .map(this::mapToDto);
    }

    private CertificateDto mapToDto(Certificate certificate) {
        return CertificateDto.builder()
                .id(certificate.getId())
                .userId(certificate.getUser().getId())
                .userName(certificate.getUser().getFullName())
                .courseId(certificate.getCourse().getId())
                .courseName(certificate.getCourse().getTitle())
                .issueDate(certificate.getIssueDate())
                .uniqueCode(certificate.getUniqueCode())
                .pdfUrl(certificate.getPdfUrl())
                .build();
    }
}
