package com.uranus.lms.modules.exam;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

public interface QuestionGroupRepository extends JpaRepository<QuestionGroup, UUID> {

    List<QuestionGroup> findByExamIdOrderByOrderIndexAsc(UUID examId);

    @Modifying
    @Transactional
    @Query("DELETE FROM QuestionGroup qg WHERE qg.exam.id = :examId")
    void deleteByExamId(UUID examId);
}
