package com.uranus.lms.modules.assignment;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.uranus.lms.exception.BadRequestException;
import com.uranus.lms.exception.ResourceNotFoundException;
import com.uranus.lms.modules.assignment.dto.writing.*;
import com.uranus.lms.modules.exam.AiRateLimiter;
import com.uranus.lms.modules.notification.NotificationService;
import com.uranus.lms.modules.notification.NotificationType;
import com.uranus.lms.modules.user.Role;
import com.uranus.lms.modules.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiWritingGradingService {

    @Value("${app.gemini.api-key:}")
    private String geminiApiKey;

    @Value("${app.gemini.model:gemini-3.5-flash-lite}")
    private String geminiModel;

    private final WritingAssessmentRepository assessmentRepository;
    private final WritingAssessmentVersionRepository versionRepository;
    private final AssignmentSubmissionRepository submissionRepository;
    private final AssignmentRepository assignmentRepository;
    private final NotificationService notificationService;
    private final AiRateLimiter rateLimiter;

    private static final int CONNECT_TIMEOUT_MS = 10_000;
    private static final int READ_TIMEOUT_MS = 60_000;

    private final RestTemplate restTemplate = buildRestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Map theo dõi tiến trình batch grading in-memory: batchId -> status
    private final Map<String, BatchAiGradingStatusResponse> batchJobs = new ConcurrentHashMap<>();

    private static RestTemplate buildRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(CONNECT_TIMEOUT_MS);
        factory.setReadTimeout(READ_TIMEOUT_MS);
        return new RestTemplate(factory);
    }

    /**
     * Đếm số từ độc lập trong chuỗi văn bản (đã loại bỏ HTML tags và entities).
     * Một từ hợp lệ phải chứa ít nhất một ký tự chữ hoặc số (loại trừ dấu câu đứng riêng).
     */
    public static int countWords(String text) {
        if (text == null || text.isBlank()) return 0;
        String cleaned = stripHtml(text);
        if (cleaned.isEmpty()) return 0;
        String[] tokens = cleaned.split("\\s+");
        int count = 0;
        for (String token : tokens) {
            if (token.matches(".*[\\p{L}\\p{N}].*")) {
                count++;
            }
        }
        return count;
    }

    /**
     * Bóc tách văn bản thuần từ HTML rich text.
     */
    public static String stripHtml(String html) {
        if (html == null) return "";
        return html.replaceAll("<[^>]*>", " ")
                   .replaceAll("&nbsp;", " ")
                   .replaceAll("&[a-zA-Z0-9#]+;", " ")
                   .trim();
    }

    /**
     * Chấm điểm bài viết bất đồng bộ (@Async) — dùng khi học sinh nộp bài hoặc giáo viên ấn chấm.
     */
    @Async
    public void gradeSubmissionAsync(UUID submissionId, boolean isRegrade, User requestedBy) {
        try {
            gradeSubmissionSync(submissionId, isRegrade, requestedBy);
        } catch (Exception e) {
            log.error("Lỗi khi chấm bài viết async cho submissionId={}: {}", submissionId, e.getMessage(), e);
        }
    }

    /**
     * Chấm bài viết đồng bộ (core business flow).
     */
    @Transactional
    public WritingAssessmentResponseDto gradeSubmissionSync(UUID submissionId, boolean isRegrade, User requestedBy) {
        AssignmentSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài nộp: " + submissionId));

        Assignment assignment = submission.getAssignment();
        User student = submission.getStudent();

        String rawContent = submission.getContent();
        String studentText = stripHtml(rawContent);

        if (studentText.isBlank()) {
            throw new BadRequestException("Bài nộp không có nội dung văn bản để AI chấm.");
        }

        int calculatedWords = countWords(rawContent);

        // Lấy hoặc khởi tạo WritingAssessment
        WritingAssessment assessment = assessmentRepository.findBySubmissionId(submissionId)
                .orElseGet(() -> WritingAssessment.builder()
                        .submission(submission)
                        .assignment(assignment)
                        .student(student)
                        .status("QUEUED")
                        .maxScore(assignment.getMaxScore())
                        .aiModel(geminiModel)
                        .version(1)
                        .build());

        // Nếu đã có kết quả trước đó và đây là re-grade: lưu version cũ vào lịch sử audit trail
        if (isRegrade && assessment.getCurrentResultJson() != null) {
            saveVersionHistory(assessment, "AI", "Lưu trước khi AI chấm lại phiên bản mới", requestedBy);
            assessment.setVersion(assessment.getVersion() + 1);
        }

        // Kiểm tra duplicate: nếu không phải regrade và bài đã chấm xong với cùng nội dung -> return kết quả
        if (!isRegrade && "COMPLETED".equals(assessment.getStatus()) && assessment.getCurrentResultJson() != null) {
            log.info("Submission {} đã được chấm hợp lệ trước đó, bỏ qua gọi lại AI.", submissionId);
            return toResponseDto(assessment, true);
        }

        // Kiểm tra rate limiter (chỉ áp dụng nếu do học sinh tự kích hoạt)
        boolean isTeacherOrAdmin = requestedBy != null &&
                (requestedBy.getRole() == Role.TEACHER || requestedBy.getRole() == Role.ADMIN || requestedBy.getRole() == Role.TEACHING_ASSISTANT);

        if (!isTeacherOrAdmin && !rateLimiter.tryAcquire(student.getId())) {
            assessment.setStatus("FAILED");
            assessment.setErrorMessage("Hệ thống đang giới hạn số lượt chấm tự động. Vui lòng chờ vài phút.");
            assessmentRepository.save(assessment);
            throw new BadRequestException("Hệ thống đang giới hạn số lượt chấm tự động. Vui lòng thử lại sau.");
        }

        assessment.setStatus("GRADING");
        assessment.setWordCount(calculatedWords);
        assessment.setErrorMessage(null);
        assessment = assessmentRepository.save(assessment);

        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            assessment.setStatus("FAILED");
            assessment.setErrorMessage("Gemini API key chưa được cấu hình trên hệ thống. Vui lòng liên hệ quản trị viên.");
            assessmentRepository.save(assessment);
            throw new BadRequestException("Gemini API key chưa được cấu hình.");
        }

        // Gọi AI chấm với cơ chế retry
        WritingGradingResultDto gradingResult = null;
        String rawJson = null;
        Exception lastException = null;

        for (int attempt = 1; attempt <= 2; attempt++) {
            try {
                rawJson = callGeminiApi(assignment, student, studentText, calculatedWords);
                gradingResult = objectMapper.readValue(rawJson, WritingGradingResultDto.class);
                validateAndNormalizeResult(gradingResult, assignment.getMaxScore());
                break; // Thành công
            } catch (Exception e) {
                lastException = e;
                log.warn("Lần gọi AI thứ {} thất bại cho submission {}: {}", attempt, submissionId, e.getMessage());
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException ignored) {}
            }
        }

        if (gradingResult == null) {
            assessment.setStatus("FAILED");
            assessment.setErrorMessage("AI không thể trả về kết quả hợp lệ: " + (lastException != null ? lastException.getMessage() : "Không rõ"));
            assessmentRepository.save(assessment);
            throw new BadRequestException("Không thể hoàn tất chấm AI: " + assessment.getErrorMessage());
        }

        // Lưu kết quả thành công
        assessment.setStatus("COMPLETED");
        assessment.setOriginalAiResultJson(rawJson);
        assessment.setCurrentResultJson(rawJson);
        assessment.setOverallScore(gradingResult.getOverall().getScore());
        assessment.setMaxScore(assignment.getMaxScore());
        assessment.setExpectedLevel(gradingResult.getLevelAssessment() != null ? gradingResult.getLevelAssessment().getExpectedLevel() : null);
        assessment.setEstimatedLevel(gradingResult.getLevelAssessment() != null ? gradingResult.getLevelAssessment().getEstimatedPerformanceLevel() : null);
        assessment.setCompletedAt(LocalDateTime.now());
        assessment.setErrorMessage(null);

        WritingAssessment savedAssessment = assessmentRepository.save(assessment);

        // Lưu bản snapshot phiên bản mới vào audit log
        saveVersionHistory(savedAssessment, "AI", "AI chấm bài tự động (Phiên bản " + savedAssessment.getVersion() + ")", requestedBy);

        // Cập nhật điểm nháp vào AssignmentSubmission để hiển thị cho giáo viên (status submission vẫn là PENDING cho tới khi giáo viên duyệt)
        double scaledScore = (gradingResult.getOverall().getScore() / 10.0) * assignment.getMaxScore();
        submission.setScore(Math.round(scaledScore * 10.0) / 10.0);
        if (gradingResult.getStudentFeedback() != null && gradingResult.getStudentFeedback().getPositive() != null) {
            submission.setFeedback(gradingResult.getStudentFeedback().getPositive());
        }
        submissionRepository.save(submission);

        log.info("Chấm AI thành công cho submissionId={}, score={}/{}", submissionId, submission.getScore(), assignment.getMaxScore());
        return toResponseDto(savedAssessment, true);
    }

    /**
     * Giáo viên chủ động yêu cầu chấm lại (Re-grade with AI).
     */
    @Transactional
    public WritingAssessmentResponseDto regradeSubmission(UUID submissionId, User teacher) {
        AssignmentSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài nộp"));

        validateTeacherPermission(submission.getAssignment(), teacher);
        return gradeSubmissionSync(submissionId, true, teacher);
    }

    /**
     * Giáo viên chỉnh sửa kết quả chấm và/hoặc chốt điểm chính thức.
     */
    @Transactional
    public WritingAssessmentResponseDto updateTeacherAssessment(UUID submissionId, UpdateAssessmentRequest request, User teacher) {
        AssignmentSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài nộp: " + submissionId));

        Assignment assignment = submission.getAssignment();
        validateTeacherPermission(assignment, teacher);

        WritingAssessment assessment = assessmentRepository.findBySubmissionId(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Chưa có bản chấm AI cho bài nộp này"));

        WritingGradingResultDto updatedResult = request.getResult();
        if (updatedResult == null) {
            throw new BadRequestException("Nội dung kết quả chấm không được để trống");
        }

        validateAndNormalizeResult(updatedResult, assignment.getMaxScore());

        // Tăng version và lưu snapshot chỉnh sửa của giáo viên vào lịch sử
        assessment.setVersion(assessment.getVersion() + 1);
        try {
            String updatedJson = objectMapper.writeValueAsString(updatedResult);
            assessment.setCurrentResultJson(updatedJson);
        } catch (JsonProcessingException e) {
            throw new BadRequestException("Lỗi định dạng dữ liệu chỉnh sửa: " + e.getMessage());
        }

        // Tính điểm chốt
        double finalScore;
        if (request.getFinalScore() != null) {
            if (request.getFinalScore() < 0 || request.getFinalScore() > assignment.getMaxScore()) {
                throw new BadRequestException("Điểm không được vượt quá 0 - " + assignment.getMaxScore());
            }
            finalScore = request.getFinalScore();
        } else {
            finalScore = (updatedResult.getOverall().getScore() / 10.0) * assignment.getMaxScore();
        }
        finalScore = Math.round(finalScore * 10.0) / 10.0;

        assessment.setStatus("TEACHER_EDITED");
        assessment.setOverallScore(updatedResult.getOverall().getScore());
        assessment.setLastEditedAt(LocalDateTime.now());
        assessment.setLastEditedBy(teacher);

        WritingAssessment savedAssessment = assessmentRepository.save(assessment);

        String note = request.getNote() != null ? request.getNote() : "Giáo viên duyệt và chỉnh sửa đánh giá";
        saveVersionHistory(savedAssessment, "TEACHER", note, teacher);

        // Nếu publishToStudent = true: chốt điểm submission thành GRADED và gửi thông báo
        if (Boolean.TRUE.equals(request.getPublishToStudent())) {
            submission.setScore(finalScore);
            submission.setStatus("GRADED");
            submission.setGradedAt(LocalDateTime.now());

            String teacherSummaryText = "";
            if (updatedResult.getTeacherSummary() != null && updatedResult.getTeacherSummary().getOverallComment() != null) {
                teacherSummaryText = updatedResult.getTeacherSummary().getOverallComment();
            } else if (updatedResult.getStudentFeedback() != null && updatedResult.getStudentFeedback().getPositive() != null) {
                teacherSummaryText = updatedResult.getStudentFeedback().getPositive();
            }
            submission.setFeedback(teacherSummaryText);
            submissionRepository.save(submission);

            // Gửi thông báo cho học sinh
            String link = assignment.getCourse() != null
                    ? "/courses/" + assignment.getCourse().getId() + "/assignments/" + assignment.getId()
                    : "/classes/" + (assignment.getClassroom() != null ? assignment.getClassroom().getId() : "") + "/classwork";

            notificationService.sendNotification(
                    submission.getStudent(),
                    "Đã có điểm bài tập: " + assignment.getTitle(),
                    "Giáo viên đã chấm bài viết của bạn. Điểm số: " + finalScore + "/" + assignment.getMaxScore() + "đ.",
                    link,
                    NotificationType.ASSIGNMENT,
                    teacher,
                    "ASSIGNMENT_GRADED",
                    submission.getId().toString()
            );
        }

        return toResponseDto(savedAssessment, true);
    }

    /**
     * Lấy chi tiết đánh giá chấm bài cho một submission.
     */
    @Transactional(readOnly = true)
    public WritingAssessmentResponseDto getAssessmentBySubmissionId(UUID submissionId, User currentUser) {
        AssignmentSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài nộp"));

        boolean isStudent = currentUser.getId().equals(submission.getStudent().getId());
        boolean isTeacher = canManageAssignment(submission.getAssignment(), currentUser);

        if (!isStudent && !isTeacher) {
            throw new BadRequestException("Bạn không có quyền xem bài nộp này");
        }

        Optional<WritingAssessment> assessmentOpt = assessmentRepository.findBySubmissionId(submissionId);
        if (assessmentOpt.isEmpty()) {
            return WritingAssessmentResponseDto.builder()
                    .submissionId(submissionId)
                    .assignmentId(submission.getAssignment().getId())
                    .studentId(submission.getStudent().getId())
                    .studentName(submission.getStudent().getFullName())
                    .status("NOT_GRADED")
                    .wordCount(countWords(submission.getContent()))
                    .maxScore(submission.getAssignment().getMaxScore())
                    .build();
        }

        WritingAssessment assessment = assessmentOpt.get();
        // Nếu là học sinh: chỉ hiển thị feedback sau khi đã graded hoặc completed, và ẩn teacherSummary nội bộ
        return toResponseDto(assessment, isTeacher);
    }

    /**
     * Chấm hàng loạt bài nộp (Batch AI Grading).
     */
    public BatchAiGradingStatusResponse batchGradeSubmissions(UUID assignmentId, List<UUID> submissionIds, User teacher) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài tập: " + assignmentId));

        validateTeacherPermission(assignment, teacher);

        List<AssignmentSubmission> targetSubmissions;
        if (submissionIds != null && !submissionIds.isEmpty()) {
            targetSubmissions = submissionRepository.findAllById(submissionIds);
        } else {
            targetSubmissions = submissionRepository.findByAssignmentOrderBySubmittedAtDesc(assignment).stream()
                    .filter(s -> !"GRADED".equals(s.getStatus()))
                    .toList();
        }

        String batchId = UUID.randomUUID().toString();
        BatchAiGradingStatusResponse batchStatus = BatchAiGradingStatusResponse.builder()
                .batchId(batchId)
                .assignmentId(assignmentId)
                .total(targetSubmissions.size())
                .completed(0)
                .successful(0)
                .failed(0)
                .inProgress(targetSubmissions.size())
                .isDone(targetSubmissions.isEmpty())
                .items(new ArrayList<>())
                .build();

        for (AssignmentSubmission sub : targetSubmissions) {
            batchStatus.getItems().add(BatchAiGradingStatusResponse.BatchItemStatusDto.builder()
                    .submissionId(sub.getId())
                    .studentName(sub.getStudent().getFullName())
                    .status("QUEUED")
                    .build());
        }

        batchJobs.put(batchId, batchStatus);

        // Chạy tiến trình batch ngầm
        runBatchGradingAsync(batchId, targetSubmissions, teacher);

        return batchStatus;
    }

    /**
     * Lấy tiến trình chấm hàng loạt hiện tại.
     */
    public BatchAiGradingStatusResponse getBatchStatus(String batchId) {
        BatchAiGradingStatusResponse status = batchJobs.get(batchId);
        if (status == null) {
            throw new ResourceNotFoundException("Không tìm thấy phiên chấm hàng loạt: " + batchId);
        }
        return status;
    }

    @Async
    protected void runBatchGradingAsync(String batchId, List<AssignmentSubmission> submissions, User teacher) {
        BatchAiGradingStatusResponse batchStatus = batchJobs.get(batchId);
        if (batchStatus == null) return;

        for (AssignmentSubmission sub : submissions) {
            BatchAiGradingStatusResponse.BatchItemStatusDto itemStatus = batchStatus.getItems().stream()
                    .filter(i -> i.getSubmissionId().equals(sub.getId()))
                    .findFirst().orElse(null);

            if (itemStatus != null) {
                itemStatus.setStatus("GRADING");
            }

            try {
                WritingAssessmentResponseDto res = gradeSubmissionSync(sub.getId(), false, teacher);
                if (itemStatus != null) {
                    itemStatus.setStatus("COMPLETED");
                    itemStatus.setScore(res.getOverallScore());
                }
                batchStatus.setSuccessful(batchStatus.getSuccessful() + 1);
            } catch (Exception e) {
                log.error("Batch grade failed for submission {}: {}", sub.getId(), e.getMessage());
                if (itemStatus != null) {
                    itemStatus.setStatus("FAILED");
                    itemStatus.setErrorMessage(e.getMessage());
                }
                batchStatus.setFailed(batchStatus.getFailed() + 1);
            } finally {
                batchStatus.setCompleted(batchStatus.getCompleted() + 1);
                batchStatus.setInProgress(Math.max(0, batchStatus.getTotal() - batchStatus.getCompleted()));
                batchStatus.setDone(batchStatus.getCompleted() >= batchStatus.getTotal());
            }

            // Khoảng nghỉ nhỏ để tránh chạm limit API của nhà mạng
            try {
                Thread.sleep(500);
            } catch (InterruptedException ignored) {}
        }
    }

    // --- Private Helper Methods ---

    private String callGeminiApi(Assignment assignment, User student, String studentAnswer, int wordCount) {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + geminiModel + ":generateContent";
        String prompt = buildGradingPrompt(assignment, student, studentAnswer, wordCount);

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(Map.of("text", prompt)))
                ),
                "generationConfig", Map.of(
                        "responseMimeType", "application/json",
                        "temperature", 0.2
                )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-goog-api-key", geminiApiKey);
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        @SuppressWarnings("unchecked")
        Map<String, Object> response = restTemplate.postForObject(url, request, Map.class);
        String text = extractText(response);
        if (text == null || text.isBlank()) {
            throw new RuntimeException("Gemini trả về phản hồi rỗng.");
        }
        return text.trim();
    }

    private String buildGradingPrompt(Assignment assignment, User student, String studentAnswer, int wordCount) {
        String expectedLevel = assignment.getLanguageLevel() != null && !assignment.getLanguageLevel().isBlank()
                ? assignment.getLanguageLevel()
                : "B1";

        String instructions = assignment.getInstructions() != null && !assignment.getInstructions().isBlank()
                ? assignment.getInstructions()
                : (assignment.getDescription() != null ? assignment.getDescription() : "Không có hướng dẫn cụ thể");

        String wordCountReq = "";
        if (assignment.getMinWordCount() != null || assignment.getMaxWordCount() != null) {
            wordCountReq = String.format("Yêu cầu số từ: Tối thiểu %s từ, tối đa %s từ.",
                    assignment.getMinWordCount() != null ? assignment.getMinWordCount() : "không giới hạn",
                    assignment.getMaxWordCount() != null ? assignment.getMaxWordCount() : "không giới hạn");
        }

        String rubricConfig = assignment.getRubricConfig() != null && !assignment.getRubricConfig().isBlank()
                ? "Rubric riêng của giáo viên: " + assignment.getRubricConfig()
                : "Sử dụng tiêu chuẩn 4 tiêu chí mặc định (Task Achievement, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy).";

        String expectedAnswer = assignment.getExpectedAnswer() != null && !assignment.getExpectedAnswer().isBlank()
                ? "Bài mẫu / Ý cần có: " + assignment.getExpectedAnswer()
                : "";

        String className = assignment.getClassroom() != null ? assignment.getClassroom().getName() : "Không xác định";
        String subject = assignment.getClassroom() != null && assignment.getClassroom().getSubject() != null
                ? assignment.getClassroom().getSubject()
                : "Tiếng Anh";

        return String.format("""
            Bạn là một Giám khảo & Chuyên gia khảo thí ngôn ngữ quốc tế giàu kinh nghiệm, đồng thời là giáo viên tâm huyết.
            Nhiệm vụ: Chấm điểm bài viết của học sinh một cách khách quan, chính xác theo khung CEFR và cung cấp nhận xét chi tiết, mang tính xây dựng.

            === CONTEXT BÀI VIẾT ===
            - Đề bài (Title/Prompt): %s
            - Hướng dẫn & Yêu cầu: %s
            - %s
            - Số từ học sinh đã viết (Backend tính độc lập): %d từ
            - Trình độ kỳ vọng (Expected CEFR): %s
            - Lớp học: %s | Môn: %s
            - %s
            - %s

            === BÀI LÀM CỦA HỌC SINH ===
            \"\"\"
            %s
            \"\"\"

            === QUY TẮC CHẤM ĐIỂM NGHIÊM NGẶT (LEVEL-AWARE & ANTI-HALLUCINATION) ===
            1. Đánh giá dựa trên trình độ kỳ vọng (%s): Đánh giá học sinh thể hiện tốt ra sao SO VỚI TRÌNH ĐỘ KỲ VỌNG, không so sánh với người bản xứ C2 nếu học sinh ở trình độ A2/B1. Không trừ điểm học sinh A1/A2 chỉ vì không dùng câu phức hoặc từ vựng hàn lâm.
            2. KHÔNG TỰ BỊA LỖI (Zero Hallucination): Tuyệt đối KHÔNG đánh dấu sai nếu cách dùng là văn phong hợp lệ, khác biệt Anh-Anh/Anh-Mỹ (colour vs color, flat vs apartment), hoặc cách diễn đạt thông dụng tương đương (football vs soccer). Chỉ ghi nhận lỗi khi có sai sót ngữ pháp, chính tả, dấu câu, dùng từ sai nghĩa hoặc lạc đề rõ ràng.
            3. 4 TIÊU CHÍ (Thang điểm 0.0 - 10.0 cho mỗi tiêu chí):
               - taskAchievement (25%%): Trả lời đúng trọng tâm câu hỏi, đủ ý, đúng format, đáp ứng yêu cầu số từ.
               - coherenceAndCohesion (25%%): Bố cục đoạn, tính mạch lạc, liên kết câu tự nhiên (không lạm dụng máy móc liên từ).
               - lexicalResource (25%%): Độ chính xác của từ vựng, ngữ cảnh phù hợp, hạn chế lặp từ.
               - grammaticalRangeAndAccuracy (25%%): Sự chính xác của ngữ pháp, thì, hòa hợp chủ-vị, dấu câu.
            4. TÍNH ĐIỂM TỔNG:
               overall.score = (taskAchievement.score + coherenceAndCohesion.score + lexicalResource.score + grammaticalRangeAndAccuracy.score) / 4
               overall.maxScore = 10.0
               overall.percentage = overall.score * 10
            5. ĐIỂM MẠNH (strengths): Phải kèm bằng chứng dẫn chứng cụ thể từ bài viết (evidence).
            6. ĐIỀU CẦN CẢI THIỆN (improvements): Phải có tính hành động (action) rõ ràng và mức ưu tiên (high/medium/low).
            7. NGÔN NGỮ ĐẦU RA:
               - Toàn bộ nhận xét, giải thích lỗi (explanation), strengths, improvements, teacherSummary, studentFeedback PHẢI VIẾT BẰNG TIẾNG VIỆT rõ ràng, sư phạm, thân thiện.
               - Giữ nguyên văn tiếng Anh ở phần lỗi: original (từ/câu học sinh viết sai) và correction (cách sửa đúng).
            8. ĐỊNH DẠNG JSON TUYỆT ĐỐI: Chỉ trả về duy nhất 1 JSON object hợp lệ theo schema bên dưới, không bao bọc bằng markdown, không có bất kỳ văn bản nào ngoài JSON.

            === JSON SCHEMA BẮT BUỘC ===
            {
              "version": "1.0",
              "gradingStatus": "COMPLETED",
              "overall": {
                "score": 8.0,
                "maxScore": 10.0,
                "percentage": 80.0
              },
              "levelAssessment": {
                "expectedLevel": "%s",
                "estimatedPerformanceLevel": "A2|B1|B2|C1",
                "levelComment": "Nhận xét ngắn về trình độ thể hiện của học sinh..."
              },
              "criteria": {
                "taskAchievement": {
                  "score": 8.0,
                  "maxScore": 10.0,
                  "strengths": ["Đã trả lời đủ các ý trong đề bài."],
                  "weaknesses": ["Ý kết bài chưa thực sự trọn vẹn."],
                  "feedback": "Nhận xét chi tiết..."
                },
                "coherenceAndCohesion": {
                  "score": 7.5,
                  "maxScore": 10.0,
                  "strengths": ["Bố cục đoạn rõ ràng."],
                  "weaknesses": ["Cần liên kết mượt mà hơn giữa đoạn 1 và 2."],
                  "feedback": "Nhận xét chi tiết..."
                },
                "lexicalResource": {
                  "score": 8.0,
                  "maxScore": 10.0,
                  "strengths": ["Dùng từ phù hợp ngữ cảnh."],
                  "weaknesses": ["Còn lặp từ 'good' nhiều lần."],
                  "feedback": "Nhận xét chi tiết..."
                },
                "grammaticalRangeAndAccuracy": {
                  "score": 7.5,
                  "maxScore": 10.0,
                  "strengths": ["Cấu trúc thì hiện tại đơn chính xác."],
                  "weaknesses": ["Một số lỗi chia động từ quá khứ."],
                  "feedback": "Nhận xét chi tiết..."
                }
              },
              "errors": [
                {
                  "id": "err-1",
                  "category": "grammar|vocabulary|spelling|punctuation|coherence|task|style|word_choice",
                  "severity": "minor|major",
                  "original": "nguyên văn chỗ sai trong bài",
                  "correction": "cách sửa chính xác",
                  "explanation": "giải thích vì sao sai và quy tắc bằng tiếng Việt",
                  "location": { "start": 0, "end": 10 }
                }
              ],
              "strengths": [
                {
                  "category": "task",
                  "description": "Mô tả điểm mạnh",
                  "evidence": "Bằng chứng trích từ bài viết"
                }
              ],
              "improvements": [
                {
                  "priority": "high",
                  "category": "grammar",
                  "description": "Mô tả điều cần cải thiện",
                  "action": "Hành động hoặc ví dụ cụ thể để sửa"
                }
              ],
              "teacherSummary": {
                "overallComment": "Tóm tắt nhanh cho giáo viên nắm được bài trong 5 giây",
                "mainStrength": "Điểm mạnh nổi bật nhất",
                "mainWeakness": "Điểm yếu then chốt cần lưu ý",
                "recommendedFocus": "Trọng tâm cần rèn luyện tiếp theo"
              },
              "studentFeedback": {
                "positive": "Lời khen ngợi và động viên học sinh tích cực",
                "nextStep": "Bước thực hành tiếp theo dành cho em"
              }
            }
            """,
                assignment.getTitle(),
                instructions,
                wordCountReq,
                wordCount,
                expectedLevel,
                className,
                subject,
                rubricConfig,
                expectedAnswer,
                studentAnswer,
                expectedLevel,
                expectedLevel
        );
    }

    private void validateAndNormalizeResult(WritingGradingResultDto r, Double assignmentMaxScore) {
        if (r.getOverall() == null) {
            r.setOverall(new WritingGradingResultDto.OverallScoreDto(0.0, 10.0, 0.0));
        }

        if (r.getCriteria() == null) {
            throw new BadRequestException("Thiếu dữ liệu tiêu chí đánh giá criteria");
        }

        WritingGradingResultDto.CriteriaDto c = r.getCriteria();
        if (c.getTaskAchievement() == null || c.getCoherenceAndCohesion() == null ||
            c.getLexicalResource() == null || c.getGrammaticalRangeAndAccuracy() == null) {
            throw new BadRequestException("Bắt buộc phải có đủ 4 tiêu chí đánh giá");
        }

        normalizeCriterion(c.getTaskAchievement());
        normalizeCriterion(c.getCoherenceAndCohesion());
        normalizeCriterion(c.getLexicalResource());
        normalizeCriterion(c.getGrammaticalRangeAndAccuracy());

        // Tính lại điểm overall chuẩn hóa
        double avg = (c.getTaskAchievement().getScore() +
                      c.getCoherenceAndCohesion().getScore() +
                      c.getLexicalResource().getScore() +
                      c.getGrammaticalRangeAndAccuracy().getScore()) / 4.0;

        avg = Math.round(avg * 10.0) / 10.0;
        r.getOverall().setScore(avg);
        r.getOverall().setMaxScore(10.0);
        r.getOverall().setPercentage(Math.round(avg * 10.0 * 10.0) / 10.0);

        if (r.getErrors() == null) r.setErrors(new ArrayList<>());
        if (r.getStrengths() == null) r.setStrengths(new ArrayList<>());
        if (r.getImprovements() == null) r.setImprovements(new ArrayList<>());
    }

    private void normalizeCriterion(WritingGradingResultDto.CriterionDetailDto dto) {
        if (dto == null) return;
        double s = dto.getScore() != null ? dto.getScore() : 0.0;
        dto.setScore(Math.max(0.0, Math.min(10.0, Math.round(s * 10.0) / 10.0)));
        dto.setMaxScore(10.0);
        if (dto.getStrengths() == null) dto.setStrengths(new ArrayList<>());
        if (dto.getWeaknesses() == null) dto.setWeaknesses(new ArrayList<>());
        if (dto.getFeedback() == null) dto.setFeedback("");
    }

    private void saveVersionHistory(WritingAssessment assessment, String source, String note, User creator) {
        try {
            WritingAssessmentVersion versionLog = WritingAssessmentVersion.builder()
                    .assessment(assessment)
                    .version(assessment.getVersion())
                    .source(source)
                    .resultJson(assessment.getCurrentResultJson() != null ? assessment.getCurrentResultJson() : "")
                    .overallScore(assessment.getOverallScore())
                    .createdBy(creator)
                    .note(note)
                    .build();
            versionRepository.save(versionLog);
        } catch (Exception e) {
            log.warn("Không thể ghi log phiên bản assessment {}: {}", assessment.getId(), e.getMessage());
        }
    }

    private WritingAssessmentResponseDto toResponseDto(WritingAssessment a, boolean isTeacher) {
        WritingGradingResultDto currentResult = null;
        WritingGradingResultDto originalResult = null;

        try {
            if (a.getCurrentResultJson() != null && !a.getCurrentResultJson().isBlank()) {
                currentResult = objectMapper.readValue(a.getCurrentResultJson(), WritingGradingResultDto.class);
            }
            if (a.getOriginalAiResultJson() != null && !a.getOriginalAiResultJson().isBlank()) {
                originalResult = objectMapper.readValue(a.getOriginalAiResultJson(), WritingGradingResultDto.class);
            }
        } catch (Exception e) {
            log.warn("Không parse được JSON assessment {}: {}", a.getId(), e.getMessage());
        }

        // Nếu học sinh xem: không hiển thị teacherSummary nội bộ của giáo viên
        if (!isTeacher && currentResult != null) {
            currentResult.setTeacherSummary(null);
        }

        List<WritingAssessmentResponseDto.AssessmentVersionSummaryDto> versions = isTeacher
                ? versionRepository.findByAssessmentOrderByVersionDesc(a).stream()
                .map(v -> WritingAssessmentResponseDto.AssessmentVersionSummaryDto.builder()
                        .id(v.getId())
                        .version(v.getVersion())
                        .source(v.getSource())
                        .overallScore(v.getOverallScore())
                        .createdAt(v.getCreatedAt())
                        .createdByName(v.getCreatedBy() != null ? v.getCreatedBy().getFullName() : "Hệ thống")
                        .note(v.getNote())
                        .build())
                .toList()
                : Collections.emptyList();

        Assignment assignment = a.getAssignment();

        return WritingAssessmentResponseDto.builder()
                .id(a.getId())
                .submissionId(a.getSubmission().getId())
                .assignmentId(assignment.getId())
                .studentId(a.getStudent().getId())
                .studentName(a.getStudent().getFullName())
                .studentEmail(a.getStudent().getEmail())
                .status(a.getStatus())
                .overallScore(a.getOverallScore())
                .maxScore(a.getMaxScore())
                .percentage(a.getOverallScore() != null ? a.getOverallScore() * 10 : null)
                .wordCount(a.getWordCount())
                .requiredMinWords(assignment.getMinWordCount())
                .requiredMaxWords(assignment.getMaxWordCount())
                .expectedLevel(a.getExpectedLevel())
                .estimatedLevel(a.getEstimatedLevel())
                .result(currentResult)
                .originalAiResult(isTeacher ? originalResult : null)
                .version(a.getVersion())
                .aiModel(a.getAiModel())
                .errorMessage(isTeacher ? a.getErrorMessage() : "Không thể hoàn thành chấm bài.")
                .createdAt(a.getCreatedAt())
                .completedAt(a.getCompletedAt())
                .lastEditedAt(a.getLastEditedAt())
                .lastEditedByName(a.getLastEditedBy() != null ? a.getLastEditedBy().getFullName() : null)
                .versions(versions)
                .build();
    }

    private void validateTeacherPermission(Assignment assignment, User user) {
        if (!canManageAssignment(assignment, user)) {
            throw new BadRequestException("Bạn không có quyền quản lý hoặc chấm bài tập này.");
        }
    }

    private boolean canManageAssignment(Assignment assignment, User user) {
        if (user.getRole() == Role.ADMIN) return true;
        if (assignment.getTeacher() != null && assignment.getTeacher().getId().equals(user.getId())) return true;
        if (assignment.getCourse() != null && assignment.getCourse().getTeacher().getId().equals(user.getId())) return true;
        if (assignment.getClassroom() != null && assignment.getClassroom().getTeacher() != null &&
                assignment.getClassroom().getTeacher().getId().equals(user.getId())) return true;
        return false;
    }

    @SuppressWarnings("unchecked")
    private String extractText(Map<String, Object> response) {
        if (response == null) return null;
        List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
        if (candidates == null || candidates.isEmpty()) return null;
        Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
        if (content == null) return null;
        List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
        if (parts == null || parts.isEmpty()) return null;
        Object text = parts.get(0).get("text");
        return text != null ? text.toString() : null;
    }
}
