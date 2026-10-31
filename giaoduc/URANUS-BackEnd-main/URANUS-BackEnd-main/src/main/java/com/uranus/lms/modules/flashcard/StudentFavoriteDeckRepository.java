package com.uranus.lms.modules.flashcard;

import com.uranus.lms.modules.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StudentFavoriteDeckRepository extends JpaRepository<StudentFavoriteDeck, UUID> {

    Optional<StudentFavoriteDeck> findByStudentAndDeck(User student, FlashcardDeck deck);

    Page<StudentFavoriteDeck> findByStudent(User student, Pageable pageable);

    @Query("SELECT f FROM StudentFavoriteDeck f WHERE f.student = :student " +
           "AND (:deckType IS NULL OR f.deck.deckType = CAST(:deckType AS string)) " +
           "AND (:title IS NULL OR LOWER(f.deck.title) LIKE LOWER(CONCAT('%', CAST(:title AS string), '%')) " +
           "OR LOWER(f.deck.tags) LIKE LOWER(CONCAT('%', CAST(:title AS string), '%')) " +
           "OR LOWER(f.deck.subject) LIKE LOWER(CONCAT('%', CAST(:title AS string), '%')))")
    Page<StudentFavoriteDeck> findFavoriteDecks(@Param("student") User student, @Param("title") String title, @Param("deckType") String deckType, Pageable pageable);

    boolean existsByStudentAndDeck(User student, FlashcardDeck deck);

    void deleteByStudentAndDeck(User student, FlashcardDeck deck);

    void deleteByDeck(FlashcardDeck deck);

    long countByDeck(FlashcardDeck deck);
}
