package com.uranus.lms.modules.course;

import com.uranus.lms.modules.user.User;
import com.uranus.lms.modules.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import jakarta.validation.Valid;
import com.uranus.lms.modules.course.dto.CreateCourseRequest;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<Page<Course>> getAllPublishedCourses(@PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(courseService.getAllPublishedCourses(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Course> getCourseById(@PathVariable UUID id) {
        return ResponseEntity.ok(courseService.getCourseById(id));
    }

    @GetMapping("/teacher")
    public ResponseEntity<Page<Course>> getTeacherCourses(@PageableDefault(size = 10) Pageable pageable) {
        User teacher = getCurrentUser();
        return ResponseEntity.ok(courseService.getTeacherCourses(teacher, pageable));
    }

    @PostMapping
    public ResponseEntity<Course> createCourse(@Valid @RequestBody CreateCourseRequest request) {
        User teacher = getCurrentUser();
        return ResponseEntity.ok(courseService.createCourse(request, teacher));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Course> updateCourse(@PathVariable UUID id, @Valid @RequestBody CreateCourseRequest request) {
        return ResponseEntity.ok(courseService.updateCourse(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCourse(@PathVariable UUID id) {
        courseService.deleteCourse(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/enroll")
    public ResponseEntity<Enrollment> enrollInCourse(@PathVariable UUID id) {
        User student = getCurrentUser();
        return ResponseEntity.ok(courseService.enrollInCourse(id, student));
    }

    @GetMapping("/my-enrollments")
    public ResponseEntity<Page<com.uranus.lms.modules.course.dto.MyEnrollmentDto>> getMyEnrollments(@PageableDefault(size = 10) Pageable pageable) {
        User student = getCurrentUser();
        return ResponseEntity.ok(courseService.getMyEnrollments(student, pageable));
    }

    @PostMapping("/lessons/{lessonId}/complete")
    public ResponseEntity<LessonProgress> markLessonComplete(@PathVariable UUID lessonId) {
        User student = getCurrentUser();
        return ResponseEntity.ok(courseService.markLessonComplete(lessonId, student));
    }

    @GetMapping("/{id}/progress")
    public ResponseEntity<List<LessonProgress>> getCourseProgress(@PathVariable UUID id) {
        User student = getCurrentUser();
        return ResponseEntity.ok(courseService.getCourseProgress(id, student));
    }

    // --- CURRICULUM ENDPOINTS ---

    @PostMapping("/{id}/sections")
    @PreAuthorize("hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN')")
    public ResponseEntity<Section> addSection(@PathVariable UUID id, @RequestBody Section section) {
        return ResponseEntity.ok(courseService.addSection(id, section));
    }

    @PutMapping("/sections/{sectionId}")
    @PreAuthorize("hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN')")
    public ResponseEntity<Section> updateSection(@PathVariable UUID sectionId, @RequestBody Section section) {
        return ResponseEntity.ok(courseService.updateSection(sectionId, section));
    }

    @DeleteMapping("/sections/{sectionId}")
    @PreAuthorize("hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN')")
    public ResponseEntity<Void> deleteSection(@PathVariable UUID sectionId) {
        courseService.deleteSection(sectionId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/sections/{sectionId}/lessons")
    @PreAuthorize("hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN')")
    public ResponseEntity<Lesson> addLesson(@PathVariable UUID sectionId, @RequestBody Lesson lesson) {
        return ResponseEntity.ok(courseService.addLesson(sectionId, lesson));
    }

    @PutMapping("/lessons/{lessonId}")
    @PreAuthorize("hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN')")
    public ResponseEntity<Lesson> updateLesson(@PathVariable UUID lessonId, @RequestBody Lesson lesson) {
        return ResponseEntity.ok(courseService.updateLesson(lessonId, lesson));
    }

    @DeleteMapping("/lessons/{lessonId}")
    @PreAuthorize("hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN')")
    public ResponseEntity<Void> deleteLesson(@PathVariable UUID lessonId) {
        courseService.deleteLesson(lessonId);
        return ResponseEntity.ok().build();
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow();
    }
}
