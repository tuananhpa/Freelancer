package com.uranus.lms.modules.folder.dto;

import com.uranus.lms.modules.folder.ContentFolder;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class FolderResponse {
    private UUID id;
    private String name;
    private String description;
    private String color;
    private LocalDateTime createdAt;
    private long examCount;
    private long deckCount;

    public static FolderResponse from(ContentFolder folder, long examCount, long deckCount) {
        return FolderResponse.builder()
                .id(folder.getId())
                .name(folder.getName())
                .description(folder.getDescription())
                .color(folder.getColor())
                .createdAt(folder.getCreatedAt())
                .examCount(examCount)
                .deckCount(deckCount)
                .build();
    }
}
