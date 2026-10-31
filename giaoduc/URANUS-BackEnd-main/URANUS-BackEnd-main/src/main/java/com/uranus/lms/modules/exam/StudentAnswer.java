package com.uranus.lms.modules.exam;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.NotFound;
import org.hibernate.annotations.NotFoundAction;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.util.UUID;

@Entity
@Table(name = "student_answers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "result_id", nullable = false, foreignKey = @ForeignKey(name = "fk_student_answers_result"))
    @OnDelete(action = OnDeleteAction.CASCADE)
    private StudentExamResult result;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = true, foreignKey = @ForeignKey(name = "fk_student_answers_question"))
    @OnDelete(action = OnDeleteAction.SET_NULL)
    @NotFound(action = NotFoundAction.IGNORE)
    private Question question;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "selected_option_id", foreignKey = @ForeignKey(name = "fk_student_answers_option"))
    @OnDelete(action = OnDeleteAction.SET_NULL)
    private QuestionOption selectedOption;

    @Column(name = "is_correct")
    private Boolean isCorrect;

    @Column(name = "points_earned")
    @Builder.Default
    private Double pointsEarned = 0.0;

    @Column(columnDefinition = "TEXT")
    private String textResponse; // For ESSAY type

    @Column(columnDefinition = "TEXT")
    private String aiFeedback; // Feedback from Gemini

    @Column(name = "ai_suggested_score")
    private Double aiSuggestedScore; // Điểm AI đề xuất cho câu tự luận, trước khi giáo viên duyệt

    /** true = điểm đã chốt (câu không phải tự luận, hoặc tự luận đã được giáo viên duyệt) */
    @Column(name = "reviewed")
    @Builder.Default
    private Boolean reviewed = true;
}
