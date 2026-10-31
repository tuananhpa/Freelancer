package com.uranus.lms.modules.exam.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ExamResponse {
    private UUID id;
    private String title;
    private String description;
    private String subject;
    private String grade;
    private Integer durationMinutes;
    private Double passingScore;
    private Boolean isPublished;
    private String visibility;
    private Boolean shuffleQuestions;
    private Integer questionCount;
    private String teacherName;
    private String teacherAvatar;
    private UUID teacherId;
    private LocalDateTime createdAt;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String reviewPolicy;
    private Integer maxAttempts;
    private String examCode;
    private UUID folderId;
    private String folderName;
    private Boolean isFavorited;
    private String examType;       // DETAILED | ANSWER_SHEET
    private String pdfUrl;         // Chỉ có khi ANSWER_SHEET
    private String audioUrl;       // Chỉ có khi ANSWER_SHEET — audio đơn, giữ để tương thích đề cũ
    private List<com.uranus.lms.modules.exam.ExamAudioTrack> audioTracks; // Nhiều audio đặt tên riêng (Part 1, Part 2...)
    private Boolean hasPassword;   // true nếu có mật khẩu/mã truy cập
    private String accessCode;     // Chỉ trả về cho giáo viên sở hữu đề thi
    private String accessLevel;    // FULL | PREVIEW
    private Boolean locked;
    private Integer previewRank;
    private Long userAttemptCount;
    private UUID latestResultId;
    private String unlockHint;
    private List<QuestionResponse> questions;
    private List<QuestionGroupResponse> questionGroups;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class QuestionGroupResponse {
        private UUID id;
        private String groupTitle;
        private String passageText;
        private String audioUrl;
        private Integer orderIndex;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class QuestionResponse {
        private UUID id;
        private String content;
        private String imageUrl;
        private String questionType;
        private String skillTag;
        private Integer orderIndex;
        private Double points;
        private String explanation;     // Giải thích đáp án (hỗ trợ LaTeX)
        private UUID groupId;           // FK tới nhóm câu hỏi
        private String sheetAnswerType; // Chỉ dùng ANSWER_SHEET
        private List<OptionResponse> options;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class OptionResponse {
        private UUID id;
        private String content;
        private Boolean isCorrect;
    }
}
