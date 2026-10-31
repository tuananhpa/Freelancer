package com.uranus.lms.modules.exam;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Nhóm câu hỏi — dùng cho dạng đọc hiểu, bài nghe, hoặc bài tập nhóm.
 * Một nhóm có thể chứa nhiều câu hỏi con (Question.groupId = this.id).
 * Chỉ dùng cho đề kiểu "Soạn đề chi tiết" (examType = DETAILED).
 */
@Entity
@Table(name = "question_groups")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false, foreignKey = @ForeignKey(name = "fk_question_groups_exam"))
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Exam exam;

    /** Tiêu đề nhóm, VD: "Đọc đoạn văn sau và trả lời câu hỏi" */
    @Column(name = "group_title", columnDefinition = "TEXT")
    private String groupTitle;

    /**
     * Nội dung passage/bài đọc/bài nghe (hỗ trợ HTML + LaTeX $...$).
     * Render bằng TipTap ở editor, KaTeX ở take mode.
     */
    @Column(name = "passage_text", columnDefinition = "TEXT")
    private String passageText;

    /** File audio riêng cho part này (bài nghe nhiều part, mỗi part 1 file khác nhau) */
    @Column(name = "audio_url", columnDefinition = "TEXT")
    private String audioUrl;

    /** Thứ tự xuất hiện trong đề thi */
    @Column(name = "order_index", nullable = false)
    @Builder.Default
    private Integer orderIndex = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
