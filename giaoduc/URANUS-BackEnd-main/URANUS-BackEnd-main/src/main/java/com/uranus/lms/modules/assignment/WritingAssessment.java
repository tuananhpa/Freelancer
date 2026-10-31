package com.uranus.lms.modules.assignment;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.uranus.lms.modules.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "writing_assessments", indexes = {
        @Index(name = "idx_writing_assessments_assignment", columnList = "assignment_id"),
        @Index(name = "idx_writing_assessments_student", columnList = "student_id"),
        @Index(name = "idx_writing_assessments_status", columnList = "status")
})
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WritingAssessment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @JsonIgnore
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_id", nullable = false, unique = true)
    private AssignmentSubmission submission;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    private Assignment assignment;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Column(length = 30, nullable = false)
    @Builder.Default
    private String status = "NOT_GRADED"; // NOT_GRADED, QUEUED, GRADING, COMPLETED, FAILED, TEACHER_EDITED

    @Column(name = "overall_score")
    private Double overallScore;

    @Column(name = "max_score")
    private Double maxScore;

    @Column(name = "word_count")
    private Integer wordCount;

    @Column(name = "expected_level", length = 20)
    private String expectedLevel;

    @Column(name = "estimated_level", length = 20)
    private String estimatedLevel;

    @Column(name = "original_ai_result_json", columnDefinition = "TEXT")
    private String originalAiResultJson;

    @Column(name = "current_result_json", columnDefinition = "TEXT")
    private String currentResultJson;

    @Column(nullable = false)
    @Builder.Default
    private Integer version = 1;

    @Column(name = "ai_model", length = 50)
    private String aiModel;

    @Column(name = "prompt_version", length = 20)
    private String promptVersion;

    @Column(name = "schema_version", length = 20)
    @Builder.Default
    private String schemaVersion = "1.0";

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "last_edited_at")
    private LocalDateTime lastEditedAt;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "last_edited_by")
    private User lastEditedBy;
}
