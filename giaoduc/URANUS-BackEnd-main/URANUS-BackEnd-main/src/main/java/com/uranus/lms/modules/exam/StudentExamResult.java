package com.uranus.lms.modules.exam;

import com.uranus.lms.modules.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.hibernate.type.SqlTypes;
import com.uranus.lms.modules.exam.dto.ExamSnapshotDto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "student_exam_results")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentExamResult {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Version
    private Long version;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false, foreignKey = @ForeignKey(name = "fk_student_exam_results_exam"))
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Exam exam;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "total_score")
    private Double totalScore;

    @Column(name = "is_passed")
    private Boolean isPassed;

    @Column(name = "cheat_warning_count")
    @Builder.Default
    private Integer cheatWarningCount = 0;

    @Column(name = "cheat_details", columnDefinition = "TEXT")
    private String cheatDetails;

    /** Email để gửi kết quả sau khi nộp bài (nhập ở PreExamScreen) */
    @Column(name = "notify_email", length = 255)
    private String notifyEmail;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "exam_snapshot", columnDefinition = "jsonb")
    private ExamSnapshotDto examSnapshot;

    @OneToMany(mappedBy = "result", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<StudentAnswer> answers = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
