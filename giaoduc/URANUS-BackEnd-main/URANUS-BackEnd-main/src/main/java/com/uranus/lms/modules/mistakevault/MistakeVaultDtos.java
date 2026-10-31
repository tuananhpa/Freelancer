package com.uranus.lms.modules.mistakevault;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@Builder
class MistakeVaultStatsDto {
    private long totalItems;
    private long dueToday;
    private List<MistakeVaultItemDto> dueItems;
}

@Data
@Builder
class MistakeVaultItemDto {
    private UUID id;
    private String itemType;
    private String content;
    private String correctAnswer;
    private String wrongAnswer;
    private String skillTag;
    private String sourceTitle;
    private int wrongCount;
    private int repetitions;
    private int intervalDays;
    private String nextReviewDate;
}

@Data
class AddVocabMistakeRequest {
    private UUID flashcardId;
    private String frontContent;
    private String backContent;
    private String sourceTitle;
}

@Data
class ReviewMistakeRequest {
    private boolean remembered;
}
