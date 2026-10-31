package com.uranus.lms.modules.flashcard.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@Builder
public class FlashcardDeckStatisticsResponse {
    private int totalCards;
    private int masteredCards;
    private int learningCards;
    private int newCards;
    private List<ProblematicCard> problematicCards;

    @Data
    @Builder
    public static class ProblematicCard {
        private UUID cardId;
        private String frontContent;
        private String backContent;
        private int timesReviewed;
        private int boxLevel;
    }
}
