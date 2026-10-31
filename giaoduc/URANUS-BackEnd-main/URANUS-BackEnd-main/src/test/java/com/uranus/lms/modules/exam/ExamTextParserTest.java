package com.uranus.lms.modules.exam;

import com.uranus.lms.modules.exam.dto.CreateExamRequest;
import com.uranus.lms.modules.exam.dto.ExamImportQuestionDto;
import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ExamTextParserTest {

    @Test
    void parsesStructuredExamWithAnswerKey() throws Exception {
        String text = Files.readString(Path.of("../test-data/sample-exam.txt"));
        List<CreateExamRequest.QuestionDto> questions = ExamTextParser.parse(text);

        assertEquals(3, questions.size());
        assertTrue(questions.get(0).getContent().contains("She"));
        assertEquals(4, questions.get(0).getOptions().size());
        assertTrue(questions.get(0).getOptions().get(1).getIsCorrect()); // 1B
        assertTrue(questions.get(1).getOptions().get(1).getIsCorrect()); // 2B
        assertTrue(questions.get(2).getOptions().get(2).getIsCorrect()); // 3C
    }

    @Test
    void parsesEnglishQuestionFormatWithSeparatePassages() throws Exception {
        String text = Files.readString(Path.of("../test-data/khao-sat-lop10-extracted.txt"));
        ExamParseResult result = ExamTextParser.parseStructured(text);

        assertEquals(40, result.getQuestions().size());
        assertFalse(result.getPassages().isEmpty());

        ExamImportQuestionDto q12 = result.getQuestions().stream()
                .filter(q -> q.getSourceNumber() == 12).findFirst().orElseThrow();
        assertNotNull(q12.getSectionId());
        assertEquals("Question 12.", q12.getStem());
        assertFalse(q12.getStem().contains("Techworld Magazine"));
        assertEquals("grasp", q12.getOptions().get(0).getContent());

        ExamImportQuestionDto q18 = result.getQuestions().stream()
                .filter(q -> q.getSourceNumber() == 18).findFirst().orElseThrow();
        assertNotNull(q18.getSectionId());
        assertFalse(q18.getStem().contains("URANUS"));
        assertFalse(q18.getOptions().get(0).getContent().contains("private"));

        var passage12 = result.getPassages().stream()
                .filter(p -> p.getQuestionNumbers().contains(12)).findFirst().orElseThrow();
        assertTrue(passage12.getContent().contains("Techworld Magazine"));

        ExamImportQuestionDto q23 = result.getQuestions().stream()
                .filter(q -> q.getSourceNumber() == 23).findFirst().orElseThrow();
        assertTrue(q23.getStem().contains("NOT mentioned"));
        assertFalse(q23.getStem().contains("Located between Iran and Oman"));

        ExamImportQuestionDto q11 = result.getQuestions().stream()
                .filter(q -> q.getSourceNumber() == 11).findFirst().orElseThrow();
        assertTrue(q11.getStem().contains("<br") || q11.getStem().contains("\n"));
        assertTrue(q11.getStem().contains("a."));
        assertTrue(q11.getStem().contains("e."));
    }
}
