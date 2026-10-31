package com.uranus.lms.modules.exam;

import com.uranus.lms.modules.exam.dto.ExamImportPassageDto;
import com.uranus.lms.modules.exam.dto.ExamImportQuestionDto;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ExamParseResult {
    private List<ExamImportPassageDto> passages;
    private List<ExamImportQuestionDto> questions;
}
