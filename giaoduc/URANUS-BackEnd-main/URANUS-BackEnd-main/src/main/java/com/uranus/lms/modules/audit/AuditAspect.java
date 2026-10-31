package com.uranus.lms.modules.audit;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditAspect {

    private final AuditLogService auditLogService;

    @Around("@annotation(auditable)")
    public Object auditMethodExecution(ProceedingJoinPoint joinPoint, Auditable auditable) throws Throwable {
        Object result = joinPoint.proceed();
        
        try {
            auditLogService.logAction(
                auditable.action(),
                auditable.entityName(),
                "METHOD_CALL",
                null,
                null
            );
        } catch (Exception e) {
            log.error("Failed to execute audit aspect: {}", e.getMessage());
        }
        
        return result;
    }
}
