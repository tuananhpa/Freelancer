package com.uranus.lms.modules.activity.dto;

import com.uranus.lms.modules.activity.ActivityCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class ActivityRequest {

    @NotBlank(message = "Tiêu đề không được để trống")
    @Size(max = 255, message = "Tiêu đề tối đa 255 ký tự")
    private String title;

    @Size(max = 500, message = "Mô tả ngắn tối đa 500 ký tự")
    private String summary;

    @NotBlank(message = "Nội dung không được để trống")
    private String content;

    private String coverImageUrl;

    private List<String> images;

    private ActivityCategory category = ActivityCategory.NEWS;

    private Boolean pinned;
}
