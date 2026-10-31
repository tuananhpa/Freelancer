package com.uranus.lms.modules.mistakevault;

import com.uranus.lms.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/mistake-vault")
@RequiredArgsConstructor
public class MistakeVaultController {

    private final MistakeVaultService mistakeVaultService;

    @GetMapping
    public ResponseEntity<MistakeVaultStatsDto> getVault(@AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(mistakeVaultService.getVault(user.getUser()));
    }

    @PostMapping("/vocab")
    public ResponseEntity<Void> addVocabMistake(
            @RequestBody AddVocabMistakeRequest request,
            @AuthenticationPrincipal UserDetailsImpl user) {
        mistakeVaultService.addVocabMistake(user.getUser(), request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/review")
    public ResponseEntity<MistakeVaultItemDto> review(
            @PathVariable UUID id,
            @RequestBody ReviewMistakeRequest request,
            @AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(mistakeVaultService.reviewItem(user.getUser(), id, request.isRemembered()));
    }
}
