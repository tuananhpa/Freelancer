package com.uranus.lms.modules.learningpath;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public class LearningPathDto {

    @Data
    @Builder
    public static class StatusResponse {
        private boolean completed;
        private String recommendedLevel;
        private Map<String, Integer> skillScores;
    }

    @Data
    @Builder
    public static class RecommendationsResponse {
        private String weakestSkill;
        private List<RecommendationItem> items;
    }

    @Data
    @Builder
    public static class RecommendationItem {
        private String type;
        private UUID id;
        private String title;
        private String reason;
        private String link;
    }

    @Data
    @Builder
    public static class PlacementTestResponse {
        private List<PlacementQuestionDto> questions;
    }

    @Data
    @Builder
    public static class PlacementQuestionDto {
        private String id;
        private String skillTag;
        private String content;
        private List<PlacementOptionDto> options;
    }

    @Data
    @Builder
    public static class PlacementOptionDto {
        private String id;
        private String content;
    }
}
