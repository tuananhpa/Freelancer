package com.uranus.lms.modules.exam;

import com.uranus.lms.modules.exam.dto.ExamImportPassageDto;
import com.uranus.lms.modules.exam.dto.ExamImportQuestionDto;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;

import java.io.FileInputStream;
import java.io.InputStream;
import java.util.List;

public class DocxTest {
    public static void main(String[] args) throws Exception {
        String path = "c:\\Users\\sugoi\\Desktop\\URANUS WEB APP\\TEST 10 - TAG QUESTION.docx";
        try (InputStream is = new FileInputStream(path);
             XWPFDocument document = new XWPFDocument(is);
             XWPFWordExtractor extractor = new XWPFWordExtractor(document)) {
            String text = extractor.getText();
            
            ExamParseResult result = ExamTextParser.parseStructured(text);
            System.out.println("Passages count: " + result.getPassages().size());
            for (ExamImportPassageDto p : result.getPassages()) {
                System.out.println("Passage: id=" + p.getId() + ", qNums=" + p.getQuestionNumbers());
                System.out.println("Content: " + p.getContent().substring(0, Math.min(100, p.getContent().length())));
            }

            List<ExamImportQuestionDto> qs = result.getQuestions();
            System.out.println("Parsed questions count: " + qs.size());
            for (int i = 0; i < Math.min(5, qs.size()); i++) {
                System.out.println("Q" + qs.get(i).getSourceNumber() + " STEM: " + qs.get(i).getStem());
                System.out.println("   sectionId: " + qs.get(i).getSectionId());
            }
            
            List<com.uranus.lms.modules.exam.dto.CreateExamRequest.QuestionDto> legacy = ExamTextParser.toLegacyQuestions(result);
            System.out.println("LEGACY Q1: " + legacy.get(0).getContent());
            System.out.println("LEGACY Q2: " + legacy.get(1).getContent());
        }
    }
}
