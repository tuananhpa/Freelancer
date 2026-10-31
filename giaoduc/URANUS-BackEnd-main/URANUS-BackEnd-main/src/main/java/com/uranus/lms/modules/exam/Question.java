package com.uranus.lms.modules.exam;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "questions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content; // Stores HTML rich text

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "question_type")
    @Builder.Default
    private String questionType = "MULTIPLE_CHOICE"; // MULTIPLE_CHOICE, TRUE_FALSE, ESSAY

    /** FK tới QuestionGroup (null = câu độc lập) */
    @Column(name = "group_id")
    private UUID groupId;

    /** Giải thích đáp án đúng (hiển thị trong Review mode, hỗ trợ LaTeX) */
    @Column(name = "explanation", columnDefinition = "TEXT")
    private String explanation;

    /**
     * Loại ô trả lời cho kiểu Phiếu trả lời:
     * ABCD | NUMBERED_4 | TRUE_FALSE | ESSAY
     */
    @Column(name = "sheet_answer_type", length = 20)
    private String sheetAnswerType;

    @Column(name = "order_index", nullable = false)
    @Builder.Default
    private Integer orderIndex = 0;

    @Column(nullable = false)
    @Builder.Default
    private Double points = 1.0;

    @Column(name = "skill_tag", length = 50)
    @Builder.Default
    private String skillTag = "GENERAL"; // GRAMMAR, VOCABULARY, READING, LISTENING, WRITING, GENERAL

    /**
     * JSON config chấm điểm cho câu Đúng/Sai (TRUE_FALSE).
     * null = ALL_OR_NOTHING (sai bất kỳ ý = 0 điểm)
     * VD: {"type":"PARTIAL","thresholds":[{"wrongCount":1,"ratio":0.75},{"wrongCount":2,"ratio":0.5}]}
     */
    @Column(name = "scoring_config", columnDefinition = "TEXT")
    private String scoringConfig;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false, foreignKey = @ForeignKey(name = "fk_questions_exam"))
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Exam exam;

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<QuestionOption> options = new ArrayList<>();
}
