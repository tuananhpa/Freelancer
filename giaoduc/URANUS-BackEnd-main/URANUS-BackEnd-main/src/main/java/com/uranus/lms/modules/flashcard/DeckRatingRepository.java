package com.uranus.lms.modules.flashcard;

import com.uranus.lms.modules.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface DeckRatingRepository extends JpaRepository<DeckRating, UUID> {
    Optional<DeckRating> findByDeckAndStudent(FlashcardDeck deck, User student);
    
    @Query("SELECT COUNT(r) FROM DeckRating r WHERE r.deck = :deck")
    int countByDeck(@Param("deck") FlashcardDeck deck);
    
    @Query("SELECT COALESCE(AVG(CAST(r.rating AS double)), 0.0) FROM DeckRating r WHERE r.deck = :deck")
    double averageByDeck(@Param("deck") FlashcardDeck deck);
}
