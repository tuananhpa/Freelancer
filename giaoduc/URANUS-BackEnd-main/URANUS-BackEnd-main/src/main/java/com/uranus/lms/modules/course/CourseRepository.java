package com.uranus.lms.modules.course;

import com.uranus.lms.modules.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.UUID;

@Repository
public interface CourseRepository extends JpaRepository<Course, UUID> {
    Page<Course> findByTeacher(User teacher, Pageable pageable);
    Page<Course> findByStatus(CourseStatus status, Pageable pageable);
    Page<Course> findByTeacherAndStatus(User teacher, CourseStatus status, Pageable pageable);

    Page<Course> findByTitleContainingIgnoreCaseAndStatus(String title, CourseStatus status, Pageable pageable);

    Page<Course> findByTeacherAndTitleContainingIgnoreCase(User teacher, String title, Pageable pageable);
}
