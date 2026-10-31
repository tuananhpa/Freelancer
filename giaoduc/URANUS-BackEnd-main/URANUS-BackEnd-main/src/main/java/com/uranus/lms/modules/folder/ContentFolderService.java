package com.uranus.lms.modules.folder;

import com.uranus.lms.exception.BadRequestException;
import com.uranus.lms.exception.ResourceNotFoundException;
import com.uranus.lms.modules.exam.ExamRepository;
import com.uranus.lms.modules.flashcard.FlashcardDeckRepository;
import com.uranus.lms.modules.folder.dto.CreateFolderRequest;
import com.uranus.lms.modules.folder.dto.FolderResponse;
import com.uranus.lms.modules.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ContentFolderService {

    private final ContentFolderRepository folderRepository;
    private final ExamRepository examRepository;
    private final FlashcardDeckRepository deckRepository;

    public Page<FolderResponse> getMyFolders(User owner, Pageable pageable) {
        return folderRepository.findByOwnerOrderByCreatedAtDesc(owner, pageable)
                .map(folder -> FolderResponse.from(
                        folder,
                        examRepository.countByFolder(folder),
                        deckRepository.countByFolder(folder)
                ));
    }

    public ContentFolder getFolderById(UUID id, User owner) {
        ContentFolder folder = folderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy folder"));
        if (!folder.getOwner().getId().equals(owner.getId())) {
            throw new BadRequestException("Bạn không có quyền truy cập folder này.");
        }
        return folder;
    }

    @Transactional
    public FolderResponse createFolder(CreateFolderRequest request, User owner) {
        ContentFolder folder = ContentFolder.builder()
                .name(request.getName().trim())
                .description(request.getDescription())
                .color(request.getColor() != null ? request.getColor() : "cam")
                .owner(owner)
                .build();
        ContentFolder saved = folderRepository.save(folder);
        return FolderResponse.from(saved, 0, 0);
    }

    @Transactional
    public void deleteFolder(UUID id, User owner) {
        ContentFolder folder = getFolderById(id, owner);
        examRepository.clearFolder(folder);
        deckRepository.clearFolder(folder);
        folderRepository.delete(folder);
    }
}