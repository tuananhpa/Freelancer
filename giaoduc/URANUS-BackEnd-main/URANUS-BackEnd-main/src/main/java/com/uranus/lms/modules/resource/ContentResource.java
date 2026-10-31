package com.uranus.lms.modules.resource;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.uranus.lms.modules.exam.Exam;
import com.uranus.lms.modules.folder.ContentFolder;
import com.uranus.lms.modules.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "content_resources")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContentResource {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    /**
     * DOCUMENT, VIDEO, EXAM, SLIDE, AUDIO
     */
    @Column(name = "resource_type", nullable = false, length = 50)
    private String resourceType;

    /**
     * KHOI_1 ... KHOI_12, KHAC
     */
    @Column(nullable = false, length = 50)
    private String grade;

    /**
     * TOAN, VAN, TIENG_ANH, VAT_LY, HOA_HOC, SINH_HOC, TIN_HOC, KHTN, GDCD, KHAC
     */
    @Column(nullable = false, length = 50)
    private String subject;

    /**
     * KET_NOI_TRI_THUC, CANH_DIEU, CHAN_TROI_SANG_TAO, KHAC
     */
    @Column(name = "curriculum_book", length = 100)
    private String curriculumBook;

    /**
     * Tên Giáo viên / Người soạn (Cho phép Trợ giảng nhập tên GV)
     */
    @Column(name = "author_name")
    private String authorName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploader_id", nullable = false)
    private User uploader;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "folder_id")
    private ContentFolder folder;

    @Column(name = "file_url", columnDefinition = "TEXT")
    private String fileUrl;

    @Column(name = "external_url", columnDefinition = "TEXT")
    private String externalUrl;

    @Column(name = "file_name")
    private String fileName;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "file_format", length = 50)
    private String fileFormat;

    /**
     * Đề thi đính kèm cho bài nghe (Audio Listening Quiz)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attached_exam_id")
    private Exam attachedExam;

    @Column(name = "audio_transcript", columnDefinition = "TEXT")
    private String audioTranscript;

    @Column(name = "learning_outcomes", columnDefinition = "TEXT")
    private String learningOutcomes;

    /**
     * De bai viet (tu luan) neu co - hoc sinh go noi dung vao khung va nop
     * qua ResourceSubmission, giao vien cham tay (khong dung AI).
     */
    @Column(name = "writing_prompt", columnDefinition = "TEXT")
    private String writingPrompt;

    @Column(length = 500)
    private String tags;

    @Column(name = "is_public")
    @Builder.Default
    private Boolean isPublic = true;

    @Column(name = "view_count")
    @Builder.Default
    private Long viewCount = 0L;

    @Column(name = "like_count")
    @Builder.Default
    private Long likeCount = 0L;

    @Column(name = "bookmark_count")
    @Builder.Default
    private Long bookmarkCount = 0L;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
