package com.uranus.lms.modules.exam;

import com.uranus.lms.modules.exam.dto.CreateExamRequest;
import com.uranus.lms.modules.exam.dto.ExamImportResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/exams")
@RequiredArgsConstructor
public class ExamImportController {

    private final ExamImportService importService;

    /** Mapping cấu trúc kiểu Azota — PDF/DOCX có text, nhận dạng Câu 1 / A B C D / đáp án */
    @PostMapping("/import-structure")
    @PreAuthorize("hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN')")
    public ResponseEntity<ExamImportResponse> importStructure(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(importService.importWithStructureMapping(file));
    }

    /** AI Scan — đọc PDF scan, ảnh chụp đề bằng Gemini Vision */
    @PostMapping("/import-ai-scan")
    @PreAuthorize("hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN')")
    public ResponseEntity<ExamImportResponse> importAiScan(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(importService.importWithAiScan(file));
    }

    /** @deprecated use /import-structure */
    @PostMapping("/import-document")
    @PreAuthorize("hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN')")
    public ResponseEntity<ExamImportResponse> importDocument(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(importService.importWithStructureMapping(file));
    }

    /** @deprecated use /import-structure */
    @PostMapping("/import-pdf")
    @PreAuthorize("hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN')")
    public ResponseEntity<List<CreateExamRequest.QuestionDto>> importFromPdf(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(importService.importFromPdf(file));
    }
}
