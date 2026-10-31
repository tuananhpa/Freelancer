package com.uranus.lms.modules.folder.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateFolderRequest {
    @NotBlank(message = "Tên folder không được để trống")
    private String name;
    private String description;
    private String color;
}
