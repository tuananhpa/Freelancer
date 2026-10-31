package com.uranus.lms.modules.learningpath;

import com.uranus.lms.modules.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "placement_results")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlacementResult {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "skill_scores", columnDefinition = "TEXT", nullable = false)
    private String skillScores;

    @Column(name = "recommended_level")
    private String recommendedLevel;

    @CreationTimestamp
    @Column(name = "completed_at", updatable = false)
    private LocalDateTime completedAt;
}
