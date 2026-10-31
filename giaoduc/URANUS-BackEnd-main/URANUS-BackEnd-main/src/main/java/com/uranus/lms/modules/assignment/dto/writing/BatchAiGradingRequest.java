package com.uranus.lms.modules.assignment.dto.writing;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BatchAiGradingRequest {
    /** Danh sách submissionId cần chấm. Nếu rỗng, backend sẽ chấm tất cả bài PENDING của assignment */
    private List<UUID> submissionIds;
}
