package com.uranus.lms.modules.exam;

import com.uranus.lms.common.response.ApiResponse;
import com.uranus.lms.modules.exam.dto.*;
import com.uranus.lms.modules.user.User;
import com.uranus.lms.modules.user.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/exams")
@RequiredArgsConstructor
public class ExamController {

    private final ExamService examService;
    private final UserRepository userRepository;

    /** Public: danh sách đề thi đã phát hành */
    @GetMapping("/public")
    public ResponseEntity<Page<ExamResponse>> getAllPublishedExams(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String folderId,
            @RequestParam(required = false) String subject,
            @RequestParam(required = false) String grade,
            @PageableDefault(size = 10) Pageable pageable) {
        User user = null;
        try {
            user = getCurrentUser();
        } catch (Exception e) {
            // Ignore, user might not be logged in
        }
        return ResponseEntity.ok(examService.getAllPublishedExams(pageable, search, folderId, subject, grade, user));
    }

    /** Teacher: danh sách đề thi của mình */
    @GetMapping("/teacher")
    public ResponseEntity<Page<ExamResponse>> getTeacherExams(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String folderId,
            @RequestParam(required = false) String subject,
            @RequestParam(required = false) String grade,
            @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(examService.getTeacherExams(getCurrentUser(), pageable, search, folderId, subject, grade));
    }

    /** Student: Tìm đề thi bằng mã code */
    @GetMapping("/code/{code}")
    public ResponseEntity<ExamResponse> getExamByCode(@PathVariable String code) {
        return ResponseEntity.ok(examService.getExamByCode(code));
    }

    /** Lấy danh sách các môn học/tag đang có trong đề thi */
    @GetMapping("/subjects")
    public ResponseEntity<List<String>> getAvailableSubjects() {
        return ResponseEntity.ok(examService.getAvailableSubjects());
    }

    /** Lấy chi tiết lịch sử làm bài của học sinh */
    @GetMapping("/history")
    public ResponseEntity<Page<ExamHistoryResponse>> getStudentHistory(
            @org.springframework.web.bind.annotation.RequestParam(required = false) String search,
            @org.springframework.web.bind.annotation.RequestParam(required = false) String status,
            @org.springframework.web.bind.annotation.RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate fromDate,
            @org.springframework.web.bind.annotation.RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate toDate,
            @PageableDefault(size = 10) Pageable pageable) {
        
        Boolean isPassed = null;
        if ("passed".equalsIgnoreCase(status)) isPassed = true;
        else if ("failed".equalsIgnoreCase(status)) isPassed = false;
        
        java.time.LocalDateTime from = fromDate != null ? fromDate.atStartOfDay() : null;
        java.time.LocalDateTime to = toDate != null ? toDate.atTime(23, 59, 59) : null;

        return ResponseEntity.ok(examService.getStudentHistory(getCurrentUser(), search, isPassed, from, to, pageable));
    }

