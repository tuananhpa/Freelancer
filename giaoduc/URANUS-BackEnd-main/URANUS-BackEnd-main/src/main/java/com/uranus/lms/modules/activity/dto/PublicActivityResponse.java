package com.uranus.lms.modules.activity.dto;

import com.uranus.lms.modules.activity.ActivityCategory;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Bản rút gọn dành cho khách chưa đăng nhập — không lộ trạng thái duyệt,
 * ghi chú nội bộ hay thông tin người duyệt.
 */
@Data
@Builder
public class PublicActivityResponse {
    private UUID id;
    private String title;
    private String slug;
    private String summary;
    private String content;
    private String coverImageUrl;
    private List<String> images;
    private ActivityCategory category;
    private boolean pinned;
    private String authorName;
    private LocalDateTime publishedAt;
    private long viewCount;
}
