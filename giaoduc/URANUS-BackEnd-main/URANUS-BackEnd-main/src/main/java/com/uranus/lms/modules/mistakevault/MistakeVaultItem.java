package com.uranus.lms.modules.mistakevault;

import com.uranus.lms.modules.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "mistake_vault_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MistakeVaultItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Column(name = "item_type", nullable = false, length = 20)
    private String itemType;

    @Column(name = "question_id")
    private UUID questionId;

    @Column(name = "flashcard_id")
    private UUID flashcardId;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "correct_answer", columnDefinition = "TEXT", nullable = false)
    private String correctAnswer;

    @Column(name = "wrong_answer", columnDefinition = "TEXT")
    private String wrongAnswer;

    @Column(name = "skill_tag", length = 50)
    private String skillTag;

    @Column(name = "source_title", length = 500)
    private String sourceTitle;

    @Column(name = "wrong_count", nullable = false)
    @Builder.Default
    private Integer wrongCount = 1;

    @Column(nullable = false)
    @Builder.Default
    private Integer repetitions = 0;

    @Column(name = "interval_days", nullable = false)
    @Builder.Default
    private Integer intervalDays = 1;

    @Column(name = "ease_factor", nullable = false)
    @Builder.Default
    private Double easeFactor = 2.5;

    @Column(name = "next_review_date", nullable = false)
    private LocalDate nextReviewDate;

    @Column(name = "last_reviewed_at")
    private LocalDateTime lastReviewedAt;

    @Column(name = "created_at", updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
