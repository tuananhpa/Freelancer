package com.uranus.lms.modules.course;

import com.uranus.lms.modules.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LessonProgressRepository extends JpaRepository<LessonProgress, UUID> {
    Optional<LessonProgress> findByStudentAndLesson(User student, Lesson lesson);
    List<LessonProgress> findByStudentAndLessonIn(User student, List<Lesson> lessons);
    long countByStudentAndIsCompletedTrue(User student);

    @Query("SELECT lp FROM LessonProgress lp WHERE lp.student = :student AND lp.lesson.section.course.id = :courseId")
    List<LessonProgress> findByStudentAndCourseId(@Param("student") User student, @Param("courseId") UUID courseId);
}
