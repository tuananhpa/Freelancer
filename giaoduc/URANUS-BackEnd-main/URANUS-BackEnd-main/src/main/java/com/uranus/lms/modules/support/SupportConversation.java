package com.uranus.lms.modules.support;

import com.uranus.lms.modules.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Mot hoi thoai ho tro. Nguoi mo hoi thoai la user da dang nhap (requester)
 * HOAC khach vang lai (guestToken) - luon dung dung mot trong hai, DB co CHECK rang buoc.
 */
@Entity
@Table(name = "support_conversations")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupportConversation {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id")
    private User requester;

    /** Bi mat cua khach vang lai: la thu duy nhat chung minh quyen truy cap hoi thoai nay. */
    @Column(name = "guest_token", length = 64, unique = true)
    private String guestToken;

    @Column(name = "guest_name", length = 150)
    private String guestName;

    @Column(name = "guest_contact", length = 150)
    private String guestContact;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_id")
    private User assignee;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private SupportStatus status = SupportStatus.OPEN;

    @Column(length = 255)
    private String subject;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "last_message_at")
    private LocalDateTime lastMessageAt;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    /** Ten hien thi cho ho tro vien: uu tien ten tai khoan, roi den ten khach tu khai. */
    public String displayName() {
        if (requester != null) return requester.getFullName();
        return guestName != null && !guestName.isBlank() ? guestName : "Khach vang lai";
    }
}
