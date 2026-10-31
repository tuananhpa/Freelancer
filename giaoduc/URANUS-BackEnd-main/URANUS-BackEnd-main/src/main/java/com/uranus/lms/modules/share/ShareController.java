package com.uranus.lms.modules.share;

import com.uranus.lms.modules.flashcard.FlashcardDeck;
import com.uranus.lms.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/share")
@RequiredArgsConstructor
public class ShareController {

    private final ShareService shareService;

    @PostMapping
    public ResponseEntity<ShareService.ShareLinkDto> createShare(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        UUID resourceId = UUID.fromString(body.get("resourceId"));
        String type = body.getOrDefault("resourceType", "DECK");
        return ResponseEntity.ok(shareService.createShareLink(type, resourceId, userDetails.getUser()));
    }

    @GetMapping("/{token}")
    public ResponseEntity<ShareService.ShareLinkDto> resolve(@PathVariable String token) {
        return ResponseEntity.ok(shareService.resolveShare(token));
    }

    @PostMapping("/clone/deck/{deckId}")
    public ResponseEntity<FlashcardDeck> cloneDeck(
            @PathVariable UUID deckId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(shareService.cloneDeck(deckId, userDetails.getUser()));
    }
}
