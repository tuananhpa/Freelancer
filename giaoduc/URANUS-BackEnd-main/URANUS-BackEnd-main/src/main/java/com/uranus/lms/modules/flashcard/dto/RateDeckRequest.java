package com.uranus.lms.modules.flashcard.dto;

import lombok.Data;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

@Data
public class RateDeckRequest {
    @NotNull
    @Min(1)
    @Max(5)
    private Integer rating;
}
