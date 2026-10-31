package com.uranus.lms.modules.flashcard;

import com.uranus.lms.modules.user.User;
import com.uranus.lms.modules.user.UserRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.context.SecurityContextHolder;
import jakarta.validation.Valid;
import com.uranus.lms.modules.flashcard.dto.CreateDeckRequest;
import com.uranus.lms.modules.flashcard.dto.RateDeckRequest;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/flashcards")
@RequiredArgsConstructor
public class FlashcardController {

    private final FlashcardService flashcardService;
    private final UserRepository userRepository;

    @GetMapping("/public")
    public ResponseEntity<Page<FlashcardDeck>> getAllPublicDecks(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String folderId,
            @RequestParam(required = false) String deckType,
            @PageableDefault(size = 10) Pageable pageable) {
        User user = null;
        try {
            user = getCurrentUser();
        } catch (Exception ignored) {
        }
        return ResponseEntity.ok(flashcardService.getAllPublicDecks(pageable, search, folderId, deckType, user));
    }

    @GetMapping("/my-decks")
    public ResponseEntity<Page<FlashcardDeck>> getMyDecks(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String folderId,
            @RequestParam(required = false) String deckType,
            @PageableDefault(size = 10) Pageable pageable) {
        User user = getCurrentUser();
        return ResponseEntity.ok(flashcardService.getMyDecks(user, pageable, search, folderId, deckType));
    }

    @GetMapping("/decks/{id}")
    public ResponseEntity<FlashcardDeck> getDeckById(@PathVariable UUID id) {
        User user = getCurrentUser();
        return ResponseEntity.ok(flashcardService.getDeckByIdForUser(id, user));
    }

    @PostMapping("/decks/{id}/view")
    public ResponseEntity<Void> incrementViewCount(@PathVariable UUID id) {
        flashcardService.incrementViewCount(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/decks/{id}/share")
    public ResponseEntity<Void> incrementShareCount(@PathVariable UUID id) {
        flashcardService.incrementShareCount(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/decks/{id}/rating")
    public ResponseEntity<Void> rateDeck(@PathVariable UUID id, @Valid @RequestBody RateDeckRequest request) {
        User user = getCurrentUser();
        flashcardService.rateDeck(id, user, request.getRating());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/decks/{id}/suggested")
    public ResponseEntity<List<FlashcardDeck>> getSuggestedDecks(@PathVariable UUID id) {
        return ResponseEntity.ok(flashcardService.getSuggestedDecks(id));
    }

    // Route /flashcards/create o frontend gioi han TEACHER/ADMIN, nhung endpoint
    // nay truoc day khong kiem tra gi ca - hoc sinh goi thang API van tao duoc
    // bo the trong thu vien chung, trai voi thiet ke chi giao vien duoc soan.
    @PostMapping("/decks")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN')")
    public ResponseEntity<FlashcardDeck> createDeck(@Valid @RequestBody CreateDeckRequest deck) {
        User user = getCurrentUser();
        return ResponseEntity.ok(flashcardService.createDeck(deck, user));
    }

    @PutMapping("/decks/{id}")
    public ResponseEntity<FlashcardDeck> updateDeck(
            @PathVariable UUID id, 
            @Valid @RequestBody CreateDeckRequest deck) {
        User user = getCurrentUser();
        return ResponseEntity.ok(flashcardService.updateDeck(id, deck, user));
    }

    @DeleteMapping("/decks/{id}")
    public ResponseEntity<Void> deleteDeck(@PathVariable UUID id) {
        User user = getCurrentUser();
        flashcardService.deleteDeck(id, user);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/decks/{id}/progress")
    public ResponseEntity<List<StudentCardProgress>> getDeckProgress(@PathVariable UUID id) {
        User user = getCurrentUser();
        return ResponseEntity.ok(flashcardService.getDeckProgress(id, user));
    }

    @GetMapping("/decks/{id}/statistics")
    public ResponseEntity<com.uranus.lms.modules.flashcard.dto.FlashcardDeckStatisticsResponse> getDeckStatistics(@PathVariable UUID id) {
        User user = getCurrentUser();
        return ResponseEntity.ok(flashcardService.getDeckStatistics(id, user));
    }

    @GetMapping("/decks/{id}/due")
    public ResponseEntity<List<Flashcard>> getDueCards(@PathVariable UUID id) {
        User user = getCurrentUser();
        return ResponseEntity.ok(flashcardService.getDueCards(id, user));
    }

    @PutMapping("/progress/{cardId}")
    public ResponseEntity<StudentCardProgress> updateProgress(
            @PathVariable UUID cardId,
            @RequestBody ProgressUpdateRequest request) {
        User user = getCurrentUser();
        return ResponseEntity.ok(flashcardService.updateCardProgress(cardId, user, request.isCorrect()));
    }

    @PostMapping("/decks/{id}/favorite")
    public ResponseEntity<java.util.Map<String, Boolean>> toggleFavorite(@PathVariable UUID id) {
        User user = getCurrentUser();
        boolean favorited = flashcardService.toggleFavorite(id, user);
        return ResponseEntity.ok(java.util.Map.of("favorited", favorited));
    }

    @GetMapping("/decks/{id}/favorite")
    public ResponseEntity<java.util.Map<String, Boolean>> isFavorited(@PathVariable UUID id) {
        User user = getCurrentUser();
        boolean favorited = flashcardService.isFavorited(id, user);
        return ResponseEntity.ok(java.util.Map.of("favorited", favorited));
    }

    @GetMapping("/favorites")
    public ResponseEntity<Page<FlashcardDeck>> getFavoriteDecks(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String deckType,
            @PageableDefault(size = 10) Pageable pageable) {
        User user = getCurrentUser();
        return ResponseEntity.ok(flashcardService.getFavoriteDecks(user, pageable, search, deckType));
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow();
    }

    @Data
    public static class ProgressUpdateRequest {
        private boolean isCorrect;
    }
}
