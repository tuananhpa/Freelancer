package com.uranus.lms.modules.exam.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class ExamSnapshotDto {
    private UUID examId;
    private String examTitle;
    private String examCode;
    private Integer durationMinutes;
    private Double passingScore;
    private Double maxScore;
    private String examType;
    private String pdfUrl;
    private String audioUrl;
    private List<com.uranus.lms.modules.exam.ExamAudioTrack> audioTracks;

    private List<SnapshotGroupDto> groups;
    private List<SnapshotQuestionDto> questions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SnapshotGroupDto {
        private UUID groupId;
        private String groupTitle;
        private String passageText;
        private String audioUrl;
        private Integer orderIndex;
    }

    @Data
    @Builder(toBuilder = true)
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SnapshotQuestionDto {
        private UUID questionId;
        private String content;
        private String imageUrl;
        private String questionType;
        private String skillTag;
        private Double points;
        private Integer orderIndex;
        private String explanation;
        private String sheetAnswerType;
        private UUID groupId;
        private String scoringConfig; // JSON config for TRUE_FALSE partial scoring
        
        private List<SnapshotOptionDto> options;
    }

    @Data
    @Builder(toBuilder = true)
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SnapshotOptionDto {
        private UUID optionId;
        private String content;
        private Boolean isCorrect;
    }
}