    /** Lấy kết quả chi tiết của một lần làm bài */
    @GetMapping("/results/{resultId}")
    public ResponseEntity<ExamResultDetailResponse> getResultDetail(@PathVariable UUID resultId) {
        return ResponseEntity.ok(examService.getResultDetail(resultId, getCurrentUser()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExamResponse> getExamById(
            @PathVariable UUID id,
            @RequestParam(required = false) String accessCode,
            @RequestParam(required = false) UUID libraryResourceId) {
        User user = null;
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !auth.getName().equals("anonymousUser")) {
            user = userRepository.findByEmail(auth.getName()).orElse(null);
        }
        return ResponseEntity.ok(examService.getExamById(id, user, accessCode, libraryResourceId));
    }

    /** Teacher: Tạo đề thi mới */
    @PostMapping
    public ResponseEntity<ExamResponse> createExam(@Valid @RequestBody CreateExamRequest request) {
        return ResponseEntity.ok(examService.createExam(request, getCurrentUser()));
    }

    /** Teacher: Cập nhật đề thi */
    @PutMapping("/{id}")
    public ResponseEntity<ExamResponse> updateExam(
            @PathVariable UUID id,
            @Valid @RequestBody CreateExamRequest request) {
        return ResponseEntity.ok(examService.updateExam(id, request, getCurrentUser()));
    }

    /** Teacher: Toggle publish/unpublish */
    @PatchMapping("/{id}/publish")
    public ResponseEntity<ExamResponse> togglePublish(@PathVariable UUID id) {
        return ResponseEntity.ok(examService.togglePublish(id, getCurrentUser()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteExam(@PathVariable UUID id) {
        examService.deleteExam(id, getCurrentUser());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ─── Favorite Exam ──────────────────────────────────────

    @PostMapping("/{id}/favorite")
    public ResponseEntity<Map<String, Boolean>> toggleFavorite(@PathVariable UUID id) {
        boolean favorited = examService.toggleFavorite(id, getCurrentUser());
        return ResponseEntity.ok(Map.of("favorited", favorited));
    }

    @GetMapping("/{id}/favorite")
    public ResponseEntity<Map<String, Boolean>> isFavorited(@PathVariable UUID id) {
        boolean favorited = examService.isFavorited(id, getCurrentUser());
        return ResponseEntity.ok(Map.of("favorited", favorited));
    }

    @GetMapping("/favorites")
    public ResponseEntity<Page<ExamResponse>> getFavoriteExams(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String subject,
            @RequestParam(required = false) String grade,
            @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(examService.getFavoriteExams(getCurrentUser(), pageable, search, subject, grade));
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<ApiResponse<OngoingExamResponse>> startExam(
            @PathVariable UUID id,
            @RequestParam(required = false) String accessCode,
            @RequestParam(required = false) UUID libraryResourceId) {
        OngoingExamResponse result = examService.startExam(id, getCurrentUser(), accessCode, libraryResourceId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/{id}/draft")
    public ResponseEntity<ApiResponse<Void>> saveDraft(
            @PathVariable UUID id,
            @Valid @RequestBody SubmitExamRequest request) {
        examService.saveDraft(id, getCurrentUser(), request);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<ApiResponse<String>> submitExam(
            @PathVariable UUID id,
            @Valid @RequestBody SubmitExamRequest request) {
        StudentExamResult result = examService.submitExam(id, getCurrentUser(), request);
        return ResponseEntity.ok(ApiResponse.success(result.getId().toString()));
    }

    /** Teacher: giám sát học sinh đang làm bài */
    @GetMapping("/{id}/proctoring")
    public ResponseEntity<ProctoringResponse> getProctoringSession(@PathVariable UUID id) {
        return ResponseEntity.ok(examService.getProctoringSession(id, getCurrentUser()));
    }

    /** Teacher: Xem báo cáo thống kê sau khi thi */
    @GetMapping("/{id}/analytics")
    public ResponseEntity<ExamAnalyticsResponse> getExamAnalytics(@PathVariable UUID id) {
        return ResponseEntity.ok(examService.getExamAnalytics(id, getCurrentUser()));
    }

    /** Teacher: Xóa kết quả thi của một học sinh */
    @DeleteMapping("/{id}/results/{resultId}")
    public ResponseEntity<ApiResponse<Void>> deleteExamResult(@PathVariable UUID id, @PathVariable UUID resultId) {
        examService.deleteExamResult(id, resultId, getCurrentUser());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /** Teacher: Export bảng điểm ra Excel */
    @GetMapping("/{id}/export-excel")
    public ResponseEntity<byte[]> exportResultsExcel(@PathVariable UUID id) throws Exception {
        ExamAnalyticsResponse analytics = examService.getExamAnalytics(id, getCurrentUser());

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Bảng điểm");

            // Header style
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.ORANGE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setBorderBottom(BorderStyle.THIN);

            // Row 0: Exam info
            Row infoRow = sheet.createRow(0);
            infoRow.createCell(0).setCellValue("Đề thi: " + analytics.getExamTitle());
            Row infoRow2 = sheet.createRow(1);
            infoRow2.createCell(0).setCellValue("Mã đề: " + analytics.getExamCode()
                    + "  |  Số học sinh: " + analytics.getTotalSubmissions()
                    + "  |  Điểm TB: " + String.format("%.2f", analytics.getAverageScore())
                    + "  |  Tỉ lệ đạt: " + String.format("%.1f", analytics.getPassRate()) + "%");

            // Header row
            Row header = sheet.createRow(3);
            String[] columns = {"STT", "Họ và tên", "Email", "Điểm", "Điểm tối đa", "Phần trăm (%)", "Kết quả", "Thời gian làm (giây)", "Cảnh báo (Tổng)", "Thoát MH", "Chuyển Tab", "Thời gian nộp"};
            for (int i = 0; i < columns.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
            }

            // Data rows
            int rowIdx = 4;
            int stt = 1;
            for (ExamAnalyticsResponse.StudentScoreRow s : analytics.getStudentScores()) {
                int tabCount = 0;
                int fullscreenCount = 0;
                if (s.getCheatDetails() != null) {
                    tabCount = s.getCheatDetails().split("Rời khỏi tab|Chuyển cửa sổ|Blur").length - 1;
                    fullscreenCount = s.getCheatDetails().split("Thoát toàn màn hình").length - 1;
                }

                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(stt++);
                row.createCell(1).setCellValue(s.getStudentName());
                row.createCell(2).setCellValue(s.getStudentEmail());
                row.createCell(3).setCellValue(s.getTotalScore());
                row.createCell(4).setCellValue(s.getMaxScore());
                row.createCell(5).setCellValue(Math.round(s.getScorePercentage() * 10.0) / 10.0);
                row.createCell(6).setCellValue(Boolean.TRUE.equals(s.getIsPassed()) ? "ĐẠT" : "CHƯA ĐẠT");
                row.createCell(7).setCellValue(s.getTimeTakenSeconds());
                row.createCell(8).setCellValue(s.getCheatWarningCount());
                row.createCell(9).setCellValue(fullscreenCount);
                row.createCell(10).setCellValue(tabCount);
                row.createCell(11).setCellValue(s.getSubmittedAt() != null ? s.getSubmittedAt() : "");
            }

            // Auto-size columns
            for (int i = 0; i < columns.length; i++) sheet.autoSizeColumn(i);

            java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();
            workbook.write(out);

            String filename = "bangdiem_" + analytics.getExamCode() + ".xlsx";
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(out.toByteArray());
        }
    }

    /** Xác thực mật khẩu trước khi thi (áp dụng cho cả 2 kiểu đề) */
    @PostMapping("/{id}/verify-password")
    public ResponseEntity<Map<String, Boolean>> verifyPassword(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        String password = body.get("password");
        boolean valid = examService.verifyExamPassword(id, password);
        return ResponseEntity.ok(Map.of("valid", valid));
    }

    /** Lấy chi tiết review sau khi thi: câu hỏi + đáp án đã chọn + đáp án đúng + explanation */
    @GetMapping("/results/{resultId}/review")
    public ResponseEntity<ExamResultDetailResponse> getResultReview(@PathVariable UUID resultId) {
        return ResponseEntity.ok(examService.getResultDetail(resultId, getCurrentUser()));
    }

    @PostMapping("/{id}/regrade-short-answers")
    @PreAuthorize("hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN')")
    public ResponseEntity<ApiResponse<String>> regradeShortAnswers(@PathVariable UUID id) {
        String result = examService.regradeShortAnswers(id);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/results/{resultId}/add-bonus")
    @PreAuthorize("hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN')")
    public ResponseEntity<ApiResponse<String>> addBonusPoints(
            @PathVariable UUID resultId,
            @RequestBody Map<String, Double> payload) {
        double bonusPoints = payload.getOrDefault("bonusPoints", 0.0);
        String message = examService.addBonusPoints(resultId, bonusPoints);
        return ResponseEntity.ok(ApiResponse.success(message));
    }

    /** Danh sách câu tự luận AI đã chấm nháp, đang chờ giáo viên duyệt. */
    @GetMapping("/{id}/pending-essay-reviews")
    @PreAuthorize("hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN')")
    public ResponseEntity<List<EssayReviewItemResponse>> getPendingEssayReviews(@PathVariable UUID id) {
        return ResponseEntity.ok(examService.getPendingEssayReviews(id));
    }

    /** Giáo viên duyệt (giữ nguyên hoặc sửa) điểm AI chấm nháp cho một câu tự luận. */
    @PatchMapping("/answers/{answerId}/review")
    @PreAuthorize("hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN', 'STUDENT')")
    public ResponseEntity<ApiResponse<String>> reviewEssayAnswer(
            @PathVariable UUID answerId,
            @RequestBody EssayReviewRequest request) {
        String message = examService.reviewEssayAnswer(answerId, request);
        return ResponseEntity.ok(ApiResponse.success(message));
    }

    /** Giáo viên, trợ giảng hoặc học sinh chủ bài thi yêu cầu AI chấm lại câu tự luận thi. */
    @PostMapping("/answers/{answerId}/regrade-ai")
    @PreAuthorize("hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN', 'STUDENT')")
    public ResponseEntity<EssayReviewItemResponse> regradeEssayWithAI(@PathVariable UUID answerId) {
        return ResponseEntity.ok(examService.regradeEssayWithAI(answerId, getCurrentUser()));
    }

    /** Chấm lại câu tự luận theo resultId và questionId */
    @PostMapping("/results/{resultId}/questions/{questionId}/regrade-ai")
    @PreAuthorize("hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN', 'STUDENT')")
    public ResponseEntity<EssayReviewItemResponse> regradeEssayQuestionWithAI(
            @PathVariable UUID resultId,
            @PathVariable UUID questionId) {
        return ResponseEntity.ok(examService.regradeEssayQuestionWithAI(resultId, questionId, getCurrentUser()));
    }

    /** Giáo viên, trợ giảng duyệt/chấm điểm thủ công theo resultId và questionId */
    @PatchMapping("/results/{resultId}/questions/{questionId}/review")
    @PreAuthorize("hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN', 'STUDENT')")
    public ResponseEntity<ApiResponse<String>> reviewEssayQuestion(
            @PathVariable UUID resultId,
            @PathVariable UUID questionId,
            @RequestBody EssayReviewRequest request) {
        String message = examService.reviewEssayQuestion(resultId, questionId, request);
        return ResponseEntity.ok(ApiResponse.success(message));
    }

    /** Chấm lại toàn bộ các câu tự luận trong một bài thi */
    @PostMapping("/results/{resultId}/regrade-all-essays")
    @PreAuthorize("hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN', 'STUDENT')")
    public ResponseEntity<ExamResultDetailResponse> regradeAllEssaysInResult(@PathVariable UUID resultId) {
        return ResponseEntity.ok(examService.regradeAllEssaysInResult(resultId, getCurrentUser()));
    }

    /** Chấm lại toàn bộ các câu tự luận đang chờ duyệt trong một đề thi */
    @PostMapping("/{id}/regrade-all-essays")
    @PreAuthorize("hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN')")
    public ResponseEntity<ApiResponse<String>> regradeAllPendingEssaysInExam(@PathVariable UUID id) {
        String result = examService.regradeAllPendingEssaysInExam(id);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /** Giáo viên / Trợ giảng duyệt toàn bộ điểm và gửi thông báo/email kết quả cho học sinh */
    @PostMapping("/results/{resultId}/publish-grade")
    @PreAuthorize("hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN', 'STUDENT')")
    public ResponseEntity<ExamResultDetailResponse> approveAndPublishResult(@PathVariable UUID resultId) {
        return ResponseEntity.ok(examService.approveAndPublishResult(resultId, getCurrentUser()));
    }

    /** Cập nhật trạng thái Đạt / Chưa đạt của bài thi */
    @PatchMapping("/results/{resultId}/pass-status")
    @PreAuthorize("hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN', 'STUDENT')")
    public ResponseEntity<ExamResultDetailResponse> updatePassStatus(
            @PathVariable UUID resultId,
            @RequestBody java.util.Map<String, Object> body) {
        Boolean isPassed = body.containsKey("isPassed") ? Boolean.valueOf(String.valueOf(body.get("isPassed"))) : true;
        Double totalScore = body.containsKey("totalScore") && body.get("totalScore") != null
                ? Double.valueOf(String.valueOf(body.get("totalScore")))
                : null;
        return ResponseEntity.ok(examService.updateResultPassStatus(resultId, isPassed, totalScore, getCurrentUser()));
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow();
    }
}
