package com.uranus.lms.modules.flashcard.ai;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/vocabulary/ai")
@RequiredArgsConstructor
public class VocabularyAIController {

    private final VocabularyAIService vocabularyAIService;

    @PostMapping("/auto-fill")
    @PreAuthorize("hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN')")
    public ResponseEntity<AutoFillResponse> autoFill(@RequestBody AutoFillRequest request) {
        if (request.getWord() == null || request.getWord().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(vocabularyAIService.generateVocabularyInfo(request.getWord().trim()));
    }
}
