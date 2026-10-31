package com.uranus.lms.modules.exam.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class CreateExamRequest {
    @NotBlank(message = "Tên đề thi không được để trống")
    private String title;

    private String description;

    private String subject;
    private String grade;

    @NotNull(message = "Thời gian làm bài không được để trống")
    @Min(value = 1, message = "Thời gian tối thiểu là 1 phút")
    private Integer durationMinutes;

    private Double passingScore = 60.0;
    private Boolean shuffleQuestions = false;
    private Boolean isPublished = false;
    private com.uranus.lms.modules.access.Visibility visibility = com.uranus.lms.modules.access.Visibility.PUBLIC;

    private java.time.LocalDateTime startTime;
    private java.time.LocalDateTime endTime;
    private String reviewPolicy = "IMMEDIATELY";
    private Integer maxAttempts = 1;

    private UUID folderId;

    /**
     * Kiểu đề thi: DETAILED (Soạn đề chi tiết) | ANSWER_SHEET (Phiếu trả lời)
     */
    private String examType = "DETAILED";

    /** URL file PDF (chỉ dùng cho ANSWER_SHEET) */
    private String pdfUrl;

    /** URL file âm thanh bài nghe (chỉ dùng cho ANSWER_SHEET) — audio đơn, giữ để tương thích đề cũ */
    private String audioUrl;

    /** Nhiều file audio đặt tên riêng (VD: Part 1, Part 2...) cho bài nghe nhiều part */
    private List<com.uranus.lms.modules.exam.ExamAudioTrack> audioTracks;

    /** Mật khẩu bảo vệ đề thi (plain text, null = không bảo vệ) */
    private String accessCode;
    
    private List<UUID> assignedClassIds;

    // Khong bat buoc @NotEmpty o day nua - autosave luu nhap ngay tu Buoc 1/4
    // (moi chon loai de, chua co cau hoi nao) cung di qua DTO nay. Rang buoc
    // "phai co it nhat 1 cau hoi" chi thuc su can khi XUAT BAN, duoc kiem tra
    // rieng trong ExamService.
    @jakarta.validation.Valid
    private List<QuestionDto> questions;

    /** Danh sách nhóm câu hỏi (đọc hiểu, v.v.) - chỉ dùng cho DETAILED */
    private List<QuestionGroupDto> questionGroups;

    @Data
    public static class QuestionDto {
        private String id; // null khi tạo mới, có giá trị khi update

        @NotBlank(message = "Nội dung câu hỏi không được để trống")
        private String content; // HTML rich text (hỗ trợ LaTeX $...$)

        private String imageUrl;
        private Integer orderIndex = 0;
        private Double points = 1.0;
        private String questionType = "MULTIPLE_CHOICE"; // MULTIPLE_CHOICE, TRUE_FALSE, ESSAY
        private String skillTag = "GENERAL";

        /** ID nhóm câu hỏi (null = câu độc lập) */
        private String groupId;

        /** Giải thích đáp án đúng (hỗ trợ LaTeX) */
        private String explanation;

        /** Kiểu ô trả lời cho Phiếu trả lời: ABCD | NUMBERED_4 | TRUE_FALSE | ESSAY */
        private String sheetAnswerType;

        /** JSON config chấm điểm cho câu TRUE_FALSE. null = ALL_OR_NOTHING */
        private String scoringConfig;

        @jakarta.validation.Valid
        private List<OptionDto> options;
    }

    @Data
    public static class OptionDto {
        private String id; // null khi tạo mới, có giá trị khi update

        // Content can be HTML with text or just an image tag; allow blank for image-only answers
        private String content;
        private Boolean isCorrect = false;
    }

    @Data
    public static class QuestionGroupDto {
        private String id; // null khi tạo mới, có giá trị khi update
        private String groupTitle;
        private String passageText; // HTML + LaTeX
        private String audioUrl; // File nghe riêng cho part này
        private Integer orderIndex = 0;
    }
}
