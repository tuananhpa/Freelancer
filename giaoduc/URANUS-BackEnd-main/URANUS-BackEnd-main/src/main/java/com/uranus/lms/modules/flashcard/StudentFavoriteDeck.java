package com.uranus.lms.modules.flashcard;

import com.uranus.lms.modules.user.User;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "student_favorite_decks",
       uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "deck_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentFavoriteDeck {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deck_id", nullable = false, foreignKey = @ForeignKey(name = "fk_student_favorite_decks_deck"))
    @OnDelete(action = OnDeleteAction.CASCADE)
    private FlashcardDeck deck;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
