package com.uranus.lms.modules.flashcard.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class VocabularyAIService {

    @Value("${app.gemini.api-key}")
    private String geminiApiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AutoFillResponse generateVocabularyInfo(String word) {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + geminiApiKey;

        String prompt = "Provide vocabulary information for the English word \"" + word + "\".\n" +
                "Return ONLY a valid JSON object without markdown formatting, with these keys:\n" +
                "- phonetic: The IPA phonetic transcription (e.g. /kəmˈpjuː.tər/)\n" +
                "- wordType: The part of speech in Vietnamese (e.g. Danh từ, Động từ, Tính từ, Trạng từ)\n" +
                "- definitionEn: The English definition.\n" +
                "- definitionVi: The Vietnamese definition.\n" +
                "- example: An English example sentence using the word.\n" +
                "- exampleTranslation: The Vietnamese translation of the example sentence.\n" +
                "- backContent: The Vietnamese meaning of the word.";

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(
                                Map.of("text", prompt)
                        ))
                )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            String response = restTemplate.postForObject(url, entity, String.class);
            JsonNode root = objectMapper.readTree(response);
            
            // Navigate Gemini's response structure
            String textResponse = root.path("candidates").get(0)
                    .path("content").path("parts").get(0)
                    .path("text").asText();
            
            // Clean up markdown if any
            textResponse = textResponse.replaceAll("```json\\n|\\n```|```", "").trim();
            
            return objectMapper.readValue(textResponse, AutoFillResponse.class);
            
        } catch (Exception e) {
            log.error("Failed to call Gemini API for word: {}", word, e);
            throw new RuntimeException("Lỗi khi phân tích từ vựng bằng AI. Vui lòng thử lại sau.", e);
        }
    }
}
