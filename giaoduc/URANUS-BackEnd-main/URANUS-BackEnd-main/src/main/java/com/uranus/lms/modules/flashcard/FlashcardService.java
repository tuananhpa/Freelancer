package com.uranus.lms.modules.flashcard;

import com.uranus.lms.exception.BadRequestException;
import com.uranus.lms.exception.ForbiddenException;
import com.uranus.lms.exception.ResourceNotFoundException;
import com.uranus.lms.modules.folder.ContentFolder;
import com.uranus.lms.modules.folder.ContentFolderService;
import com.uranus.lms.modules.user.User;
import com.uranus.lms.modules.flashcard.dto.CreateDeckRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FlashcardService {

    private final FlashcardDeckRepository deckRepository;
    private final FlashcardRepository cardRepository;
    private final StudentCardProgressRepository progressRepository;
    private final StudentFavoriteDeckRepository favoriteDeckRepository;
    private final DeckRatingRepository deckRatingRepository;
    private final ContentFolderService folderService;
    private final com.uranus.lms.modules.classroom.ClassroomRepository classroomRepository;
    private final com.uranus.lms.modules.classroom.ClassResourceRepository classResourceRepository;
    private final com.uranus.lms.modules.classroom.ClassMemberRepository classMemberRepository;
    private final com.uranus.lms.modules.classroom.ClassroomAuthorizationService classroomAuthorizationService;
    private final com.uranus.lms.modules.access.StudentResourceAccessService studentResourceAccessService;
    private final com.uranus.lms.modules.notification.NotificationService notificationService;

    @Transactional(readOnly = true)
    public Page<FlashcardDeck> getAllPublicDecks(Pageable pageable, String search, String folderId, String deckType, User user) {
        Specification<FlashcardDeck> spec = Specification.where((root, query, cb) -> {
            if (user != null && user.getRole() == com.uranus.lms.modules.user.Role.ADMIN) {
                return cb.conjunction();
            }
            return cb.equal(root.get("visibility"), com.uranus.lms.modules.access.Visibility.PUBLIC);
        });
        
        if (search != null && !search.trim().isEmpty()) {
            String q = "%" + search.trim().toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("title")), q),
                cb.like(cb.lower(root.get("description")), q),
                cb.like(cb.lower(root.get("tags")), q),
                cb.like(cb.lower(root.get("subject")), q)
            ));
        }
        if (deckType != null && !deckType.trim().isEmpty()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("deckType"), deckType));
        }
        if (folderId != null && !folderId.trim().isEmpty()) {
            if ("none".equals(folderId)) {
                spec = spec.and((root, query, cb) -> cb.isNull(root.get("folder")));
            } else {
                try {
                    UUID folderUuid = UUID.fromString(folderId);
                    spec = spec.and((root, query, cb) -> cb.equal(root.join("folder").get("id"), folderUuid));
                } catch (IllegalArgumentException e) {
                }
            }
        }

        Page<FlashcardDeck> page = deckRepository.findAll(spec, pageable);
        var refs = page.getContent().stream()
                .map(d -> new com.uranus.lms.modules.access.StudentResourceAccessService.ResourceRef(
                        d.getId(),
                        d.getOwner() != null ? d.getOwner().getId() : null,
                        d.getVisibility()))
                .toList();
        var decisions = studentResourceAccessService.decideForResources(
                user, refs);

        return page.map(deck -> {
            populateFolderInfo(deck);
            applyAccess(deck, decisions.get(deck.getId()));
            if (Boolean.TRUE.equals(deck.getLocked())) {
                deck.setCards(new java.util.ArrayList<>());
            }
            return deck;
        });
    }

    @Transactional(readOnly = true)
    public Page<FlashcardDeck> getMyDecks(User owner, Pageable pageable, String search, String folderId, String deckType) {
        Specification<FlashcardDeck> spec = Specification.where(null);
        if (owner.getRole() != com.uranus.lms.modules.user.Role.ADMIN) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("owner"), owner));
        }
        
        if (search != null && !search.trim().isEmpty()) {
            String q = "%" + search.trim().toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("title")), q),
                cb.like(cb.lower(root.get("description")), q),
                cb.like(cb.lower(root.get("tags")), q),
                cb.like(cb.lower(root.get("subject")), q)
            ));
        }
        if (deckType != null && !deckType.trim().isEmpty()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("deckType"), deckType));
        }
        if (folderId != null && !folderId.trim().isEmpty()) {
            if ("none".equals(folderId)) {
                spec = spec.and((root, query, cb) -> cb.isNull(root.get("folder")));
            } else {
                try {
                    UUID folderUuid = UUID.fromString(folderId);
                    spec = spec.and((root, query, cb) -> cb.equal(root.join("folder").get("id"), folderUuid));
                } catch (IllegalArgumentException e) {
                }
            }
        }
        
        return deckRepository.findAll(spec, pageable).map(deck -> {
            populateFolderInfo(deck);
            return deck;
        });
    }

    @Transactional(readOnly = true)
    public FlashcardDeck getDeckById(UUID id) {
        FlashcardDeck deck = deckRepository.findByIdWithCards(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deck not found with id: " + id));
        populateFolderInfo(deck);
        return deck;
    }

    @Transactional(readOnly = true)
    public FlashcardDeck getDeckByIdForUser(UUID id, User currentUser) {
        FlashcardDeck deck = getDeckById(id);
        boolean isStaffOrOwner = currentUser != null && (
                currentUser.getRole() == com.uranus.lms.modules.user.Role.ADMIN ||
                currentUser.getRole() == com.uranus.lms.modules.user.Role.OFFICE ||
                currentUser.getRole() == com.uranus.lms.modules.user.Role.TEACHER ||
                currentUser.getRole() == com.uranus.lms.modules.user.Role.TEACHING_ASSISTANT ||
                (deck.getOwner() != null && deck.getOwner().getId().equals(currentUser.getId()))
        );

        if (isStaffOrOwner) {
            applyAccess(deck, com.uranus.lms.modules.access.ResourceAccessDecision.full());
        } else {
            var decision = studentResourceAccessService.decideSingle(
                    currentUser,
                    deck.getId(),
                    deck.getVisibility(),
                    deck.getOwner() != null ? deck.getOwner().getId() : null);
            applyAccess(deck, decision);
            if (decision.isLocked()) {
                deck.setCards(new java.util.ArrayList<>());
                throw new com.uranus.lms.exception.ForbiddenException(
                        decision.getUnlockHint() != null
                                ? decision.getUnlockHint()
                                : "Bạn không có quyền truy cập bộ thẻ này.");
            }
        }

        var existingRating = deckRatingRepository.findByDeckAndStudent(deck, currentUser);
        existingRating.ifPresent(rating -> deck.setMyRating(rating.getRating()));

        return deck;
    }

    private void applyAccess(FlashcardDeck deck, com.uranus.lms.modules.access.ResourceAccessDecision decision) {
        if (decision == null) {
            decision = com.uranus.lms.modules.access.ResourceAccessDecision.previewLocked();
        }
        deck.setAccessLevel(decision.getAccessLevel().name());
        deck.setLocked(decision.isLocked());
        deck.setPreviewRank(decision.getPreviewRank());
        deck.setUnlockHint(decision.getUnlockHint());
    }

    private void populateFolderInfo(FlashcardDeck deck) {
        if (deck.getFolder() != null) {
            deck.setFolderId(deck.getFolder().getId());
            deck.setFolderName(deck.getFolder().getName());
        }
        // Populate learnerCount = số học viên đã yêu thích bộ từ vựng này
        deck.setLearnerCount(favoriteDeckRepository.countByDeck(deck));
    }

    /** Prefer explicit tags; otherwise use subject so subject filter chips work. */
    private String resolveTags(java.util.List<String> tags, String subject) {
        if (tags != null && !tags.isEmpty()) {
            return String.join(",", tags);
        }
        if (subject != null && !subject.isBlank()) {
            return subject.trim();
        }
        return null;
    }

    @Transactional
    public FlashcardDeck createDeck(CreateDeckRequest request, User owner) {
        FlashcardDeck deck = FlashcardDeck.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .visibility(request.getVisibility() != null ? request.getVisibility() : com.uranus.lms.modules.access.Visibility.PUBLIC)
                .accessCode(request.getAccessCode())
                .folderId(request.getFolderId())
                .tags(resolveTags(request.getTags(), request.getSubject()))
                .imageUrl(request.getImageUrl())
                .owner(owner)
                .deckType(request.getDeckType() != null ? request.getDeckType() : "FLASHCARD")
                .subject(request.getSubject())
                .cards(request.getCards() != null ? new java.util.ArrayList<>(request.getCards()) : new java.util.ArrayList<>())
                .build();

        if (deck.getFolderId() != null) {
            ContentFolder folder = folderService.getFolderById(deck.getFolderId(), owner);
            deck.setFolder(folder);
        }
        if (deck.getCards() != null) {
            deck.getCards().forEach(c -> c.setDeck(deck));
        }
        FlashcardDeck saved = deckRepository.save(deck);
        
        if (request.getVisibility() == com.uranus.lms.modules.access.Visibility.CLASSROOM && request.getAssignedClassIds() != null) {
            com.uranus.lms.modules.classroom.ClassResource.ResourceType rType = "VOCABULARY".equalsIgnoreCase(request.getDeckType())
                    ? com.uranus.lms.modules.classroom.ClassResource.ResourceType.VOCAB
                    : com.uranus.lms.modules.classroom.ClassResource.ResourceType.FLASHCARD;

            for (UUID classId : request.getAssignedClassIds()) {
                com.uranus.lms.modules.classroom.Classroom classroom = classroomRepository.findById(classId).orElse(null);
                if (classroom != null) {
                    UUID targetFolderId = request.getClassFolderId();
                    if (request.getAssignedClassFolders() != null && request.getAssignedClassFolders().containsKey(classId)) {
                        targetFolderId = request.getAssignedClassFolders().get(classId);
                    }

                    var existing = classResourceRepository.findByClassroom_IdAndResourceId(classId, saved.getId()).orElse(null);
                    if (existing != null) {
                        existing.setFolderId(targetFolderId);
                        existing.setResourceType(rType);
                        classResourceRepository.save(existing);
                    } else {
                        com.uranus.lms.modules.classroom.ClassResource resource = com.uranus.lms.modules.classroom.ClassResource.builder()
                                .classroom(classroom)
                                .resourceId(saved.getId())
                                .resourceType(rType)
                                .folderId(targetFolderId)
                                .build();
                        classResourceRepository.save(resource);
                    }
                }
            }
        }
        
        populateFolderInfo(saved);
        return saved;
    }

    @Transactional
    public FlashcardDeck updateDeck(UUID id, CreateDeckRequest updatedDeck, User owner) {
        FlashcardDeck deck = getDeckById(id);
        boolean canEdit = deck.getOwner() != null && deck.getOwner().getId().equals(owner.getId());
        if (!canEdit && (owner.getRole() == com.uranus.lms.modules.user.Role.ADMIN || owner.getRole() == com.uranus.lms.modules.user.Role.OFFICE)) {
            canEdit = true;
        }
        if (!canEdit && (owner.getRole() == com.uranus.lms.modules.user.Role.TEACHER || owner.getRole() == com.uranus.lms.modules.user.Role.TEACHING_ASSISTANT)) {
            var classResources = classResourceRepository.findByResourceId(deck.getId());
            for (var cr : classResources) {
                if (cr.getClassroom() != null && (
                    classroomAuthorizationService.isTeacherOrTA(cr.getClassroom(), owner)
                    || classMemberRepository.existsByClassroomIdAndUserId(cr.getClassroom().getId(), owner.getId())
                )) {
                    canEdit = true;
                    break;
                }
            }
        }
        if (!canEdit) {
            throw new BadRequestException("Bạn không có quyền sửa bộ thẻ này.");
        }

        deck.setTitle(updatedDeck.getTitle());
        deck.setDescription(updatedDeck.getDescription());
        if (updatedDeck.getVisibility() != null) {
            deck.setVisibility(updatedDeck.getVisibility());
        }
        deck.setAccessCode(updatedDeck.getAccessCode());
        deck.setTags(resolveTags(updatedDeck.getTags(), updatedDeck.getSubject()));
        deck.setImageUrl(updatedDeck.getImageUrl());
        deck.setDeckType(updatedDeck.getDeckType() != null ? updatedDeck.getDeckType() : deck.getDeckType());
        if (updatedDeck.getSubject() != null) {
            deck.setSubject(updatedDeck.getSubject());
        }

        if (updatedDeck.getFolderId() != null) {
            ContentFolder folder = folderService.getFolderById(updatedDeck.getFolderId(), owner);
            deck.setFolder(folder);
        } else {
            deck.setFolder(null);
        }

        progressRepository.deleteByDeck(deck);
        deck.getCards().clear();
        if (updatedDeck.getCards() != null) {
            for (Flashcard c : updatedDeck.getCards()) {
                c.setDeck(deck);
                deck.getCards().add(c);
            }
        }
        
        FlashcardDeck saved = deckRepository.save(deck);

        if (updatedDeck.getVisibility() == com.uranus.lms.modules.access.Visibility.CLASSROOM && updatedDeck.getAssignedClassIds() != null) {
            com.uranus.lms.modules.classroom.ClassResource.ResourceType rType = "VOCABULARY".equalsIgnoreCase(saved.getDeckType())
                    ? com.uranus.lms.modules.classroom.ClassResource.ResourceType.VOCAB
                    : com.uranus.lms.modules.classroom.ClassResource.ResourceType.FLASHCARD;

            for (UUID classId : updatedDeck.getAssignedClassIds()) {
                com.uranus.lms.modules.classroom.Classroom classroom = classroomRepository.findById(classId).orElse(null);
                if (classroom != null) {
                    UUID targetFolderId = updatedDeck.getClassFolderId();
                    if (updatedDeck.getAssignedClassFolders() != null && updatedDeck.getAssignedClassFolders().containsKey(classId)) {
                        targetFolderId = updatedDeck.getAssignedClassFolders().get(classId);
                    }

                    var existing = classResourceRepository.findByClassroom_IdAndResourceId(classId, saved.getId()).orElse(null);
                    if (existing != null) {
                        existing.setFolderId(targetFolderId);
                        existing.setResourceType(rType);
                        classResourceRepository.save(existing);
                    } else {
                        com.uranus.lms.modules.classroom.ClassResource resource = com.uranus.lms.modules.classroom.ClassResource.builder()
                                .classroom(classroom)
                                .resourceId(saved.getId())
                                .resourceType(rType)
                                .folderId(targetFolderId)
                                .build();
                        classResourceRepository.save(resource);
                    }
                }
            }
        }

        populateFolderInfo(saved);
        return saved;
    }

    @Transactional
    public void deleteDeck(UUID id, User owner) {
        FlashcardDeck deck = getDeckById(id);
        if (!deck.getOwner().getId().equals(owner.getId()) && owner.getRole() != com.uranus.lms.modules.user.Role.ADMIN) {
            throw new RuntimeException("Bạn không có quyền xóa bộ từ vựng này.");
        }

        favoriteDeckRepository.deleteByDeck(deck);
        progressRepository.deleteByDeck(deck);
        var classResources = classResourceRepository.findByResourceId(deck.getId());
        if (!classResources.isEmpty()) {
            classResourceRepository.deleteAll(classResources);
        }
        deckRepository.delete(deck);
    }

    public List<StudentCardProgress> getDeckProgress(UUID deckId, User student) {
        FlashcardDeck deck = getDeckById(deckId);
        return progressRepository.findByStudentAndDeck(student, deck);
    }

    @Transactional(readOnly = true)
    public com.uranus.lms.modules.flashcard.dto.FlashcardDeckStatisticsResponse getDeckStatistics(UUID deckId, User student) {
        FlashcardDeck deck = getDeckById(deckId);
        List<StudentCardProgress> progresses = progressRepository.findByStudentAndDeck(student, deck);
        
        int totalCards = deck.getCards().size();
        int masteredCards = 0;
        int learningCards = 0;
        int newCards = 0;
        
        java.util.Map<UUID, StudentCardProgress> progressMap = progresses.stream()
                .collect(java.util.stream.Collectors.toMap(p -> p.getCard().getId(), p -> p));
                
        List<com.uranus.lms.modules.flashcard.dto.FlashcardDeckStatisticsResponse.ProblematicCard> problematicCards = new java.util.ArrayList<>();
                
        for (Flashcard card : deck.getCards()) {
            StudentCardProgress p = progressMap.get(card.getId());
            if (p == null || p.getBoxLevel() == 0) {
                newCards++;
            } else if (p.getBoxLevel() == 5) {
                masteredCards++;
            } else {
                learningCards++;
                // If a card is reviewed many times but still not mastered
                if (p.getTimesReviewed() >= 3) {
                    problematicCards.add(com.uranus.lms.modules.flashcard.dto.FlashcardDeckStatisticsResponse.ProblematicCard.builder()
                            .cardId(card.getId())
                            .frontContent(card.getFrontContent())
                            .backContent(card.getBackContent())
                            .timesReviewed(p.getTimesReviewed())
                            .boxLevel(p.getBoxLevel())
                            .build());
                }
            }
        }
        
        // Sort problematic cards by times reviewed (descending)
        problematicCards.sort((a, b) -> Integer.compare(b.getTimesReviewed(), a.getTimesReviewed()));
        if (problematicCards.size() > 5) {
            problematicCards = problematicCards.subList(0, 5);
        }

        return com.uranus.lms.modules.flashcard.dto.FlashcardDeckStatisticsResponse.builder()
                .totalCards(totalCards)
                .masteredCards(masteredCards)
                .learningCards(learningCards)
                .newCards(newCards)
                .problematicCards(problematicCards)
                .build();
    }

    @Transactional(readOnly = true)
    public List<Flashcard> getDueCards(UUID deckId, User student) {
        FlashcardDeck deck = getDeckById(deckId);
        List<StudentCardProgress> progresses = progressRepository.findByStudentAndDeck(student, deck);
        
        java.util.Map<UUID, StudentCardProgress> progressMap = progresses.stream()
                .collect(java.util.stream.Collectors.toMap(p -> p.getCard().getId(), p -> p));
                
        LocalDate today = LocalDate.now();
        
        return deck.getCards().stream().filter(card -> {
            StudentCardProgress p = progressMap.get(card.getId());
            if (p == null) return true; // never studied -> due
            if (Boolean.TRUE.equals(p.getIsMastered())) return false; // mastered
            if (p.getNextReviewDate() != null && p.getNextReviewDate().isAfter(today)) return false; // not due yet
            return true;
        }).toList();
    }

    @Transactional
    public StudentCardProgress updateCardProgress(UUID cardId, User student, boolean isCorrect) {
        Flashcard card = cardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found"));

        StudentCardProgress progress = progressRepository.findByStudentAndCard(student, card)
                .orElse(StudentCardProgress.builder()
                        .student(student)
                        .card(card)
                        .boxLevel(0) // Start at 0, will be incremented below
                        .build());

        progress.setTimesReviewed(progress.getTimesReviewed() + 1);

        if (isCorrect) {
            // Move to next box (max 5 boxes for Leitner system)
            int newBox = Math.min(progress.getBoxLevel() + 1, 5);
            progress.setBoxLevel(newBox);
            progress.setIsMastered(newBox == 5);
            
            // Set next review date based on box level (e.g., 1, 3, 7, 14, 30 days)
            int daysToAdd = switch (newBox) {
                case 1 -> 1;
                case 2 -> 3;
                case 3 -> 7;
                case 4 -> 14;
                case 5 -> 30;
                default -> 1;
            };
            progress.setNextReviewDate(LocalDate.now().plusDays(daysToAdd));
        } else {
            // Reset to box 1
            progress.setBoxLevel(1);
            progress.setIsMastered(false);
            progress.setNextReviewDate(LocalDate.now().plusDays(1));
        }

        return progressRepository.save(progress);
    }

    // ─── Favorite Deck ──────────────────────────────────────

    @Transactional
    public boolean toggleFavorite(UUID deckId, User student) {
        FlashcardDeck deck = getDeckById(deckId);
        var existing = favoriteDeckRepository.findByStudentAndDeck(student, deck);
        if (existing.isPresent()) {
            favoriteDeckRepository.delete(existing.get());
            deck.setSavesCount(Math.max(0, (deck.getSavesCount() != null ? deck.getSavesCount() : 0) - 1));
            deckRepository.save(deck);
            return false; // unfavorited
        } else {
            favoriteDeckRepository.save(StudentFavoriteDeck.builder()
                    .student(student)
                    .deck(deck)
                    .build());
            deck.setSavesCount((deck.getSavesCount() != null ? deck.getSavesCount() : 0) + 1);
            deckRepository.save(deck);
            return true; // favorited
        }
    }

    @Transactional
    public void rateDeck(UUID deckId, User user, int rating) {
        FlashcardDeck deck = getDeckById(deckId);

        boolean isStaffOrOwner = user != null && (
                user.getRole() == com.uranus.lms.modules.user.Role.ADMIN ||
                user.getRole() == com.uranus.lms.modules.user.Role.OFFICE ||
                user.getRole() == com.uranus.lms.modules.user.Role.TEACHER ||
                user.getRole() == com.uranus.lms.modules.user.Role.TEACHING_ASSISTANT ||
                (deck.getOwner() != null && deck.getOwner().getId().equals(user.getId()))
        );

        if (deck.getVisibility() != com.uranus.lms.modules.access.Visibility.PUBLIC && !isStaffOrOwner) {
            var decision = studentResourceAccessService.decideSingle(
                    user,
                    deck.getId(),
                    deck.getVisibility(),
                    deck.getOwner() != null ? deck.getOwner().getId() : null);
            if (decision.isLocked()) {
                throw new BadRequestException("Bạn không có quyền đánh giá bộ thẻ này.");
            }
        }

        if (rating < 1 || rating > 5) {
            throw new IllegalArgumentException("Điểm đánh giá phải từ 1 đến 5.");
        }

        var existing = deckRatingRepository.findByDeckAndStudent(deck, user);
        if (existing.isPresent()) {
            DeckRating deckRating = existing.get();
            deckRating.setRating(rating);
            deckRatingRepository.save(deckRating);
        } else {
            DeckRating deckRating = DeckRating.builder()
                    .deck(deck)
                    .student(user)
                    .rating(rating)
                    .build();
            deckRatingRepository.save(deckRating);
        }

        // Recalculate average and count
        int count = deckRatingRepository.countByDeck(deck);
        double average = deckRatingRepository.averageByDeck(deck);

        deck.setRatingCount(count);
        deck.setAverageRating(average);
        deckRepository.save(deck);

        // Notify deck owner if not self
        if (deck.getOwner() != null && user != null && !deck.getOwner().getId().equals(user.getId())) {
            notificationService.sendNotification(
                    deck.getOwner(),
                    "Đánh giá mới cho bộ thẻ",
                    user.getFullName() + " đã đánh giá " + rating + "⭐ cho bộ thẻ '" + deck.getTitle() + "' của bạn.",
                    "/flashcards/" + deck.getId(),
                    com.uranus.lms.modules.notification.NotificationType.FLASHCARD,
                    user,
                    "FLASHCARD_DECK",
                    deck.getId().toString()
            );
        }
    }

    @Transactional(readOnly = true)
    public boolean isFavorited(UUID deckId, User student) {
        FlashcardDeck deck = deckRepository.findById(deckId)
                .orElseThrow(() -> new ResourceNotFoundException("Deck not found"));
        return favoriteDeckRepository.existsByStudentAndDeck(student, deck);
    }

    @Transactional(readOnly = true)
    public Page<FlashcardDeck> getFavoriteDecks(User student, Pageable pageable, String search, String deckType) {
        Page<StudentFavoriteDeck> page = favoriteDeckRepository.findFavoriteDecks(student, search != null && !search.trim().isEmpty() ? search.trim() : null, deckType != null && !deckType.trim().isEmpty() ? deckType.trim() : null, pageable);
        return page.map(fav -> {
            FlashcardDeck deck = fav.getDeck();
            populateFolderInfo(deck);
            return deck;
        });
    }

    @Transactional
    public void incrementViewCount(UUID deckId) {
        deckRepository.findById(deckId).ifPresent(deck -> {
            deck.setViewsCount((deck.getViewsCount() != null ? deck.getViewsCount() : 0) + 1);
            deckRepository.save(deck);
        });
    }

    @Transactional
    public void incrementShareCount(UUID deckId) {
        deckRepository.findById(deckId).ifPresent(deck -> {
            deck.setSharesCount((deck.getSharesCount() != null ? deck.getSharesCount() : 0) + 1);
            deckRepository.save(deck);
        });
    }

    @Transactional(readOnly = true)
    public List<FlashcardDeck> getSuggestedDecks(UUID deckId) {
        FlashcardDeck currentDeck = deckRepository.findById(deckId)
                .orElseThrow(() -> new ResourceNotFoundException("Deck not found"));
        Page<FlashcardDeck> topDecks = deckRepository.findByVisibilityAndIdNotAndDeckTypeOrderByViewsCountDesc(
                com.uranus.lms.modules.access.Visibility.PUBLIC,
                currentDeck.getId(), currentDeck.getDeckType(), org.springframework.data.domain.PageRequest.of(0, 5));
        return topDecks.getContent();
    }
}
