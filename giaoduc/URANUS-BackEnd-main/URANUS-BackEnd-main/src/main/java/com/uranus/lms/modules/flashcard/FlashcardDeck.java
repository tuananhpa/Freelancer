package com.uranus.lms.modules.flashcard;

import com.uranus.lms.modules.user.User;
import com.uranus.lms.modules.folder.ContentFolder;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Table(name = "flashcard_decks")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FlashcardDeck {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "visibility", length = 20)
    @Builder.Default
    private com.uranus.lms.modules.access.Visibility visibility = com.uranus.lms.modules.access.Visibility.PUBLIC;

    @Column(name = "access_code", length = 100)
    private String accessCode;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "folder_id", foreignKey = @ForeignKey(name = "fk_flashcard_decks_folder"))
    @OnDelete(action = OnDeleteAction.SET_NULL)
    private ContentFolder folder;

    @OneToMany(mappedBy = "deck", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Flashcard> cards = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    /** Tags phân cách bằng dấu phẩy (VD: "Grammar,Vocabulary,IELTS") */
    @Column(name = "tags", length = 500)
    private String tags;

    @Column(name = "deck_type", length = 20)
    @Builder.Default
    private String deckType = "FLASHCARD";

    @Column(name = "subject", length = 100)
    private String subject;

    @Column(name = "views_count")
    @Builder.Default
    private Integer viewsCount = 0;

    @Column(name = "saves_count")
    @Builder.Default
    private Integer savesCount = 0;

    @Column(name = "shares_count")
    @Builder.Default
    private Integer sharesCount = 0;

    @Column(name = "image_url", length = 1000)
    private String imageUrl;

    @Transient
    private UUID folderId;

    @Transient
    private String folderName;

    /** Số học viên đã học deck này (computed, not persisted) */
    @Transient
    private long learnerCount;

    @Column(name = "average_rating", columnDefinition = "numeric")
    @Builder.Default
    private Double averageRating = 0.0;

    @Column(name = "rating_count")
    @Builder.Default
    private Integer ratingCount = 0;

    @Transient
    private Integer myRating;

    @Transient
    private String accessLevel;

    @Transient
    private Boolean locked;

    @Transient
    private Integer previewRank;

    @Transient
    private String unlockHint;

    @com.fasterxml.jackson.annotation.JsonProperty("ownerId")
    public String getOwnerId() {
        return owner != null ? owner.getId().toString() : null;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("ownerName")
    public String getOwnerName() {
        return owner != null ? owner.getFullName() : null;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("ownerAvatar")
    public String getOwnerAvatar() {
        return owner != null ? owner.getAvatarUrl() : null;
    }
}
