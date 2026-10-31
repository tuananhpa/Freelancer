package com.uranus.lms.modules.support;

import com.uranus.lms.config.WebSocketAuthChannelInterceptor;
import com.uranus.lms.modules.notification.NotificationService;
import com.uranus.lms.modules.user.Role;
import com.uranus.lms.modules.user.User;
import com.uranus.lms.modules.user.UserRepository;
import com.uranus.lms.modules.user.UserStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.uranus.lms.common.exception.AppException;
import com.uranus.lms.common.exception.ErrorCode;
import com.uranus.lms.exception.BadRequestException;
import com.uranus.lms.exception.ResourceNotFoundException;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SupportService {

    private static final String AGENT_TOPIC = "/topic/support.agents";
    private static final String AGENT_MESSAGE_TOPIC = "/topic/support.agents.messages";
    private static final String USER_QUEUE = "/queue/support";
    private static final String USER_QUEUE_READ = "/queue/support.read";
    private static final String USER_QUEUE_TYPING = "/queue/support.typing";
    public static final String AGENT_TYPING_TOPIC = "/topic/support.agents.typing";
    private static final String AGENT_READ_TOPIC = "/topic/support.agents.read";

    /**
     * Chong spam: so hoi thoai moi toi da tren mot IP trong mot gio.
     *
     * Dem theo IP nen nhieu nguoi dung chung mot duong mang (truong hoc, van
     * phong, hoac NAT cua nha mang di dong) se an chung han muc nay. Dat qua
     * thap la chan nham khach that, nen de chinh duoc qua bien moi truong.
     */
    @org.springframework.beans.factory.annotation.Value("${app.support.max-new-conversations-per-hour:10}")
    private int maxNewConversationsPerIpPerHour;
    private static final int MAX_CONTENT_LENGTH = 4000;

    /**
     * Khach nhan lien tuc 10 tin thi khong dong 10 thong bao vao chuong cua CSKH.
     * Trong khoang nay chi bao mot lan cho moi hoi thoai.
     */
    private static final Duration NOTIFY_COOLDOWN = Duration.ofMinutes(10);
    private static final int NOTIFY_PREVIEW_LENGTH = 120;
    private static final String SUPPORT_INBOX_LINK = "/support/inbox";

    /** Anh dinh kem: chi cho anh, toi da 5MB - endpoint nay mo cho ca khach vang lai. */
    private static final long MAX_IMAGE_BYTES = 5L * 1024 * 1024;
    private static final String SUPPORT_UPLOAD_FOLDER = "uranus_support";

    private final SupportConversationRepository conversationRepository;
    private final SupportMessageRepository messageRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final RedisTemplate<String, Object> redisTemplate;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final com.uranus.lms.modules.media.CloudinaryService cloudinaryService;
    private final SecureRandom secureRandom = new SecureRandom();

    // ------------------------------------------------------------------ mo hoi thoai

    /**
     * Nguoi dung da dang nhap: tai su dung hoi thoai chua dong, tranh de rac hop thu CSKH.
     */
    @Transactional
    public SupportDto.ConversationDto openForUser(User user, SupportDto.StartRequest request) {
        SupportConversation conversation = conversationRepository
                .findFirstByRequesterAndStatusNotOrderByCreatedAtDesc(user, SupportStatus.CLOSED)
                .orElseGet(() -> conversationRepository.save(SupportConversation.builder()
                        .requester(user)
                        .subject(trimSubject(request != null ? request.subject() : null))
                        .status(SupportStatus.OPEN)
                        .build()));
        // Co y KHONG goi notifyAgents() o day. Hoi thoai nay duoc tao ngay khi hoc
        // vien mo widget, luc do ho chua noi gi ca. Bao ngay lam hop thu CSKH day
        // nhung dong "vua dang nhap" va che mat nguoi thuc su can giup. Ho tro vien
        // se duoc bao khi tin nhan dau tien duoc gui (xem sendMessage).

        return toDto(conversation);
    }

    /**
     * Khach vang lai: sinh guest token va mot hoi thoai moi.
     * Token la bi mat duy nhat cho phep truy cap hoi thoai nay nen phai du ngau nhien.
     */
    @Transactional
    public SupportDto.GuestSessionDto openForGuest(SupportDto.StartRequest request, String clientIp) {
        // Kiem tra du lieu truoc, tru quota sau: nguoi dien thieu thong tin vai lan
        // khong dang bi khoa mot tieng du chua tao duoc hoi thoai nao.
        if (request == null || !hasText(request.guestName()) || !hasText(request.guestContact())) {
            throw new BadRequestException("Vui lòng cho biết tên và một cách liên hệ (email hoặc số điện thoại).");
        }

        enforceGuestQuota(clientIp);

        String guestToken = generateGuestToken();
        SupportConversation conversation = conversationRepository.save(SupportConversation.builder()
                .guestToken(guestToken)
                .guestName(request.guestName().trim())
                .guestContact(request.guestContact().trim())
                .subject(trimSubject(request.subject()))
                .status(SupportStatus.OPEN)
                .build());

        // Nhu openForUser: cho den khi khach gui tin dau tien moi bao cho CSKH.

        return SupportDto.GuestSessionDto.builder()
                .guestToken(guestToken)
                .conversation(toDto(conversation))
                .build();
    }

    /** Khach dang nhap sau khi da chat: gan hoi thoai vao tai khoan, giu nguyen lich su. */
    @Transactional
    public SupportDto.ConversationDto claimGuestConversation(String guestToken, User user) {
        SupportConversation conversation = conversationRepository.findByGuestToken(guestToken)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hội thoại."));

        conversation.setRequester(user);
        conversation.setGuestToken(null); // CHECK trong DB yeu cau dung mot trong hai danh tinh
        conversationRepository.save(conversation);

        return toDto(conversation);
    }

    // ------------------------------------------------------------------ doc / gui

    @Transactional(readOnly = true)
    public SupportDto.ConversationDto getConversation(UUID conversationId, User currentUser, String guestToken) {
        return toDto(loadAccessible(conversationId, currentUser, guestToken));
    }

    @Transactional
    public List<SupportDto.MessageDto> listMessages(UUID conversationId, User currentUser, String guestToken) {
        SupportConversation conversation = loadAccessible(conversationId, currentUser, guestToken);

        // Danh dau da doc phia nguoi dang xem
        SupportSenderRole readerRole = isAgent(currentUser) && !isRequester(conversation, currentUser, guestToken)
                ? SupportSenderRole.AGENT
                : SupportSenderRole.REQUESTER;
        LocalDateTime now = LocalDateTime.now();
        messageRepository.markRead(conversationId, readerRole, now);
        pushReadReceipt(conversation, readerRole, now);

        return messageRepository.findByConversation(conversationId).stream()
                .map(this::toDto)
                .toList();
    }

    /**
     * Tai anh dinh kem cho mot hoi thoai.
     * Kiem tra quyen truy cap TRUOC khi upload, neu khong endpoint nay thanh cho
     * bat ky ai cung day file len Cloudinary duoc.
     */
    @Transactional(readOnly = true)
    public String uploadAttachment(UUID conversationId, User currentUser, String guestToken,
                                   org.springframework.web.multipart.MultipartFile file) {
        SupportConversation conversation = loadAccessible(conversationId, currentUser, guestToken);

        if (conversation.getStatus() == SupportStatus.CLOSED) {
            throw new BadRequestException("Hội thoại đã đóng.");
        }
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Chưa chọn tệp.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new BadRequestException("Chỉ hỗ trợ gửi hình ảnh.");
        }
        if (file.getSize() > MAX_IMAGE_BYTES) {
            throw new BadRequestException("Ảnh vượt quá 5MB.");
        }

        try {
            return cloudinaryService.uploadFile(file, SUPPORT_UPLOAD_FOLDER);
        } catch (java.io.IOException e) {
            log.error("Upload anh ho tro that bai: {}", e.getMessage());
            throw new BadRequestException("Không tải được ảnh lên. Vui lòng thử lại.");
        }
    }

    @Transactional
    public SupportDto.MessageDto sendMessage(UUID conversationId, User currentUser, String guestToken,
                                             String content, String imageUrl) {
        // Tin nhan phai co chu hoac anh, khong duoc rong ca hai
        if (!hasText(content) && !hasText(imageUrl)) {
            throw new BadRequestException("Nội dung tin nhắn không được để trống.");
        }
        if (hasText(content) && content.length() > MAX_CONTENT_LENGTH) {
            throw new BadRequestException("Tin nhắn quá dài.");
        }

        SupportConversation conversation = loadAccessible(conversationId, currentUser, guestToken);

        if (conversation.getStatus() == SupportStatus.CLOSED) {
            throw new BadRequestException("Hội thoại đã đóng.");
        }

        boolean fromRequester = isRequester(conversation, currentUser, guestToken);
        SupportSenderRole role = fromRequester ? SupportSenderRole.REQUESTER : SupportSenderRole.AGENT;

        // saveAndFlush: @CreationTimestamp chi duoc gan luc flush, neu chi save()
        // thi sentAt con null trong DTO tra ve va giao dien hien "Invalid Date".
        SupportMessage message = messageRepository.saveAndFlush(SupportMessage.builder()
                .conversation(conversation)
                .sender(currentUser)
                .senderRole(role)
                // Chuoi rong thay vi null: tin nhan chi co anh khong duoc phu thuoc
                // vao viec cot content co cho null hay khong.
                .content(hasText(content) ? content.trim() : "")
                .imageUrl(hasText(imageUrl) ? imageUrl.trim() : null)
                .build());

        conversation.setLastMessageAt(LocalDateTime.now());
        // Ho tro vien tra loi dau tien thi tu dong nhan case
        if (!fromRequester && conversation.getAssignee() == null && currentUser != null) {
            conversation.setAssignee(currentUser);
            conversation.setStatus(SupportStatus.ASSIGNED);
        }
        conversationRepository.save(conversation);

        SupportDto.MessageDto dto = toDto(message);
        pushToRequester(conversation, dto);
        // Ho tro vien dang mo hoi thoai can thay tin nhan ngay, khong chi thay dong cap nhat
        messagingTemplate.convertAndSend(AGENT_MESSAGE_TOPIC, dto);
        notifyAgents(conversation, message);

        // WebSocket chi toi duoc nguoi dang mo san trang hop thu. Them thong bao
        // luu vao DB de CSKH dong tab van thay khi quay lai.
        if (fromRequester) {
            notifyStaffOfNewMessage(conversation, hasText(content) ? content.trim() : "[Hình ảnh]");
        }

        return dto;
    }

    // ------------------------------------------------------------------ phia ho tro vien

    /**
     * Hop thu CSKH.
     *
     * Mac dinh bo qua hoi thoai chua co tin nhan nao: chung duoc tao tu dong luc
     * hoc vien mo widget nen khong phan anh nhu cau ho tro nao ca.
     * includeEmpty = true de xem lai toan bo khi can doi soat.
     */
    @Transactional(readOnly = true)
    public List<SupportDto.ConversationDto> inbox(SupportStatus status, boolean includeEmpty) {
        List<SupportConversation> conversations = status == null
                ? conversationRepository.findInbox(includeEmpty)
                : conversationRepository.findInboxByStatus(status, includeEmpty);

        if (conversations.isEmpty()) {
            return List.of();
        }

        // Gom thanh hai truy van cho ca danh sach thay vi hai truy van moi dong.
        List<UUID> ids = conversations.stream().map(SupportConversation::getId).toList();
        Map<UUID, Long> unreadCounts = new HashMap<>();
        for (Object[] row : messageRepository.countUnreadGrouped(ids, SupportSenderRole.REQUESTER)) {
            unreadCounts.put((UUID) row[0], (Long) row[1]);
        }
        Map<UUID, SupportMessage> lastMessages = new HashMap<>();
        for (SupportMessage m : messageRepository.findLastMessages(ids)) {
            lastMessages.putIfAbsent(m.getConversation().getId(), m);
        }

        return conversations.stream()
                .map(c -> toDto(c, unreadCounts.getOrDefault(c.getId(), 0L), lastMessages.get(c.getId())))
                .toList();
    }

    /** So hoi thoai dang cho ho tro vien tra loi. */
    @Transactional(readOnly = true)
    public long unreadConversationCount() {
        return messageRepository.countConversationsWithUnread(SupportSenderRole.REQUESTER, SupportStatus.CLOSED);
    }

    @Transactional
    public SupportDto.ConversationDto assign(UUID conversationId, User agent) {
        SupportConversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hội thoại."));
        conversation.setAssignee(agent);
        conversation.setStatus(SupportStatus.ASSIGNED);
        conversationRepository.save(conversation);
        notifyAgents(conversation);
        return toDto(conversation);
    }

    @Transactional
    public SupportDto.ConversationDto close(UUID conversationId) {
        SupportConversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hội thoại."));
        conversation.setStatus(SupportStatus.CLOSED);
        conversation.setClosedAt(LocalDateTime.now());
        conversationRepository.save(conversation);
        notifyAgents(conversation);
        return toDto(conversation);
    }

    // ------------------------------------------------------------------ noi bo

    /**
     * Kiem tra quyen truy cap: chu hoi thoai (user hoac dung guest token) hoac ho tro vien.
     */
    private SupportConversation loadAccessible(UUID conversationId, User currentUser, String guestToken) {
        SupportConversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hội thoại."));

        if (isRequester(conversation, currentUser, guestToken) || isAgent(currentUser)) {
            return conversation;
        }
        throw new AccessDeniedException("Bạn không có quyền xem hội thoại này.");
    }

    private boolean isRequester(SupportConversation conversation, User currentUser, String guestToken) {
        if (currentUser != null && conversation.getRequester() != null) {
            return conversation.getRequester().getId().equals(currentUser.getId());
        }
        if (hasText(guestToken) && hasText(conversation.getGuestToken())) {
            // So sanh khong phu thuoc thoi gian: guest token la bi mat
            return java.security.MessageDigest.isEqual(
                    guestToken.getBytes(java.nio.charset.StandardCharsets.UTF_8),
                    conversation.getGuestToken().getBytes(java.nio.charset.StandardCharsets.UTF_8));
        }
        return false;
    }

    private boolean isAgent(User user) {
        return user != null && (user.getRole() == Role.OFFICE || user.getRole() == Role.ADMIN);
    }

    private void pushToRequester(SupportConversation conversation, SupportDto.MessageDto dto) {
        String principal = conversation.getRequester() != null
                ? conversation.getRequester().getEmail()
                : WebSocketAuthChannelInterceptor.GUEST_PREFIX + conversation.getGuestToken();
        if (principal != null) {
            messagingTemplate.convertAndSendToUser(principal, USER_QUEUE, dto);
        }
    }

    /** Ben con lai can biet tin nhan cua ho da duoc xem, de hien trang thai "Da xem". */
    private void pushReadReceipt(SupportConversation conversation, SupportSenderRole readerRole, LocalDateTime readAt) {
        SupportDto.ReadReceipt receipt = SupportDto.ReadReceipt.builder()
                .conversationId(conversation.getId())
                .readerRole(readerRole)
                .readAt(readAt)
                .build();

        if (readerRole == SupportSenderRole.AGENT) {
            // Ho tro vien vua doc -> bao cho nguoi dung
            String principal = conversation.getRequester() != null
                    ? conversation.getRequester().getEmail()
                    : WebSocketAuthChannelInterceptor.GUEST_PREFIX + conversation.getGuestToken();
            if (principal != null) {
                messagingTemplate.convertAndSendToUser(principal, USER_QUEUE_READ, receipt);
            }
        } else {
            messagingTemplate.convertAndSend(AGENT_READ_TOPIC, receipt);
        }
    }

    public void handleTyping(UUID conversationId, User currentUser, String guestToken, boolean isTyping) {
        SupportConversation conversation = conversationRepository.findById(conversationId).orElse(null);
        if (conversation == null) return;

        boolean fromRequester = isRequester(conversation, currentUser, guestToken);
        SupportSenderRole role = fromRequester ? SupportSenderRole.REQUESTER : SupportSenderRole.AGENT;
        String senderName = currentUser != null ? currentUser.getFullName() : (conversation.getRequester() != null ? conversation.getRequester().getFullName() : "Khách");

        SupportDto.TypingEvent event = SupportDto.TypingEvent.builder()
                .conversationId(conversationId)
                .senderRole(role)
                .senderName(senderName)
                .isTyping(isTyping)
                .build();

        if (fromRequester) {
            messagingTemplate.convertAndSend(AGENT_TYPING_TOPIC, event);
        } else {
            String principal = conversation.getRequester() != null
                    ? conversation.getRequester().getEmail()
                    : WebSocketAuthChannelInterceptor.GUEST_PREFIX + conversation.getGuestToken();
            if (principal != null) {
                messagingTemplate.convertAndSendToUser(principal, USER_QUEUE_TYPING, event);
            }
        }
    }

    public void handleTypingWithPrincipal(UUID conversationId, String principalName, boolean isTyping) {
        if (principalName == null) return;
        String guestToken = null;
        User user = null;
        if (principalName.startsWith(WebSocketAuthChannelInterceptor.GUEST_PREFIX)) {
            guestToken = principalName.substring(WebSocketAuthChannelInterceptor.GUEST_PREFIX.length());
        } else {
            user = userRepository.findByEmail(principalName).orElse(null);
        }
        handleTyping(conversationId, user, guestToken, isTyping);
    }

    private void notifyAgents(SupportConversation conversation) {
        notifyAgents(conversation, null);
    }

    /**
     * Day ban cap nhat hoi thoai xuong hop thu dang mo.
     *
     * Truyen kem lastMessage khi vua co tin moi, de dong preview ben hop thu doi
     * theo ngay thay vi phai tai lai ca danh sach.
     */
    private void notifyAgents(SupportConversation conversation, SupportMessage lastMessage) {
        long unread = messageRepository
                .countByConversationIdAndSenderRoleAndReadAtIsNull(conversation.getId(), SupportSenderRole.REQUESTER);
        messagingTemplate.convertAndSend(AGENT_TOPIC, toDto(conversation, unread, lastMessage));
    }

    /**
     * Bao cho bo phan ho tro khi khach nhan tin.
     *
     * Hoi thoai da co nguoi phu trach thi chi bao rieng nguoi do, tranh lam phien
     * ca nhom. Chua ai nhan thi bao toan bo OFFICE va ADMIN dang hoat dong.
     */
    private void notifyStaffOfNewMessage(SupportConversation conversation, String content) {
        // Tin nay la tin chua doc DAU TIEN cua hoi thoai (moi tin truoc do deu da
        // duoc doc) thi luon bao - do la mot luot hoi moi, khong phai spam.
        // Nhan don dap khi chua ai kip doc thi moi gop lai theo NOTIFY_COOLDOWN.
        long unreadFromRequester = messageRepository
                .countByConversationIdAndSenderRoleAndReadAtIsNull(conversation.getId(), SupportSenderRole.REQUESTER);
        boolean startsNewRound = unreadFromRequester <= 1;

        // Goi shouldNotify trong moi truong hop de khoa cooldown luon duoc dat lai.
        boolean withinQuota = shouldNotify(conversation.getId());
        if (!startsNewRound && !withinQuota) {
            return;
        }

        List<User> recipients = conversation.getAssignee() != null
                ? List.of(conversation.getAssignee())
                : userRepository.findByRoleInAndStatus(List.of(Role.OFFICE, Role.ADMIN), UserStatus.ACTIVE);

        if (recipients.isEmpty()) {
            log.warn("Co tin nhan ho tro moi nhung khong co tai khoan OFFICE/ADMIN nao de bao. "
                    + "conversationId={}", conversation.getId());
            return;
        }

        String title = "Tin nhắn hỗ trợ mới";
        String body = conversation.displayName() + ": " + preview(content);
        // Kem id hoi thoai de bam vao thong bao la mo dung khung chat cua nguoi do,
        // thay vi do ve hop thu roi phai tu tim lai dong nao vua nhan.
        String link = SUPPORT_INBOX_LINK + "?c=" + conversation.getId();

        for (User recipient : recipients) {
            try {
                notificationService.sendNotification(recipient, title, body, link);
            } catch (Exception e) {
                // Mot nguoi nhan loi thi khong duoc lam hong viec gui tin nhan
                log.error("Khong bao duoc cho {}: {}", recipient.getId(), e.getMessage());
            }
        }
    }

    /** Mot hoi thoai chi sinh mot thong bao trong moi NOTIFY_COOLDOWN. */
    private boolean shouldNotify(UUID conversationId) {
        try {
            Boolean first = redisTemplate.opsForValue()
                    .setIfAbsent("support:notified:" + conversationId, "1", NOTIFY_COOLDOWN);
            return Boolean.TRUE.equals(first);
        } catch (Exception e) {
            // Redis chet thi tha bao trung con hon im lang
            log.warn("Khong kiem tra duoc cooldown thong bao: {}", e.getMessage());
            return true;
        }
    }

    private String preview(String content) {
        String flat = content.replaceAll("\\s+", " ").trim();
        return flat.length() > NOTIFY_PREVIEW_LENGTH
                ? flat.substring(0, NOTIFY_PREVIEW_LENGTH) + "…"
                : flat;
    }

    private void enforceGuestQuota(String clientIp) {
        String key = "support:new_conv:" + clientIp;
        Long count = redisTemplate.opsForValue().increment(key);
        if (count != null && count == 1L) {
            redisTemplate.expire(key, Duration.ofHours(1));
        }
        if (count != null && count > maxNewConversationsPerIpPerHour) {
            throw new AppException(ErrorCode.SUPPORT_RATE_LIMITED);
        }
    }

    private String generateGuestToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String trimSubject(String subject) {
        if (!hasText(subject)) return null;
        return subject.length() > 255 ? subject.substring(0, 255) : subject.trim();
    }

    private static boolean hasText(String s) {
        return s != null && !s.isBlank();
    }

    private SupportDto.ConversationDto toDto(SupportConversation c) {
        long unread = messageRepository
                .countByConversationIdAndSenderRoleAndReadAtIsNull(c.getId(), SupportSenderRole.REQUESTER);
        return toDto(c, unread, null);
    }

    /**
     * @param lastMessage tin nhan cuoi neu ben goi da nap san (hop thu nap theo lo);
     *                    null thi DTO khong kem preview - cac man hinh khac khong dung den no.
     */
    private SupportDto.ConversationDto toDto(SupportConversation c, long unreadFromRequester,
                                             SupportMessage lastMessage) {
        return SupportDto.ConversationDto.builder()
                .id(c.getId())
                .status(c.getStatus())
                .subject(c.getSubject())
                .displayName(c.displayName())
                .requesterId(c.getRequester() != null ? c.getRequester().getId() : null)
                .requesterAvatar(c.getRequester() != null ? c.getRequester().getAvatarUrl() : null)
                .guestContact(c.getGuestContact())
                .assigneeId(c.getAssignee() != null ? c.getAssignee().getId() : null)
                .assigneeName(c.getAssignee() != null ? c.getAssignee().getFullName() : null)
                .createdAt(c.getCreatedAt())
                .lastMessageAt(c.getLastMessageAt())
                .unreadFromRequester(unreadFromRequester)
                .lastMessagePreview(lastMessage != null ? previewOf(lastMessage) : null)
                .lastMessageFromAgent(lastMessage != null
                        ? lastMessage.getSenderRole() == SupportSenderRole.AGENT
                        : null)
                .hasMessages(c.getLastMessageAt() != null)
                .build();
    }

    /** Dong tom tat hien trong hop thu. Tin chi co anh van phai co chu de doc duoc. */
    private String previewOf(SupportMessage message) {
        if (hasText(message.getContent())) {
            return preview(message.getContent());
        }
        return hasText(message.getImageUrl()) ? "[Hình ảnh]" : "";
    }

    private SupportDto.MessageDto toDto(SupportMessage m) {
        return SupportDto.MessageDto.builder()
                .id(m.getId())
                .conversationId(m.getConversation().getId())
                .content(m.getContent())
                .imageUrl(m.getImageUrl())
                .senderRole(m.getSenderRole())
                .senderId(m.getSender() != null ? m.getSender().getId() : null)
                .senderName(m.getSender() != null ? m.getSender().getFullName() : null)
                .senderAvatar(m.getSender() != null ? m.getSender().getAvatarUrl() : null)
                .sentAt(m.getSentAt())
                .readAt(m.getReadAt())
                .build();
    }
}
