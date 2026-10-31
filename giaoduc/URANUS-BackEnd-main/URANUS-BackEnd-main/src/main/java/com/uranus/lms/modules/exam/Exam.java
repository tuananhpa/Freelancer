package com.uranus.lms.modules.exam;

import com.uranus.lms.modules.user.User;
import com.uranus.lms.modules.folder.ContentFolder;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "exams")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Exam {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "subject")
    private String subject;

    @Column(name = "grade")
    private String grade;

    /** Mã đề ngắn để học sinh tìm kiếm (VD: "ABC123") */
    @Column(name = "exam_code", unique = true, length = 12)
    private String examCode;

    /**
     * Kiểu tạo đề:
     * DETAILED  = Soạn đề chi tiết (từng câu hỏi + đáp án)
     * ANSWER_SHEET = Phiếu trả lời (upload PDF + cấu hình phiếu)
     */
    @Column(name = "exam_type", length = 20)
    @Builder.Default
    private String examType = "DETAILED";

    /** URL file PDF đề thi (chỉ dùng cho kiểu ANSWER_SHEET) */
    @Column(name = "pdf_url", columnDefinition = "TEXT")
    private String pdfUrl;

    /** URL file âm thanh bài nghe (chỉ dùng cho kiểu ANSWER_SHEET) — audio đơn, giữ để tương thích đề cũ */
    @Column(name = "audio_url", columnDefinition = "TEXT")
    private String audioUrl;

    /**
     * Nhiều file audio đặt tên riêng (VD: Part 1, Part 2...) cho bài nghe nhiều part.
     * Nếu có, giao diện làm bài ưu tiên hiển thị danh sách này thay vì audioUrl đơn.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "audio_tracks", columnDefinition = "jsonb")
    @Builder.Default
    private List<ExamAudioTrack> audioTracks = new ArrayList<>();

    /** Mật khẩu/mã bảo vệ đề thi (plain text, null = không cần mật khẩu) */
    @Column(name = "access_code", length = 100)
    private String accessCode;

    @Column(name = "duration_minutes", nullable = false)
    private Integer durationMinutes;

    /** Thời gian bắt đầu nhận bài (null = ngay lập tức) */
    @Column(name = "start_time")
    private LocalDateTime startTime;

    /** Thời gian kết thúc nhận bài (null = không giới hạn) */
    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(name = "passing_score")
    @Builder.Default
    private Double passingScore = 60.0;

    @Column(name = "is_published")
    @Builder.Default
    private Boolean isPublished = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "visibility", length = 20)
    @Builder.Default
    private com.uranus.lms.modules.access.Visibility visibility = com.uranus.lms.modules.access.Visibility.PUBLIC;

    @Column(name = "shuffle_questions")
    @Builder.Default
    private Boolean shuffleQuestions = false;

    /**
     * Chính sách xem lại bài sau khi nộp:
     * IMMEDIATELY = xem ngay, AFTER_ALL_SUBMITTED = sau khi tất cả nộp, NEVER = không cho xem
     */
    @Column(name = "review_policy", length = 30)
    @Builder.Default
    private String reviewPolicy = "IMMEDIATELY";

    /** Số lần làm bài tối đa (mặc định 1 lần) */
    @Column(name = "max_attempts")
    @Builder.Default
    private Integer maxAttempts = 1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", nullable = false)
    private User teacher;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "folder_id", foreignKey = @ForeignKey(name = "fk_exams_folder"))
    @OnDelete(action = OnDeleteAction.SET_NULL)
    private ContentFolder folder;

    @OneToMany(mappedBy = "exam", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    @Builder.Default
    private List<Question> questions = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @com.fasterxml.jackson.annotation.JsonProperty("teacherName")
    public String getTeacherName() {
        return teacher != null ? teacher.getFullName() : null;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("teacherAvatar")
    public String getTeacherAvatar() {
        return teacher != null ? teacher.getAvatarUrl() : null;
    }
}
