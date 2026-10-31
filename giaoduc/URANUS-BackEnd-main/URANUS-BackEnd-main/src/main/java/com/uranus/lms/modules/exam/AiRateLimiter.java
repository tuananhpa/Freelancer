package com.uranus.lms.modules.exam;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Giới hạn số lượt gọi AI chấm bài theo từng học sinh, để tránh spam làm tốn phí API.
 * In-memory, đủ dùng cho một instance backend duy nhất như hiện tại.
 */
@Component
public class AiRateLimiter {

    private static final int MAX_CALLS = 20;
    private static final long WINDOW_MILLIS = 10 * 60 * 1000L; // 10 phút

    private final Map<UUID, Deque<Instant>> callsByStudent = new ConcurrentHashMap<>();

    /** @return true nếu còn được phép gọi (và đã ghi nhận lượt gọi này) */
    public synchronized boolean tryAcquire(UUID studentId) {
        if (studentId == null) return true;
        Instant now = Instant.now();
        Deque<Instant> calls = callsByStudent.computeIfAbsent(studentId, k -> new ArrayDeque<>());
        while (!calls.isEmpty() && now.toEpochMilli() - calls.peekFirst().toEpochMilli() > WINDOW_MILLIS) {
            calls.pollFirst();
        }
        if (calls.size() >= MAX_CALLS) {
            return false;
        }
        calls.addLast(now);
        return true;
    }
}
