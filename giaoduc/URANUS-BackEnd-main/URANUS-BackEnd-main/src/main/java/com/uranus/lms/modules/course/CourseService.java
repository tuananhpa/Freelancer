package com.uranus.lms.modules.course;

import com.uranus.lms.exception.ResourceNotFoundException;
import com.uranus.lms.modules.user.User;
import com.uranus.lms.modules.course.dto.CreateCourseRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import java.util.List;
import java.util.UUID;
import com.uranus.lms.common.response.RestPageImpl;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final LessonRepository lessonRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final SectionRepository sectionRepository;
    private final com.uranus.lms.modules.notification.NotificationService notificationService;

    @Cacheable(value = "publishedCourses", key = "#pageable.pageNumber + '-' + #pageable.pageSize")
    public Page<Course> getAllPublishedCourses(Pageable pageable) {
        Page<Course> page = courseRepository.findByStatus(CourseStatus.PUBLISHED, pageable);
        return new RestPageImpl<>(page.getContent(), page.getPageable(), page.getTotalElements());
    }

    public Page<Course> getTeacherCourses(User teacher, Pageable pageable) {
        return courseRepository.findByTeacher(teacher, pageable);
    }

    // Khong @Cacheable o day: entity nay co quan he lazy "sections", va cache
    // dung Redis nen phai serialize object that su. Redis co luc luu duoc
    // "sections" day du, co luc luu lai proxy lazy chua khoi tao thanh null -
    // tuy vao thoi diem cache duoc ghi co dang trong Hibernate session hay
    // khong. Ket qua la trang quan ly khoa hoc luc thay phan/bai vua them,
    // luc lai khong, du du lieu that trong DB luon dung. Trang nay it truy
    // cap (giao vien tu quan ly khoa hoc cua minh), khong dang danh doi lay
    // rui ro sai du lieu de cache.
    public Course getCourseById(UUID id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + id));
    }

    public Course createCourse(CreateCourseRequest request, User teacher) {
        Course course = Course.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .thumbnailUrl(request.getThumbnailUrl())
                .status(request.getStatus() != null ? request.getStatus() : CourseStatus.DRAFT)
                .teacher(teacher)
                .build();
        return courseRepository.save(course);
    }

    @CacheEvict(value = {"publishedCourses", "courseDetails"}, allEntries = true)
    public Course updateCourse(UUID id, CreateCourseRequest request) {
        Course course = getCourseById(id);
        if (request.getTitle() != null) course.setTitle(request.getTitle());
        if (request.getDescription() != null) course.setDescription(request.getDescription());
        if (request.getThumbnailUrl() != null) course.setThumbnailUrl(request.getThumbnailUrl());
        if (request.getStatus() != null) course.setStatus(request.getStatus());
        return courseRepository.save(course);
    }

    @CacheEvict(value = {"publishedCourses", "courseDetails"}, allEntries = true)
    public void deleteCourse(UUID id) {
        Course course = getCourseById(id);
        courseRepository.delete(course);
    }

    public Enrollment enrollInCourse(UUID courseId, User student) {
        Course course = getCourseById(courseId);
        if (enrollmentRepository.existsByStudentAndCourse(student, course)) {
            throw new IllegalArgumentException("Bạn đã tham gia khóa học này rồi.");
        }
        Enrollment enrollment = Enrollment.builder()
                .student(student)
                .course(course)
                .build();
        Enrollment saved = enrollmentRepository.save(enrollment);

        // Notify instructor
        if (course.getTeacher() != null && !course.getTeacher().getId().equals(student.getId())) {
            notificationService.sendNotification(
                    course.getTeacher(),
                    "Học viên mới đăng ký khóa học",
                    student.getFullName() + " đã đăng ký tham gia khóa học '" + course.getTitle() + "'",
                    "/courses/" + course.getId(),
                    com.uranus.lms.modules.notification.NotificationType.COURSE,
                    student,
                    "COURSE_ENROLLMENT",
                    saved.getId().toString()
            );
        }

        return saved;
    }

    public Page<com.uranus.lms.modules.course.dto.MyEnrollmentDto> getMyEnrollments(User student, Pageable pageable) {
        return enrollmentRepository.findByStudent(student, pageable).map(e -> {
            Course c = e.getCourse();
            return com.uranus.lms.modules.course.dto.MyEnrollmentDto.builder()
                    .id(e.getId())
                    .enrolledAt(e.getEnrolledAt())
                    .course(com.uranus.lms.modules.course.dto.MyEnrollmentDto.CourseSummary.builder()
                            .id(c.getId())
                            .title(c.getTitle())
                            .description(c.getDescription())
                            .thumbnailUrl(c.getThumbnailUrl())
                            .status(c.getStatus() != null ? c.getStatus().name() : null)
                            .build())
                    .build();
        });
    }

    public LessonProgress markLessonComplete(UUID lessonId, User student) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson not found"));
        
        LessonProgress progress = lessonProgressRepository.findByStudentAndLesson(student, lesson)
                .orElseGet(() -> LessonProgress.builder()
                        .student(student)
                        .lesson(lesson)
                        .build());
                        
        progress.setCompleted(true);
        progress.setCompletedAt(java.time.LocalDateTime.now());
        return lessonProgressRepository.save(progress);
    }

    public List<LessonProgress> getCourseProgress(UUID courseId, User student) {
        // Ensure course exists
        getCourseById(courseId);
        return lessonProgressRepository.findByStudentAndCourseId(student, courseId);
    }

    // --- CURRICULUM MANAGEMENT (UDEMY STYLE) ---

    // SECTIONS
    public Section addSection(UUID courseId, Section sectionDetails) {
        Course course = getCourseById(courseId);
        int nextOrder = course.getSections().size();
        
        Section section = Section.builder()
                .course(course)
                .title(sectionDetails.getTitle())
                .orderIndex(nextOrder)
                .build();
        return sectionRepository.save(section);
    }

    public Section updateSection(UUID sectionId, Section sectionDetails) {
        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Section not found"));
        section.setTitle(sectionDetails.getTitle());
        if (sectionDetails.getOrderIndex() != null) {
            section.setOrderIndex(sectionDetails.getOrderIndex());
        }
        return sectionRepository.save(section);
    }

    public void deleteSection(UUID sectionId) {
        sectionRepository.deleteById(sectionId);
    }

    // LESSONS
    public Lesson addLesson(UUID sectionId, Lesson lessonDetails) {
        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Section not found"));
        int nextOrder = section.getLessons() != null ? section.getLessons().size() : 0;
        
        Lesson lesson = Lesson.builder()
                .section(section)
                .title(lessonDetails.getTitle())
                .content(lessonDetails.getContent())
                .resourceUrl(lessonDetails.getResourceUrl())
                .orderIndex(nextOrder)
                .build();
        return lessonRepository.save(lesson);
    }

    public Lesson updateLesson(UUID lessonId, Lesson lessonDetails) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson not found"));
        if (lessonDetails.getTitle() != null) lesson.setTitle(lessonDetails.getTitle());
        if (lessonDetails.getContent() != null) lesson.setContent(lessonDetails.getContent());
        if (lessonDetails.getResourceUrl() != null) lesson.setResourceUrl(lessonDetails.getResourceUrl());
        if (lessonDetails.getOrderIndex() != null) lesson.setOrderIndex(lessonDetails.getOrderIndex());
        
        // If moved to a different section
        if (lessonDetails.getSection() != null && lessonDetails.getSection().getId() != null) {
            if (!lesson.getSection().getId().equals(lessonDetails.getSection().getId())) {
                Section newSection = sectionRepository.findById(lessonDetails.getSection().getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Target Section not found"));
                lesson.setSection(newSection);
            }
        }
        return lessonRepository.save(lesson);
    }

    public void deleteLesson(UUID lessonId) {
        lessonRepository.deleteById(lessonId);
    }
}
