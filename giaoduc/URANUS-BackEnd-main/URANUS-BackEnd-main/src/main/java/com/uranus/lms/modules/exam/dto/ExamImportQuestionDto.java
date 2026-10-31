package com.uranus.lms.modules.exam.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ExamImportQuestionDto {
    private int sourceNumber;
    private String sectionId;
    private String stem;
    private Double points;
    private String questionType;
    private String skillTag;
    private List<CreateExamRequest.OptionDto> options;
}
