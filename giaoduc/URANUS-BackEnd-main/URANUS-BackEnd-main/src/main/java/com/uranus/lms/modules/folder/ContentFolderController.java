package com.uranus.lms.modules.folder;

import com.uranus.lms.modules.folder.dto.CreateFolderRequest;
import com.uranus.lms.modules.folder.dto.FolderResponse;
import com.uranus.lms.modules.user.User;
import com.uranus.lms.modules.user.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/folders")
@RequiredArgsConstructor
public class ContentFolderController {

    private final ContentFolderService folderService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<Page<FolderResponse>> getMyFolders(@PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(folderService.getMyFolders(getCurrentUser(), pageable));
    }

    @PostMapping
    public ResponseEntity<FolderResponse> createFolder(@Valid @RequestBody CreateFolderRequest request) {
        return ResponseEntity.ok(folderService.createFolder(request, getCurrentUser()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFolder(@PathVariable UUID id) {
        folderService.deleteFolder(id, getCurrentUser());
        return ResponseEntity.noContent().build();
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow();
    }
}
