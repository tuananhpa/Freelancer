package com.uranus.lms.modules.course;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LessonCommentRepository extends JpaRepository<LessonComment, UUID> {
    Page<LessonComment> findByLessonIdAndParentIsNullOrderByCreatedAtDesc(UUID lessonId, Pageable pageable);
    List<LessonComment> findByParentIdOrderByCreatedAtAsc(UUID parentId);
}
