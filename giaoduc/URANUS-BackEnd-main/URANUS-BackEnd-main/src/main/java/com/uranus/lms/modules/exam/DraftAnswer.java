package com.uranus.lms.modules.exam;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.NotFound;
import org.hibernate.annotations.NotFoundAction;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Lưu tạm đáp án học sinh đang làm (Auto-save / Draft).
 * Được upsert theo cặp (result_id, question_id) để tránh trùng lặp.
 */
@Entity
@Table(name = "draft_answers", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"result_id", "question_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DraftAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "result_id", nullable = false, foreignKey = @ForeignKey(name = "fk_draft_answers_result"))
    @OnDelete(action = OnDeleteAction.CASCADE)
    private StudentExamResult result;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false, foreignKey = @ForeignKey(name = "fk_draft_answers_question"))
    @NotFound(action = NotFoundAction.IGNORE)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Question question;

    /** Đáp án học sinh đã chọn (null nếu chưa chọn) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "selected_option_id", foreignKey = @ForeignKey(name = "fk_draft_answers_option"))
    @OnDelete(action = OnDeleteAction.CASCADE)
    private QuestionOption selectedOption;
    @Column(name = "text_response", columnDefinition = "TEXT")
    private String textResponse;

    @UpdateTimestamp
    @Column(name = "saved_at")
    private LocalDateTime savedAt;
}
