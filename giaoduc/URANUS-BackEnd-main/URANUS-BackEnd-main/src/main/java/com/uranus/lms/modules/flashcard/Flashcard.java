package com.uranus.lms.modules.flashcard;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Table(name = "flashcards")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Flashcard {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String frontContent;

    @Column(name = "back_content", columnDefinition = "TEXT", nullable = false)
    private String backContent;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    @Column(name = "audio_url", columnDefinition = "TEXT")
    private String audioUrl;

    @Column(name = "word_type")
    private String wordType;

    @Column(name = "definition_en", columnDefinition = "TEXT")
    private String definitionEn;

    @Column(name = "definition_vi", columnDefinition = "TEXT")
    private String definitionVi;

    @Column(columnDefinition = "TEXT")
    private String example;

    @Column(name = "phonetic")
    private String phonetic;

    @Column(name = "example_translation", columnDefinition = "TEXT")
    private String exampleTranslation;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deck_id", nullable = false, foreignKey = @ForeignKey(name = "fk_flashcards_deck"))
    @OnDelete(action = OnDeleteAction.CASCADE)
    private FlashcardDeck deck;
}
