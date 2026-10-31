package com.uranus.lms.modules.share;

import com.uranus.lms.exception.BadRequestException;
import com.uranus.lms.exception.ResourceNotFoundException;
import com.uranus.lms.modules.flashcard.Flashcard;
import com.uranus.lms.modules.flashcard.FlashcardDeck;
import com.uranus.lms.modules.flashcard.FlashcardDeckRepository;
import com.uranus.lms.modules.flashcard.FlashcardService;
import com.uranus.lms.modules.flashcard.dto.CreateDeckRequest;
import com.uranus.lms.modules.user.User;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ShareService {

    private final ContentShareRepository shareRepository;
    private final FlashcardDeckRepository deckRepository;
    private final FlashcardService flashcardService;

    @Transactional
    public ShareLinkDto createShareLink(String resourceType, UUID resourceId, User user) {
        String token;
        do {
            token = RandomStringUtils.randomAlphanumeric(12);
        } while (shareRepository.findByShareToken(token).isPresent());

        ContentShare share = ContentShare.builder()
                .resourceType(resourceType.toUpperCase())
                .resourceId(resourceId)
                .shareToken(token)
                .createdBy(user)
                .expiresAt(LocalDateTime.now().plusDays(30))
                .build();
        shareRepository.save(share);

        return ShareLinkDto.builder()
                .shareToken(token)
                .shareUrl("/share/" + token)
                .resourceType(share.getResourceType())
                .resourceId(resourceId)
                .expiresAt(share.getExpiresAt().toString())
                .build();
    }

    @Transactional(readOnly = true)
    public ShareLinkDto resolveShare(String token) {
        ContentShare share = shareRepository.findByShareToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Link chia sẻ không hợp lệ"));
        if (share.getExpiresAt() != null && share.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Link chia sẻ đã hết hạn");
        }
        return ShareLinkDto.builder()
                .shareToken(token)
                .resourceType(share.getResourceType())
                .resourceId(share.getResourceId())
                .build();
    }

    @Transactional
    public FlashcardDeck cloneDeck(UUID deckId, User user) {
        FlashcardDeck source = deckRepository.findByIdWithCards(deckId)
                .orElseThrow(() -> new ResourceNotFoundException("Deck not found"));

        CreateDeckRequest request = new CreateDeckRequest();
        request.setTitle(source.getTitle() + " (Bản sao)");
        request.setDescription(source.getDescription());
        request.setVisibility(com.uranus.lms.modules.access.Visibility.HIDDEN);
        request.setCards(source.getCards().stream().map(c -> {
            Flashcard copy = new Flashcard();
            copy.setFrontContent(c.getFrontContent());
            copy.setBackContent(c.getBackContent());
            copy.setImageUrl(c.getImageUrl());
            copy.setAudioUrl(c.getAudioUrl());
            copy.setWordType(c.getWordType());
            copy.setDefinitionEn(c.getDefinitionEn());
            copy.setDefinitionVi(c.getDefinitionVi());
            copy.setExample(c.getExample());
            copy.setPhonetic(c.getPhonetic());
            copy.setExampleTranslation(c.getExampleTranslation());
            return copy;
        }).toList());

        return flashcardService.createDeck(request, user);
    }

    @Data
    @Builder
    public static class ShareLinkDto {
        private String shareToken;
        private String shareUrl;
        private String resourceType;
        private UUID resourceId;
        private String expiresAt;
    }
}
