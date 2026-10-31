package com.uranus.lms.modules.exam;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DraftAnswerRepository extends JpaRepository<DraftAnswer, UUID> {

    List<DraftAnswer> findByResult(StudentExamResult result);

    Optional<DraftAnswer> findByResultAndQuestion(StudentExamResult result, Question question);

    @Modifying
    @Query("DELETE FROM DraftAnswer d WHERE d.result = :result")
    void deleteAllByResult(@Param("result") StudentExamResult result);

    long countByResult(StudentExamResult result);

    @Modifying
    @Query("DELETE FROM DraftAnswer d WHERE d.result.exam.id = :examId")
    void deleteAllByExamId(@Param("examId") UUID examId);
}
