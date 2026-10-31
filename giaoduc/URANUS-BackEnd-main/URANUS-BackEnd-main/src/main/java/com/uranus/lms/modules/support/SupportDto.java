package com.uranus.lms.modules.support;

import lombok.Builder;

import java.time.LocalDateTime;
import java.util.UUID;

public class SupportDto {

    @Builder
    public record MessageDto(
            UUID id,
            UUID conversationId,
            String content,
            String imageUrl,
            SupportSenderRole senderRole,
            UUID senderId,
            String senderName,
            String senderAvatar,
            LocalDateTime sentAt,
            LocalDateTime readAt
    ) {}

    @Builder
    public record ConversationDto(
            UUID id,
            SupportStatus status,
            String subject,
            String displayName,
            UUID requesterId,
            String requesterAvatar,
            String guestContact,
            UUID assigneeId,
            String assigneeName,
            LocalDateTime createdAt,
            LocalDateTime lastMessageAt,
            long unreadFromRequester,
            /** Trich doan tin nhan cuoi de hop thu hien duoc nhu Messenger. */
            String lastMessagePreview,
            /** true khi tin cuoi do ho tro vien gui - giao dien hien tien to "Ban: ". */
            Boolean lastMessageFromAgent,
            /** Hoi thoai rong (chi vua mo widget, chua nhan gi) thi khong lam roi hop thu. */
            boolean hasMessages
    ) {}

    /** Tra ve khi khach vang lai mo hoi thoai lan dau. */
    @Builder
    public record GuestSessionDto(
            String guestToken,
            ConversationDto conversation
    ) {}

    public record StartRequest(String guestName, String guestContact, String subject, String content) {}

    /** Bao cho nguoi gui biet tin nhan cua ho da duoc doc. */
    @Builder
    public record ReadReceipt(UUID conversationId, SupportSenderRole readerRole, LocalDateTime readAt) {}

    public record SendRequest(String content, String imageUrl) {}

    @Builder
    public record TypingEvent(
            UUID conversationId,
            SupportSenderRole senderRole,
            String senderName,
            boolean isTyping
    ) {}

    public record TypingRequest(boolean isTyping) {}
}
