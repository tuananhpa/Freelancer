package com.uranus.lms.modules.exam.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ExamImportPassageDto {
    private String id;
    private String instruction;
    private String content;
    private List<Integer> questionNumbers;
}
