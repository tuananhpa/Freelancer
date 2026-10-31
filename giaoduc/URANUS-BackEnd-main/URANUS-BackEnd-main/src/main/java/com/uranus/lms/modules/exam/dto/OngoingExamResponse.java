package com.uranus.lms.modules.exam.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OngoingExamResponse {
    private String resultId;
    private Map<String, String> answers;
    private Integer cheatWarningCount;
    private String cheatDetails;
    private Long elapsedSeconds;
    private ExamSnapshotDto examSnapshot;
}
