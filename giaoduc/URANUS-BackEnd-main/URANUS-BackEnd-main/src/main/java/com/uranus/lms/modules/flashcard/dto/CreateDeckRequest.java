package com.uranus.lms.modules.flashcard.dto;

import com.uranus.lms.modules.flashcard.Flashcard;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class CreateDeckRequest {
    @NotBlank(message = "Title is required")
    private String title;
    
    private String description;
    
    private com.uranus.lms.modules.access.Visibility visibility = com.uranus.lms.modules.access.Visibility.PUBLIC;
    
    private String accessCode;
    
    private List<UUID> assignedClassIds;

    private java.util.Map<UUID, UUID> assignedClassFolders;

    private UUID classFolderId;

    private UUID folderId;
    
    private List<String> tags;
    
    private String imageUrl;
    
    private String deckType;
    
    private String subject;
    
    private List<Flashcard> cards;
}
