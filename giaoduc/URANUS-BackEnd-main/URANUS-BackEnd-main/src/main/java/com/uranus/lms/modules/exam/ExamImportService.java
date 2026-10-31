package com.uranus.lms.modules.exam;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.uranus.lms.exception.BadRequestException;
import com.uranus.lms.modules.exam.dto.CreateExamRequest;
import com.uranus.lms.modules.exam.dto.ExamImportQuestionDto;
import com.uranus.lms.modules.exam.dto.ExamImportResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExamImportService {

    private static final int MAX_AI_CHARS = 80_000;

    @Value("${app.gemini.api-key}")
    private String geminiApiKey;

    @Value("${app.gemini.model:gemini-2.0-flash}")
    private String geminiModel;

    private final ObjectMapper objectMapper;

    /** @deprecated use {@link #importWithStructureMapping(MultipartFile)} */
    public List<CreateExamRequest.QuestionDto> importFromPdf(MultipartFile file) {
        return importWithStructureMapping(file).getQuestions();
    }

    /** @deprecated use {@link #importWithStructureMapping(MultipartFile)} */
    public ExamImportResponse importDocument(MultipartFile file) {
        return importWithStructureMapping(file);
    }

    /**
     * Azota-style: extract text from PDF/DOCX and map questions by structure (Câu 1, A/B/C/D, đáp án).
     */
    public ExamImportResponse importWithStructureMapping(MultipartFile file) {
        validateFile(file);
        String fileName = file.getOriginalFilename();
        String lower = fileName.toLowerCase(Locale.ROOT);

        if (!lower.endsWith(".pdf") && !lower.endsWith(".docx")) {
            throw new BadRequestException("Mapping cấu trúc chỉ hỗ trợ file PDF hoặc DOCX có text.");
        }

        try {
            String text = lower.endsWith(".pdf") ? extractTextFromPdf(file) : extractTextFromDocx(file);
            if (text == null || text.isBlank()) {
                throw new BadRequestException(
                        "Không đọc được text trong file. Với đề scan/ảnh, hãy dùng \"Upload scan bằng AI\".");
            }

            ExamParseResult parsed = ExamTextParser.parseStructured(text);
            if (parsed.getQuestions().isEmpty()) {
                throw new BadRequestException(
                        "Không nhận diện được cấu trúc câu hỏi. Đề cần có dạng Câu 1 / A. B. C. D. và bảng đáp án, hoặc thử AI Scan.");
            }

            List<CreateExamRequest.QuestionDto> questions = ExamTextParser.toLegacyQuestions(parsed);
            String format = lower.endsWith(".pdf") ? "PDF" : "DOCX";
            return buildResponse(parsed, questions, format, fileName, "AZOTA",
                    "Đã nhận diện " + parsed.getQuestions().size() + " câu · "
                            + parsed.getPassages().size() + " đoạn đọc. Vui lòng soát lỗi và chọn đáp án.");
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Structure import failed for {}", fileName, e);
            throw new BadRequestException("Lỗi mapping cấu trúc: " + e.getMessage());
        }
    }

    /**
     * AI Scan: Gemini đọc PDF scan, ảnh chụp đề, hoặc file phức tạp.
     */
    public ExamImportResponse importWithAiScan(MultipartFile file) {
        validateFile(file);
        String fileName = file.getOriginalFilename();
        String lower = fileName.toLowerCase(Locale.ROOT);
        String mimeType = resolveMimeType(lower);

        try {
            List<CreateExamRequest.QuestionDto> questions;

            if (mimeType != null) {
                // PDF / ảnh → gửi trực tiếp cho Gemini Vision
                questions = parseWithGeminiVision(file.getBytes(), mimeType, fileName);
            } else if (lower.endsWith(".docx")) {
                String text = extractTextFromDocx(file);
                if (text == null || text.isBlank()) {
                    throw new BadRequestException("File Word trống. Hãy xuất PDF/ảnh đề scan để dùng AI.");
                }
                questions = parseTextWithGemini(text);
            } else {
                throw new BadRequestException("AI Scan hỗ trợ PDF, DOCX, JPG, PNG.");
            }

            if (questions.isEmpty()) {
                throw new BadRequestException("AI không trích xuất được câu hỏi. Thử file rõ hơn hoặc dùng mapping cấu trúc.");
            }

            String format = formatLabel(lower);
            return buildResponse(questions, format, fileName, "AI_SCAN",
                    "AI đã đọc và mapping " + questions.size() + " câu. Vui lòng kiểm tra lại đáp án.");
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("AI scan import failed for {}", fileName, e);
            throw new BadRequestException("Lỗi AI Scan: " + e.getMessage());
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Vui lòng tải lên file đề thi.");
        }
    }

    private String formatLabel(String lower) {
        if (lower.endsWith(".pdf")) return "PDF";
        if (lower.endsWith(".docx")) return "DOCX";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "JPG";
        if (lower.endsWith(".png")) return "PNG";
        return "FILE";
    }

    private String resolveMimeType(String lower) {
        if (lower.endsWith(".pdf")) return "application/pdf";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".png")) return "image/png";
        return null;
    }

    private ExamImportResponse buildResponse(ExamParseResult parsed,
            List<CreateExamRequest.QuestionDto> questions,
            String format, String fileName, String method, String message) {
        int withKey = (int) parsed.getQuestions().stream()
                .filter(q -> q.getOptions() != null && q.getOptions().stream()
                        .filter(o -> Boolean.TRUE.equals(o.getIsCorrect()))
                        .count() == 1)
                .count();

        return ExamImportResponse.builder()
                .questions(questions)
                .structuredQuestions(parsed.getQuestions())
                .passages(parsed.getPassages())
                .sourceFormat(format)
                .fileName(fileName)
                .totalExtracted(questions.size())
                .mappedWithAnswerKey(withKey)
                .parseMethod(method)
                .message(message)
                .build();
    }

    private ExamImportResponse buildResponse(List<CreateExamRequest.QuestionDto> questions,
            String format, String fileName, String method, String message) {
        int withKey = (int) questions.stream()
                .filter(q -> q.getOptions() != null && q.getOptions().stream()
                        .filter(o -> Boolean.TRUE.equals(o.getIsCorrect()))
                        .count() == 1)
                .count();

        return ExamImportResponse.builder()
                .questions(questions)
                .sourceFormat(format)
                .fileName(fileName)
                .totalExtracted(questions.size())
                .mappedWithAnswerKey(withKey)
                .parseMethod(method)
                .message(message)
                .build();
    }

    private String extractTextFromPdf(MultipartFile file) throws IOException {
        try (PDDocument document = Loader.loadPDF(file.getBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        } catch (NoSuchMethodError | Exception e) {
            log.warn("Loader.loadPDF(byte[]) failed, falling back to temp file", e);
            File tempFile = File.createTempFile("exam_import_", ".pdf");
            file.transferTo(tempFile);
            try (PDDocument document = Loader.loadPDF(tempFile)) {
                PDFTextStripper stripper = new PDFTextStripper();
                return stripper.getText(document);
            } finally {
                tempFile.delete();
            }
        }
    }

    private String extractTextFromDocx(MultipartFile file) throws IOException {
        try (InputStream is = file.getInputStream();
             XWPFDocument document = new XWPFDocument(is);
             XWPFWordExtractor extractor = new XWPFWordExtractor(document)) {
            return extractor.getText();
        }
    }

    private List<CreateExamRequest.QuestionDto> parseWithGeminiVision(byte[] fileBytes, String mimeType, String fileName) {
        ensureGeminiConfigured();

        String prompt = """
                Bạn là OCR + trích xuất đề thi trắc nghiệm từ ảnh/PDF scan.
                Đọc toàn bộ nội dung, nhận diện câu hỏi và đáp án A/B/C/D.
                Trả về MẢNG JSON duy nhất (không markdown):
                [{"content":"...","points":1.0,"questionType":"MULTIPLE_CHOICE","skillTag":"GENERAL","options":[{"content":"...","isCorrect":true},{"content":"...","isCorrect":false}]}]
                Nếu có bảng đáp án (1A 2B...), map isCorrect chính xác. Nếu không có đáp án, mặc định A đúng.
                """;

        String base64 = Base64.getEncoder().encodeToString(fileBytes);
        Map<String, Object> inlineData = Map.of("mime_type", mimeType, "data", base64);

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(Map.of("parts", List.of(
                        Map.of("inline_data", inlineData),
                        Map.of("text", prompt)
                ))),
                "generationConfig", Map.of("temperature", 0.1, "responseMimeType", "application/json")
        );

        return callGemini(requestBody);
    }

    private List<CreateExamRequest.QuestionDto> parseTextWithGemini(String text) {
        ensureGeminiConfigured();

        String truncated = text.length() > MAX_AI_CHARS
                ? text.substring(0, MAX_AI_CHARS) + "\n\n[...]"
                : text;

        String prompt = """
                Trích xuất đề thi trắc nghiệm từ văn bản sau. Trả về MẢNG JSON duy nhất:
                [{"content":"...","points":1.0,"questionType":"MULTIPLE_CHOICE","skillTag":"GENERAL","options":[{"content":"...","isCorrect":true},{"content":"...","isCorrect":false}]}]
                Map đáp án đúng nếu có phần KEY/ĐÁP ÁN.

                Văn bản:
                """ + truncated;

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                "generationConfig", Map.of("temperature", 0.1, "responseMimeType", "application/json")
        );

        return callGemini(requestBody);
    }

    private List<CreateExamRequest.QuestionDto> callGemini(Map<String, Object> requestBody) {
        RestTemplate restTemplate = new RestTemplate();
        String url = "https://generativelanguage.googleapis.com/v1beta/models/"
                + geminiModel + ":generateContent?key=" + geminiApiKey;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            Map<String, Object> response = restTemplate.postForObject(url, entity, Map.class);
            if (response != null && response.containsKey("candidates")) {
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
                if (!candidates.isEmpty()) {
                    Map<String, Object> contentMap = (Map<String, Object>) candidates.get(0).get("content");
                    List<Map<String, Object>> parts = (List<Map<String, Object>>) contentMap.get("parts");
                    String jsonOutput = cleanJson((String) parts.get(0).get("text"));
                    List<CreateExamRequest.QuestionDto> parsed = objectMapper.readValue(jsonOutput,
                            objectMapper.getTypeFactory().constructCollectionType(List.class, CreateExamRequest.QuestionDto.class));
                    normalizeParsedQuestions(parsed);
                    return parsed;
                }
            }
            if (response != null && response.containsKey("error")) {
                Map<String, Object> err = (Map<String, Object>) response.get("error");
                throw new BadRequestException("Gemini: " + err.get("message"));
            }
            throw new BadRequestException("Phản hồi từ Gemini không hợp lệ.");
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Gemini API error (model={})", geminiModel, e);
            throw new BadRequestException("Lỗi AI: " + e.getMessage());
        }
    }

    private void ensureGeminiConfigured() {
        if (geminiApiKey == null || geminiApiKey.isBlank() || geminiApiKey.contains("YOUR_GEMINI_API_KEY_HERE")) {
            throw new BadRequestException("Chưa cấu hình GEMINI_API_KEY. Thêm vào biến môi trường hoặc application.yml.");
        }
    }

    private void normalizeParsedQuestions(List<CreateExamRequest.QuestionDto> questions) {
        for (int i = 0; i < questions.size(); i++) {
            CreateExamRequest.QuestionDto q = questions.get(i);
            if (q.getPoints() == null) q.setPoints(1.0);
            if (q.getQuestionType() == null) q.setQuestionType("MULTIPLE_CHOICE");
            if (q.getSkillTag() == null) q.setSkillTag("GENERAL");
            q.setOrderIndex(i);
            if (q.getOptions() != null) {
                long correctCount = q.getOptions().stream().filter(o -> Boolean.TRUE.equals(o.getIsCorrect())).count();
                if (correctCount != 1 && !q.getOptions().isEmpty()) {
                    q.getOptions().forEach(o -> o.setIsCorrect(false));
                    q.getOptions().get(0).setIsCorrect(true);
                }
            }
        }
    }

    private String cleanJson(String jsonOutput) {
        jsonOutput = jsonOutput.trim();
        if (jsonOutput.startsWith("```json")) jsonOutput = jsonOutput.substring(7);
        else if (jsonOutput.startsWith("```")) jsonOutput = jsonOutput.substring(3);
        if (jsonOutput.endsWith("```")) jsonOutput = jsonOutput.substring(0, jsonOutput.length() - 3);
        return jsonOutput.trim();
    }
}
