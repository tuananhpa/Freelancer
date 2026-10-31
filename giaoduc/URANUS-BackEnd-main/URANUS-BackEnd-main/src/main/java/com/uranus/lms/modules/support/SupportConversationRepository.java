package com.uranus.lms.modules.support;

import com.uranus.lms.modules.user.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SupportConversationRepository extends JpaRepository<SupportConversation, UUID> {

    @EntityGraph(attributePaths = {"requester", "assignee"})
    Optional<SupportConversation> findByGuestToken(String guestToken);

    @EntityGraph(attributePaths = {"requester", "assignee"})
    Optional<SupportConversation> findById(UUID id);

    /** Hoi thoai dang mo gan nhat cua mot user - de khong tao trung moi lan mo widget. */
    @EntityGraph(attributePaths = {"requester", "assignee"})
    Optional<SupportConversation> findFirstByRequesterAndStatusNotOrderByCreatedAtDesc(User requester, SupportStatus status);

    /**
     * Hop thu cua ho tro vien. JOIN FETCH de tranh N+1 khi render danh sach.
     *
     * Moi lan hoc vien mo widget ho tro, he thong tao san mot hoi thoai rong de
     * ho nhan duoc ngay. Nhung hoi thoai do chua co tin nhan nao, hien het len
     * hop thu thi ho tro vien khong con phan biet duoc ai that su can giup.
     * Vi vay mac dinh chi lay hoi thoai da co it nhat mot tin nhan
     * (lastMessageAt duoc gan khi tin dau tien duoc gui); truyen
     * includeEmpty = true khi can xem lai ca nhung hoi thoai rong.
     */
    @Query("""
            SELECT c FROM SupportConversation c
            LEFT JOIN FETCH c.requester
            LEFT JOIN FETCH c.assignee
            WHERE c.lastMessageAt IS NOT NULL OR :includeEmpty = TRUE
            ORDER BY COALESCE(c.lastMessageAt, c.createdAt) DESC
            """)
    List<SupportConversation> findInbox(@Param("includeEmpty") boolean includeEmpty);

    @Query("""
            SELECT c FROM SupportConversation c
            LEFT JOIN FETCH c.requester
            LEFT JOIN FETCH c.assignee
            WHERE c.status = :status
              AND (c.lastMessageAt IS NOT NULL OR :includeEmpty = TRUE)
            ORDER BY COALESCE(c.lastMessageAt, c.createdAt) DESC
            """)
    List<SupportConversation> findInboxByStatus(@Param("status") SupportStatus status,
                                                @Param("includeEmpty") boolean includeEmpty);

    long countByStatus(SupportStatus status);
}
