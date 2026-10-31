package com.uranus.lms.modules.gamification;

import com.uranus.lms.modules.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

import org.springframework.data.domain.Persistable;

@Entity
@Table(name = "user_gamification")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserGamification implements Persistable<UUID> {

    @Id
  @Column(name = "user_id")
    private UUID userId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;

    @Transient
    @Builder.Default
    private boolean isNew = false;

    @Override
    public UUID getId() {
        return userId;
    }

    @Override
    public boolean isNew() {
        return isNew;
    }

    @PrePersist
    @PostLoad
    void markNotNew() {
        this.isNew = false;
    }

    @Column(name = "total_xp")
    @Builder.Default
    private Integer totalXp = 0;

    @Column(name = "current_streak")
    @Builder.Default
    private Integer currentStreak = 0;

    @Column(name = "longest_streak")
    @Builder.Default
    private Integer longestStreak = 0;

    @Column(name = "last_activity_date")
    private LocalDate lastActivityDate;

    @Column(columnDefinition = "TEXT")
    @Builder.Default
    private String badges = "[]";
}
