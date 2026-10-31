package com.uranus.lms.modules.exam.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ExamImportResponse {
  private List<CreateExamRequest.QuestionDto> questions;
  private List<ExamImportQuestionDto> structuredQuestions;
  private List<ExamImportPassageDto> passages;
  private String sourceFormat;
  private String fileName;
  private int totalExtracted;
  private int mappedWithAnswerKey;
  private String parseMethod;
  private String message;
}
