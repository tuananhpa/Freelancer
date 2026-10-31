package com.uranus.lms.modules.audit;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.uranus.lms.modules.user.User;
import com.uranus.lms.modules.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogService {
    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Async
    public void logAction(AuditAction action, String entityName, String entityId, Object previousState, Object newState) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            User user = null;
            if (authentication != null && authentication.getPrincipal() instanceof User) {
                user = (User) authentication.getPrincipal();
            } else if (authentication != null && authentication.getName() != null && !authentication.getName().equals("anonymousUser")) {
                user = userRepository.findByEmail(authentication.getName()).orElse(null);
            }

            JsonNode prevJson = previousState != null ? objectMapper.valueToTree(previousState) : null;
            JsonNode newJson = newState != null ? objectMapper.valueToTree(newState) : null;

            AuditLog auditLog = AuditLog.builder()
                    .user(user)
                    .action(action)
                    .entityName(entityName)
                    .entityId(entityId)
                    .previousState(prevJson)
                    .newState(newJson)
                    .ipAddress("127.0.0.1") // Placeholder for IP address extraction
                    .build();

            auditLogRepository.save(auditLog);
            log.info("Audit log saved: {} {} {}", action, entityName, entityId);
        } catch (Exception e) {
            log.error("Failed to save audit log: {}", e.getMessage());
        }
    }

    public Page<AuditLogDto> getAuditLogs(Pageable pageable) {
        return auditLogRepository.findAll(pageable).map(this::mapToDto);
    }

    private AuditLogDto mapToDto(AuditLog log) {
        return AuditLogDto.builder()
                .id(log.getId())
                .userId(log.getUser() != null ? log.getUser().getId() : null)
                .userEmail(log.getUser() != null ? log.getUser().getEmail() : "SYSTEM")
                .action(log.getAction())
                .entityName(log.getEntityName())
                .entityId(log.getEntityId())
                .previousState(log.getPreviousState())
                .newState(log.getNewState())
                .ipAddress(log.getIpAddress())
                .createdAt(log.getCreatedAt())
                .build();
    }
}
