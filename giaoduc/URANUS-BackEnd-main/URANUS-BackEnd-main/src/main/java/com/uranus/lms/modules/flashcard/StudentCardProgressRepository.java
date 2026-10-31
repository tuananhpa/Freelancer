package com.uranus.lms.modules.flashcard;

import com.uranus.lms.modules.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StudentCardProgressRepository extends JpaRepository<StudentCardProgress, UUID> {
    Optional<StudentCardProgress> findByStudentAndCard(User student, Flashcard card);
    List<StudentCardProgress> findByStudentAndNextReviewDateLessThanEqual(User student, LocalDate date);

    @Query("SELECT p FROM StudentCardProgress p WHERE p.student = :student AND p.card.deck = :deck")
    List<StudentCardProgress> findByStudentAndDeck(User student, FlashcardDeck deck);

    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM StudentCardProgress p WHERE p.card.deck = :deck")
    void deleteByDeck(FlashcardDeck deck);

    /** Đếm số học viên duy nhất đã từng học bộ từ vựng này */
    @Query("SELECT COUNT(DISTINCT p.student) FROM StudentCardProgress p WHERE p.card.deck = :deck")
    long countDistinctStudentsByDeck(FlashcardDeck deck);
}
