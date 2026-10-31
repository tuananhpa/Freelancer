package com.uranus.lms.modules.support;

import com.uranus.lms.security.UserDetailsImpl;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/support")
@RequiredArgsConstructor
public class SupportController {

    private final SupportService supportService;

    /** Khach vang lai mo phien chat. Public. */
    @PostMapping("/guest-session")
    public ResponseEntity<SupportDto.GuestSessionDto> openGuestSession(
            @RequestBody SupportDto.StartRequest request,
            HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(supportService.openForGuest(request, clientIp(httpRequest)));
    }

    /** Nguoi dung da dang nhap mo (hoac lay lai) hoi thoai cua minh. */
    @PostMapping("/conversations")
    public ResponseEntity<SupportDto.ConversationDto> openConversation(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestBody(required = false) SupportDto.StartRequest request
    ) {
        return ResponseEntity.ok(supportService.openForUser(userDetails.getUser(), request));
    }

    /** Gan hoi thoai cua khach vao tai khoan vua dang nhap. */
    @PostMapping("/conversations/claim")
    public ResponseEntity<SupportDto.ConversationDto> claim(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestBody ClaimRequest request
    ) {
        return ResponseEntity.ok(supportService.claimGuestConversation(request.guestToken(), userDetails.getUser()));
    }

    @GetMapping("/conversations/{id}")
    public ResponseEntity<SupportDto.ConversationDto> getConversation(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestHeader(value = "X-Guest-Token", required = false) String guestToken
    ) {
        return ResponseEntity.ok(supportService.getConversation(id, userOrNull(userDetails), guestToken));
    }

    @GetMapping("/conversations/{id}/messages")
    public ResponseEntity<List<SupportDto.MessageDto>> listMessages(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestHeader(value = "X-Guest-Token", required = false) String guestToken
    ) {
        return ResponseEntity.ok(supportService.listMessages(id, userOrNull(userDetails), guestToken));
    }

    @PostMapping("/conversations/{id}/messages")
    public ResponseEntity<SupportDto.MessageDto> sendMessage(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestHeader(value = "X-Guest-Token", required = false) String guestToken,
            @RequestBody SupportDto.SendRequest request
    ) {
        return ResponseEntity.ok(supportService.sendMessage(
                id, userOrNull(userDetails), guestToken, request.content(), request.imageUrl()));
    }

    @PostMapping("/conversations/{id}/typing")
    public ResponseEntity<Void> sendTyping(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestHeader(value = "X-Guest-Token", required = false) String guestToken,
            @RequestBody SupportDto.TypingRequest request
    ) {
        supportService.handleTyping(id, userOrNull(userDetails), guestToken, request != null && request.isTyping());
        return ResponseEntity.ok().build();
    }

    @org.springframework.messaging.handler.annotation.MessageMapping("/support.typing")
    public void onTypingMessage(
            @org.springframework.messaging.handler.annotation.Payload SupportDto.TypingEvent payload,
            java.security.Principal principal
    ) {
        if (payload != null && payload.conversationId() != null && principal != null) {
            supportService.handleTypingWithPrincipal(payload.conversationId(), principal.getName(), payload.isTyping());
        }
    }

    /** Tai anh dinh kem. Quyen truy cap hoi thoai duoc kiem trong service. */
    @PostMapping("/conversations/{id}/attachments")
    public ResponseEntity<java.util.Map<String, String>> uploadAttachment(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestHeader(value = "X-Guest-Token", required = false) String guestToken,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file
    ) {
        String url = supportService.uploadAttachment(id, userOrNull(userDetails), guestToken, file);
        return ResponseEntity.ok(java.util.Map.of("url", url));
    }

    // ---------------------------------------------------------------- ho tro vien

    @GetMapping("/inbox")
    @PreAuthorize("hasAnyRole('OFFICE','ADMIN')")
    public ResponseEntity<List<SupportDto.ConversationDto>> inbox(
            @RequestParam(required = false) SupportStatus status,
            /* Hoi thoai chua co tin nhan nao bi an mac dinh - xem ghi chu o repository. */
            @RequestParam(required = false, defaultValue = "false") boolean includeEmpty
    ) {
        return ResponseEntity.ok(supportService.inbox(status, includeEmpty));
    }

    /** Huy hieu tren thanh ben: so hoi thoai dang cho tra loi. */
    @GetMapping("/inbox/unread-count")
    @PreAuthorize("hasAnyRole('OFFICE','ADMIN')")
    public ResponseEntity<Long> unreadCount() {
        return ResponseEntity.ok(supportService.unreadConversationCount());
    }

    @PostMapping("/conversations/{id}/assign")
    @PreAuthorize("hasAnyRole('OFFICE','ADMIN')")
    public ResponseEntity<SupportDto.ConversationDto> assign(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        return ResponseEntity.ok(supportService.assign(id, userDetails.getUser()));
    }

    @PostMapping("/conversations/{id}/close")
    @PreAuthorize("hasAnyRole('OFFICE','ADMIN')")
    public ResponseEntity<SupportDto.ConversationDto> close(@PathVariable UUID id) {
        return ResponseEntity.ok(supportService.close(id));
    }

    public record ClaimRequest(String guestToken) {}

    private com.uranus.lms.modules.user.User userOrNull(UserDetailsImpl userDetails) {
        return userDetails != null ? userDetails.getUser() : null;
    }

    private String clientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty() || !xfHeader.contains(request.getRemoteAddr())) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
    }
}
