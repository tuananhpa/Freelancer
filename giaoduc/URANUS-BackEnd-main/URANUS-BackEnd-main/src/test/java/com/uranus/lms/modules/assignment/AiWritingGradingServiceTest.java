package com.uranus.lms.modules.assignment;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.uranus.lms.modules.assignment.dto.writing.WritingGradingResultDto;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class AiWritingGradingServiceTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void testCountWords_normalText() {
        String text = "This is a simple English essay written by a student.";
        assertEquals(10, AiWritingGradingService.countWords(text));
    }

    @Test
    void testCountWords_htmlRichText() {
        String html = "<p>Hello <b>world</b>! &nbsp; This is <i>great</i>.</p>";
        // Words: Hello, world!, This, is, great.
        assertEquals(5, AiWritingGradingService.countWords(html));
    }

    @Test
    void testCountWords_emptyOrNull() {
        assertEquals(0, AiWritingGradingService.countWords(""));
        assertEquals(0, AiWritingGradingService.countWords(null));
        assertEquals(0, AiWritingGradingService.countWords("   <p></p>  "));
    }

    @Test
    void testParseStrictJsonSchema() throws Exception {
        String json = """
        {
          "version": "1.0",
          "gradingStatus": "COMPLETED",
          "overall": {
            "score": 8.0,
            "maxScore": 10.0,
            "percentage": 80.0
          },
          "levelAssessment": {
            "expectedLevel": "A2",
            "estimatedPerformanceLevel": "A2",
            "levelComment": "Học sinh đạt yêu cầu trình độ A2."
          },
          "criteria": {
            "taskAchievement": {
              "score": 8.5,
              "maxScore": 10.0,
              "strengths": ["Đủ ý"],
              "weaknesses": [],
              "feedback": "Tốt"
            },
            "coherenceAndCohesion": {
              "score": 7.5,
              "maxScore": 10.0,
              "strengths": [],
              "weaknesses": ["Cần liên kết câu tốt hơn"],
              "feedback": "Khá"
            },
            "lexicalResource": {
              "score": 8.0,
              "maxScore": 10.0,
              "strengths": ["Từ vựng phù hợp"],
              "weaknesses": [],
              "feedback": "Tốt"
            },
            "grammaticalRangeAndAccuracy": {
              "score": 8.0,
              "maxScore": 10.0,
              "strengths": ["Ngữ pháp đúng"],
              "weaknesses": [],
              "feedback": "Tốt"
            }
          },
          "errors": [
            {
              "id": "err-001",
              "category": "grammar",
              "severity": "major",
              "original": "He go to school yesterday.",
              "correction": "He went to school yesterday.",
              "explanation": "Dùng quá khứ đơn vì hành động đã xảy ra hôm qua."
            }
          ],
          "strengths": [
            {
              "category": "task",
              "description": "Trả lời đầy đủ các câu hỏi",
              "evidence": "Nêu rõ địa điểm và hoạt động"
            }
          ],
          "improvements": [
            {
              "priority": "high",
              "category": "grammar",
              "description": "Cải thiện thì quá khứ đơn",
              "action": "Ôn tập bảng động từ bất quy tắc"
            }
          ],
          "teacherSummary": {
            "overallComment": "Bài làm tốt, bố cục rõ ràng.",
            "mainStrength": "Từ vựng phong phú",
            "mainWeakness": "Chia động từ quá khứ",
            "recommendedFocus": "Ôn tập ngữ pháp thì quá khứ"
          },
          "studentFeedback": {
            "positive": "Em đã hoàn thành bài viết rất tốt!",
            "nextStep": "Hãy chú ý chia động từ quá khứ trong bài tiếp theo nhé."
          }
        }
        """;

        WritingGradingResultDto dto = objectMapper.readValue(json, WritingGradingResultDto.class);
        assertNotNull(dto);
        assertEquals("1.0", dto.getVersion());
        assertEquals(8.0, dto.getOverall().getScore());
        assertEquals("A2", dto.getLevelAssessment().getExpectedLevel());
        assertNotNull(dto.getCriteria().getTaskAchievement());
        assertEquals(1, dto.getErrors().size());
        assertEquals("He went to school yesterday.", dto.getErrors().get(0).getCorrection());
        assertEquals(1, dto.getStrengths().size());
        assertEquals(1, dto.getImprovements().size());
        assertEquals("high", dto.getImprovements().get(0).getPriority());
        assertNotNull(dto.getTeacherSummary());
        assertNotNull(dto.getStudentFeedback());
    }
}
