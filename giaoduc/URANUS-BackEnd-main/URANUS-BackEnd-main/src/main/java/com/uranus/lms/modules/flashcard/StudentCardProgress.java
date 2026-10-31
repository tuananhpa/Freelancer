package com.uranus.lms.modules.flashcard;

import com.uranus.lms.modules.user.User;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "student_card_progress")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentCardProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "card_id", nullable = false)
    private Flashcard card;

    @Column(name = "box_level", nullable = false)
    @Builder.Default
    private Integer boxLevel = 1;

    @Column(name = "next_review_date")
    private LocalDate nextReviewDate;

    @Column(name = "times_reviewed")
    @Builder.Default
    private Integer timesReviewed = 0;

    @Column(name = "is_mastered")
    @Builder.Default
    private Boolean isMastered = false;
}
