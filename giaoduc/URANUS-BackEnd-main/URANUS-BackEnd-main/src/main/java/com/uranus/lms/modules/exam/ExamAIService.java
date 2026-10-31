package com.uranus.lms.modules.exam;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExamAIService {

    @Value("${app.gemini.api-key:}")
    private String geminiApiKey;

    @Value("${app.gemini.model:gemini-3.5-flash-lite}")
    private String geminiModel;

    private final AiRateLimiter rateLimiter;

    private static final int CONNECT_TIMEOUT_MS = 5_000;
    private static final int READ_TIMEOUT_MS = 20_000;

    private final RestTemplate restTemplate = buildRestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static RestTemplate buildRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(CONNECT_TIMEOUT_MS);
        factory.setReadTimeout(READ_TIMEOUT_MS);
        return new RestTemplate(factory);
    }

    /**
     * Chấm nháp một câu tự luận bằng AI. Đây LUÔN LÀ ĐIỂM NHÁP — giáo viên phải duyệt
     * (xem {@code StudentAnswer.reviewed}) trước khi điểm được xem là chính thức.
     */
    public EssayGradeResult gradeEssay(String questionContent, String studentAnswer, double maxPoints, String subject, UUID studentId) {
        if (studentAnswer == null || studentAnswer.trim().isEmpty()) {
            return EssayGradeResult.simple(0.0, "Bạn chưa nhập câu trả lời.");
        }

        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            log.warn("Gemini API key chưa được cấu hình (biến môi trường GEMINI_API_KEY) — bỏ qua chấm AI.");
            return EssayGradeResult.simple(0.0, "Chưa cấu hình AI chấm bài. Bài sẽ được giáo viên chấm thủ công.");
        }

        if (!rateLimiter.tryAcquire(studentId)) {
            log.warn("Học sinh {} vượt giới hạn số lượt chấm AI trong 10 phút.", studentId);
            return EssayGradeResult.simple(0.0, "Hệ thống đang giới hạn số lượt chấm tự động. Giáo viên sẽ chấm tay bài này.");
        }

        try {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/" + geminiModel + ":generateContent";
            String prompt = buildPrompt(questionContent, studentAnswer, maxPoints, subject);

            Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                    Map.of("parts", List.of(Map.of("text", prompt)))
                ),
                "generationConfig", Map.of(
                    "responseMimeType", "application/json",
                    "responseSchema", Map.of(
                        "type", "OBJECT",
                        "properties", Map.of(
                            "score", Map.of("type", "NUMBER"),
                            "summary", Map.of("type", "STRING"),
                            "strengths", Map.of("type", "ARRAY", "items", Map.of("type", "STRING")),
                            "errors", Map.of(
                                "type", "ARRAY",
                                "items", Map.of(
                                    "type", "OBJECT",
                                    "properties", Map.of(
                                        "original", Map.of("type", "STRING"),
                                        "corrected", Map.of("type", "STRING"),
                                        "type", Map.of("type", "STRING")
                                    ),
                                    "required", List.of("original", "corrected", "type")
                                )
                            ),
                            "vocabularySuggestions", Map.of("type", "ARRAY", "items", Map.of("type", "STRING"))
                        ),
                        "required", List.of("score", "summary")
                    )
                )
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-goog-api-key", geminiApiKey);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(url, request, Map.class);

            String jsonText = extractText(response);
            if (jsonText == null) {
                log.warn("Gemini không trả về nội dung hợp lệ cho câu hỏi: {}", questionContent);
                return EssayGradeResult.simple(0.0, "AI không thể chấm bài này. Giáo viên sẽ chấm tay.");
            }

            EssayGradeResult result = objectMapper.readValue(jsonText, EssayGradeResult.class);
            result.score = Math.max(0.0, Math.min(result.score, maxPoints));
            if (result.errors != null) {
                for (ErrorItem item : result.errors) {
                    item.type = normalizeErrorType(item.type);
                }
            }
            return result;
        } catch (RestClientException e) {
            log.error("Lỗi gọi Gemini API khi chấm bài tự luận", e);
            return EssayGradeResult.simple(0.0, "AI đang quá tải hoặc có lỗi xảy ra. Bài thi sẽ được chấm tay sau.");
        } catch (Exception e) {
            log.error("Lỗi xử lý kết quả chấm AI", e);
            return EssayGradeResult.simple(0.0, "Không thể chấm điểm tự động. Bài thi sẽ được chấm tay sau.");
        }
    }

    /** Chuỗi JSON dùng để lưu vào cột aiFeedback — frontend tự parse lại thành các section. */
    public String serializeFeedback(EssayGradeResult result) {
        try {
            return objectMapper.writeValueAsString(result);
        } catch (Exception e) {
            return result.summary;
        }
    }

    private String normalizeErrorType(String rawType) {
        if (rawType == null || rawType.isBlank()) return "Ngữ pháp";
        String lower = rawType.toLowerCase();
        if (lower.contains("chính tả") || lower.contains("spelling")) return "Chính tả";
        if (lower.contains("từ vựng") || lower.contains("vocabulary") || lower.contains("word")) return "Từ vựng";
        if (lower.contains("nội dung") || lower.contains("content") || lower.contains("task")) return "Nội dung";
        return "Ngữ pháp";
    }

    private String buildPrompt(String questionContent, String studentAnswer, double maxPoints, String subject) {
        String subjectLabel = (subject == null || subject.isBlank()) ? "tiếng Anh / môn học liên quan" : subject;
        return String.format(
            "Bạn là một chuyên gia khảo thí và giám khảo giáo dục giàu kinh nghiệm môn %s cho hệ thống Uranus LMS.\n" +
            "Nhiệm vụ của bạn là đánh giá công tâm, chính xác, có tính sư phạm cao cho câu trả lời tự luận của học sinh.\n" +
            "Kết quả của bạn là gợi ý chấm nháp có cấu trúc để giáo viên xem xét, chỉnh sửa và duyệt điểm chính thức.\n\n" +
            "--- DỮ LIỆU ĐỀ BÀI VÀ BÀI LÀM ---\n" +
            "Đề bài / Câu hỏi: %s\n" +
            "Bài làm của học sinh: %s\n" +
            "Thang điểm tối đa: %.2f\n\n" +
            "--- QUY TRÌNH PHÂN TÍCH & BẮT LỖI TỪNG CÂU (BẮT BUỘC) ---\n" +
            "1. BẮT BUỘC rà soát từng câu trong bài viết của học sinh từ đầu đến cuối để phát hiện mọi lỗi sai.\n" +
            "2. MỌI LỖI SAI sau đây BẮT BUỘC phải được trích xuất vào danh sách 'errors':\n" +
            "   - Hòa hợp chủ ngữ - động từ (subject-verb agreement): ví dụ 'subject are' -> 'subject is', 'it make' -> 'it makes'.\n" +
            "   - Thì của động từ (verb tense): ví dụ 'have learn' -> 'have learned / have been learning', 'go' -> 'went', 'teach' -> 'taught'.\n" +
            "   - Giới từ thời gian: ví dụ 'since three years' -> 'for three years'.\n" +
            "   - Dạng danh từ số nhiều: ví dụ 'many new word' -> 'many new words'.\n" +
            "   - Cấu trúc kết hợp từ (collocation): ví dụ 'very like' -> 'really like / like very much'.\n" +
            "   - Dạng động từ theo sau: ví dụ 'want becoming' -> 'want to become'.\n" +
            "3. NGUYÊN TẮC NHẤT QUÁN: Tuyệt đối KHÔNG được nhận xét trong 'summary' là bài viết có lỗi ngữ pháp/thì/hòa hợp mà mảng 'errors' lại để rỗng []. Mọi lỗi đã đề cập trong nhận xét BẮT BUỘC phải có mặt trong 'errors'.\n" +
            "4. Phần trích dẫn lỗi: 'original' giữ nguyên văn chỗ học sinh viết (kể cả tiếng Anh), 'corrected' là cách sửa chuẩn xác, 'type' là một trong: 'Ngữ pháp', 'Từ vựng', 'Chính tả', 'Nội dung'.\n" +
            "5. Mục 'strengths' (Điểm mạnh): Chỉ khen ý tưởng, bố cục hoặc các cấu trúc chuẩn xác. TUYỆT ĐỐI KHÔNG trích dẫn các câu có lỗi ngữ pháp làm minh họa cho điểm mạnh.\n" +
            "6. Toàn bộ 'summary', 'strengths', lý do gợi ý BẮT BUỘC viết bằng tiếng Việt tự nhiên, chuẩn mực sư phạm.\n\n" +
            "--- CẤU TRÚC PHÂN CHIA KẾT QUẢ (STRICT JSON SCHEMA) ---\n" +
            "Trả về đúng JSON theo cấu trúc:\n" +
            "1. score: Điểm số số thực (0.0 đến %.2f) phản ánh chính xác chất lượng hoàn thành câu hỏi.\n" +
            "2. summary: Nhận xét tổng quan súc tích (1-2 câu) đánh giá mức độ đạt yêu cầu, độ mạch lạc và chuẩn xác.\n" +
            "3. strengths: Danh sách 2-4 điểm mạnh cụ thể có dẫn chứng từ bài làm (nội dung đúng trọng tâm, ý tưởng mạch lạc...).\n" +
            "4. errors: Danh sách các lỗi sai thực sự. Mỗi lỗi gồm original, corrected, và type. Nếu bài hoàn hảo 100%% không có bất kỳ lỗi nào, để [].\n" +
            "5. vocabularySuggestions: Danh sách 1-3 gợi ý nâng tầm từ vựng/cụm từ tự nhiên hơn (nếu là môn ngôn ngữ), định dạng: '[từ hiện tại] → [từ nâng cấp] (lý do/ngữ cảnh áp dụng)'.",
            subjectLabel, questionContent, studentAnswer, maxPoints, maxPoints
        );
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

    public static class EssayGradeResult {
        public double score;
        public String summary;
        public List<String> strengths = Collections.emptyList();
        public List<ErrorItem> errors = Collections.emptyList();
        public List<String> vocabularySuggestions = Collections.emptyList();

        public EssayGradeResult() {}

        public static EssayGradeResult simple(double score, String summary) {
            EssayGradeResult r = new EssayGradeResult();
            r.score = score;
            r.summary = summary;
            return r;
        }
    }

    public static class ErrorItem {
        public String original;
        public String corrected;
        public String type;
        public ErrorItem() {}
    }
}
