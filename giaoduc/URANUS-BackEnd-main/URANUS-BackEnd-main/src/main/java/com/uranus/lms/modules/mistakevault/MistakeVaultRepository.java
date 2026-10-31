package com.uranus.lms.modules.mistakevault;

import com.uranus.lms.modules.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MistakeVaultRepository extends JpaRepository<MistakeVaultItem, UUID> {

    List<MistakeVaultItem> findByStudentAndNextReviewDateLessThanEqualOrderByNextReviewDateAsc(
            User student, LocalDate date);

    long countByStudent(User student);

    long countByStudentAndNextReviewDateLessThanEqual(User student, LocalDate date);

    Optional<MistakeVaultItem> findByStudentAndQuestionId(User student, UUID questionId);

    Optional<MistakeVaultItem> findByStudentAndFlashcardId(User student, UUID flashcardId);

    Optional<MistakeVaultItem> findByIdAndStudent(UUID id, User student);
}
