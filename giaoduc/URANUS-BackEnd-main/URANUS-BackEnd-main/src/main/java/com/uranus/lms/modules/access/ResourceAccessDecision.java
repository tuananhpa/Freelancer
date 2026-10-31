package com.uranus.lms.modules.access;

import lombok.Builder;
import lombok.Value;

import java.util.UUID;

@Value
@Builder
public class ResourceAccessDecision {
    ResourceAccessLevel accessLevel;
    boolean locked;
    Integer previewRank;
    String unlockHint;

    public static ResourceAccessDecision full() {
        return ResourceAccessDecision.builder()
                .accessLevel(ResourceAccessLevel.FULL)
                .locked(false)
                .build();
    }

    public static ResourceAccessDecision previewUnlocked(int rank) {
        return ResourceAccessDecision.builder()
                .accessLevel(ResourceAccessLevel.PREVIEW)
                .locked(false)
                .previewRank(rank)
                .unlockHint("Xem thử — đăng ký lớp của giáo viên để mở toàn bộ tài nguyên.")
                .build();
    }

    public static ResourceAccessDecision previewLocked() {
        return ResourceAccessDecision.builder()
                .accessLevel(ResourceAccessLevel.PREVIEW)
                .locked(true)
                .unlockHint("Đăng ký học với giáo viên này để mở toàn bộ đề / từ vựng / flashcard.")
                .build();
    }
}
