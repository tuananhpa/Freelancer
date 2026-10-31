package com.uranus.lms.modules.exam;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StudentAnswerRepository extends JpaRepository<StudentAnswer, UUID> {

    /** Các câu tự luận đã nộp nhưng AI chấm nháp còn chờ giáo viên duyệt. */
    @Query("""
            SELECT a FROM StudentAnswer a
            JOIN FETCH a.result r
            JOIN FETCH r.student s
            WHERE r.exam.id = :examId
              AND r.submittedAt IS NOT NULL
              AND a.question.questionType = 'ESSAY'
              AND a.reviewed = false
            ORDER BY r.submittedAt ASC
            """)
    List<StudentAnswer> findPendingEssayReviews(@Param("examId") UUID examId);
}
