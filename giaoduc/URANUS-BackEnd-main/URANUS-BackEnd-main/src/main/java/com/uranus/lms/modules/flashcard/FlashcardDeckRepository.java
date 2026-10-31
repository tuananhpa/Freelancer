package com.uranus.lms.modules.flashcard;

import com.uranus.lms.modules.user.User;
import com.uranus.lms.modules.folder.ContentFolder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FlashcardDeckRepository extends JpaRepository<FlashcardDeck, UUID>, JpaSpecificationExecutor<FlashcardDeck> {
    Page<FlashcardDeck> findByOwner(User owner, Pageable pageable);
    long countByOwner(User owner);
    Page<FlashcardDeck> findByVisibility(com.uranus.lms.modules.access.Visibility visibility, Pageable pageable);

    @Query("SELECT DISTINCT d FROM FlashcardDeck d LEFT JOIN FETCH d.cards WHERE d.owner = :owner")
    List<FlashcardDeck> findByOwnerWithCards(@Param("owner") User owner);

    @Query("SELECT DISTINCT d FROM FlashcardDeck d LEFT JOIN FETCH d.cards WHERE d.visibility = 'PUBLIC'")
    List<FlashcardDeck> findByVisibilityPublicWithCards();

    @Query("SELECT DISTINCT d FROM FlashcardDeck d LEFT JOIN FETCH d.cards WHERE d.id = :id")
    Optional<FlashcardDeck> findByIdWithCards(@Param("id") UUID id);

    long countByFolder(ContentFolder folder);

    @Modifying
    @Query("UPDATE FlashcardDeck d SET d.folder = null WHERE d.folder = :folder")
    void clearFolder(@Param("folder") ContentFolder folder);

    Page<FlashcardDeck> findByTitleContainingIgnoreCaseAndVisibility(String title, com.uranus.lms.modules.access.Visibility visibility, Pageable pageable);

    Page<FlashcardDeck> findByOwnerAndTitleContainingIgnoreCase(User owner, String title, Pageable pageable);

    Page<FlashcardDeck> findByVisibilityAndIdNotAndDeckTypeOrderByViewsCountDesc(com.uranus.lms.modules.access.Visibility visibility, UUID id, String deckType, Pageable pageable);
}
