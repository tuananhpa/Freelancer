package com.uranus.lms.modules.support;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface SupportMessageRepository extends JpaRepository<SupportMessage, UUID> {

    /** JOIN FETCH sender: danh sach tin nhan luon can ten/avatar nguoi gui. */
    @Query("""
            SELECT m FROM SupportMessage m
            LEFT JOIN FETCH m.sender
            WHERE m.conversation.id = :conversationId
            ORDER BY m.sentAt ASC
            """)
    List<SupportMessage> findByConversation(@Param("conversationId") UUID conversationId);

    long countByConversationIdAndSenderRoleAndReadAtIsNull(UUID conversationId, SupportSenderRole senderRole);

    /**
     * Dem tin chua doc cho NHIEU hoi thoai trong mot cau truy van.
     *
     * Truoc day hop thu goi countBy... cho tung hoi thoai, 94 hoi thoai la 94
     * vong xuong DB chi de ve mot con so. Tra ve [conversationId, count].
     */
    @Query("""
            SELECT m.conversation.id, COUNT(m) FROM SupportMessage m
            WHERE m.conversation.id IN :conversationIds
              AND m.senderRole = :senderRole
              AND m.readAt IS NULL
            GROUP BY m.conversation.id
            """)
    List<Object[]> countUnreadGrouped(@Param("conversationIds") Collection<UUID> conversationIds,
                                     @Param("senderRole") SupportSenderRole senderRole);

    /**
     * So hoi thoai dang co tin chua doc tu nguoi hoi - dung cho huy hieu tren
     * muc "Ho tro" o thanh ben.
     *
     * Dem theo HOI THOAI chu khong theo tin nhan: mot hoc vien nhan lien tiep 5
     * cau van chi la mot nguoi dang cho, hien "5" se lam ho tro vien hieu nham.
     * Hoi thoai da dong thi khong tinh nua.
     */
    @Query("""
            SELECT COUNT(DISTINCT m.conversation.id) FROM SupportMessage m
            WHERE m.senderRole = :senderRole
              AND m.readAt IS NULL
              AND m.conversation.status <> :excludedStatus
            """)
    long countConversationsWithUnread(@Param("senderRole") SupportSenderRole senderRole,
                                      @Param("excludedStatus") SupportStatus excludedStatus);

    /**
     * Tin nhan moi nhat cua moi hoi thoai - dung lam dong preview trong hop thu.
     *
     * Neu hai tin cung sentAt (hiem, nhung co the xay ra khi gui lien tiep) thi
     * cau nay tra ve ca hai; ben goi giu lai mot ban ghi cho moi hoi thoai.
     */
    @Query("""
            SELECT m FROM SupportMessage m
            JOIN FETCH m.conversation
            WHERE m.conversation.id IN :conversationIds
              AND m.sentAt = (
                    SELECT MAX(m2.sentAt) FROM SupportMessage m2
                    WHERE m2.conversation.id = m.conversation.id
              )
            """)
    List<SupportMessage> findLastMessages(@Param("conversationIds") Collection<UUID> conversationIds);

    @Modifying
    @Query("""
            UPDATE SupportMessage m SET m.readAt = :now
            WHERE m.conversation.id = :conversationId
              AND m.senderRole <> :readerRole
              AND m.readAt IS NULL
            """)
    void markRead(@Param("conversationId") UUID conversationId,
                  @Param("readerRole") SupportSenderRole readerRole,
                  @Param("now") LocalDateTime now);
}
