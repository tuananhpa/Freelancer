package com.uranus.lms.config;

import com.uranus.lms.modules.support.SupportConversationRepository;
import com.uranus.lms.security.JwtUtils;
import com.uranus.lms.security.UserDetailsServiceImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.List;

/**
 * Xac thuc o tang STOMP.
 *
 * Truoc day /ws hoan toan khong xac thuc: bat ky ai cung co the subscribe
 * "/topic/notifications/{userId}" va doc thong bao realtime cua nguoi khac.
 * Interceptor nay gan Principal vao phien STOMP luc CONNECT va chan SUBSCRIBE
 * vao dich khong duoc phep, nen moi du lieu rieng tu deu di qua "/user/queue/**"
 * (Spring tu dinh tuyen theo dung Principal, khong the nghe trom).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {

    public static final String GUEST_PREFIX = "guest:";
    private static final String AGENT_TOPIC = "/topic/support.agents";
    private static final String AGENT_MESSAGE_TOPIC = "/topic/support.agents.messages";
    private static final String AGENT_READ_TOPIC = "/topic/support.agents.read";
    private static final String AGENT_TYPING_TOPIC = "/topic/support.agents.typing";

    private final JwtUtils jwtUtils;
    private final UserDetailsServiceImpl userDetailsService;
    private final SupportConversationRepository conversationRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || accessor.getCommand() == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            accessor.setUser(resolvePrincipal(accessor));
        } else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            authorizeSubscribe(accessor);
        }

        return message;
    }

    /** JWT cho nguoi dung da dang nhap, guest token cho khach vang lai. */
    private Authentication resolvePrincipal(StompHeaderAccessor accessor) {
        String authHeader = accessor.getFirstNativeHeader("Authorization");
        if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
            String jwt = authHeader.substring(7);

            if (Boolean.TRUE.equals(redisTemplate.hasKey("blacklist:" + jwt))) {
                return null;
            }
            try {
                String email = jwtUtils.extractUsername(jwt);
                if (StringUtils.hasText(email)) {
                    UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                    if (jwtUtils.isTokenValid(jwt, userDetails)) {
                        return new UsernamePasswordAuthenticationToken(
                                userDetails.getUsername(), null, userDetails.getAuthorities());
                    }
                }
            } catch (Exception e) {
                log.debug("WS CONNECT voi JWT khong hop le: {}", e.getMessage());
            }
            return null;
        }

        String guestToken = accessor.getFirstNativeHeader("X-Guest-Token");
        if (StringUtils.hasText(guestToken)
                && conversationRepository.findByGuestToken(guestToken).isPresent()) {
            return new UsernamePasswordAuthenticationToken(GUEST_PREFIX + guestToken, null, List.of());
        }

        return null;
    }

    private void authorizeSubscribe(StompHeaderAccessor accessor) {
        String destination = accessor.getDestination();
        if (destination == null) {
            throw new IllegalArgumentException("Thieu destination khi subscribe.");
        }

        Authentication auth = (Authentication) accessor.getUser();

        // Hang doi rieng: Spring da dinh tuyen theo Principal, chi can dam bao co danh tinh.
        if (destination.startsWith("/user/")) {
            if (auth == null) {
                throw new IllegalArgumentException("Can dang nhap de nhan du lieu realtime.");
            }
            return;
        }

        // Topic dung chung duy nhat: hang doi cho ho tro vien.
        if (AGENT_TOPIC.equals(destination) || AGENT_MESSAGE_TOPIC.equals(destination)
                || AGENT_READ_TOPIC.equals(destination) || AGENT_TYPING_TOPIC.equals(destination)) {
            if (auth == null || !hasAgentRole(auth)) {
                throw new IllegalArgumentException("Chi ho tro vien moi duoc theo doi hang doi ho tro.");
            }
            return;
        }

        // Mac dinh tu choi: khong mo topic cong khai nao khac.
        throw new IllegalArgumentException("Destination khong duoc phep: " + destination);
    }

    private boolean hasAgentRole(Authentication auth) {
        for (GrantedAuthority authority : auth.getAuthorities()) {
            String role = authority.getAuthority();
            if ("ROLE_OFFICE".equals(role) || "ROLE_ADMIN".equals(role)) {
                return true;
            }
        }
        return false;
    }
}
