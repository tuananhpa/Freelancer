package com.uranus.lms.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;

@Component
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {

    private final RedisTemplate<String, Object> redisTemplate;
    
    private static final int MAX_REQUESTS_PER_MINUTE = 3000;
    private static final int MAX_AI_REQUESTS_PER_MINUTE = 50;
    private static final int MAX_SUPPORT_REQUESTS_PER_MINUTE = 30;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String ip = getClientIP(request);
        String path = request.getRequestURI();

        // 1. Phân loại cấu hình Rate Limit theo Path
        int limit = MAX_REQUESTS_PER_MINUTE;
        String prefix = "rate_limit:global:";
        
        // Cấu hình riêng cho API gọi AI (Gemini) để tránh tốn tiền
        if (path.contains("/api/flashcards/ai") || path.contains("/api/exams/import")) {
            limit = MAX_AI_REQUESTS_PER_MINUTE;
            prefix = "rate_limit:ai:";
        } else if (path.startsWith("/api/support")) {
            // Chat ho tro mo cho khach vang lai nen sieu de bi bot doi
            limit = MAX_SUPPORT_REQUESTS_PER_MINUTE;
            prefix = "rate_limit:support:";
        }

        String key = prefix + ip;

        // 2. Increment request count trong Redis
        Long count = redisTemplate.opsForValue().increment(key);
        
        if (count != null && count == 1) {
            redisTemplate.expire(key, Duration.ofMinutes(1)); // Reset sau 1 phút
        }

        // 3. Nếu vượt quá giới hạn
        if (count != null && count > limit) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"error\": \"Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 1 phút.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty() || !xfHeader.contains(request.getRemoteAddr())) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
    }
}
