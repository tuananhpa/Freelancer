package com.uranus.lms.modules.certification;

import com.uranus.lms.modules.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/certificates")
@RequiredArgsConstructor
public class CertificateController {
    private final CertificateService certificateService;

    // studentId tren URL phai khop voi nguoi dang dang nhap - truoc day khong
    // kiem tra gi ca nen bat ky ai cung goi duoc de tu cap chung chi cho nguoi
    // khac, cho khoa hoc bat ky, khong can hoan thanh gi.
    @PostMapping("/issue/{courseId}/{studentId}")
    public ResponseEntity<CertificateDto> issueCertificate(
            @AuthenticationPrincipal User caller,
            @PathVariable UUID courseId,
            @PathVariable UUID studentId) {
        if (!caller.getId().equals(studentId)) {
            throw new com.uranus.lms.exception.ForbiddenException("Bạn chỉ có thể tự cấp chứng chỉ cho chính mình.");
        }
        return ResponseEntity.ok(certificateService.issueCertificate(courseId, caller));
    }

    @GetMapping("/verify/{code}")
    public ResponseEntity<CertificateDto> verifyCertificate(@PathVariable String code) {
        return ResponseEntity.ok(certificateService.getCertificateByCode(code));
    }

    @GetMapping("/my")
    public ResponseEntity<Page<CertificateDto>> getMyCertificates(
            @AuthenticationPrincipal User user,
            @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(certificateService.getMyCertificates(user, pageable));
    }
}
