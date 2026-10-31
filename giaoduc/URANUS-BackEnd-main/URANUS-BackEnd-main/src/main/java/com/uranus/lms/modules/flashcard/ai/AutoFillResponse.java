package com.uranus.lms.modules.flashcard.ai;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AutoFillResponse {
    private String phonetic;
    private String wordType;
    private String definitionEn;
    private String definitionVi;
    private String example;
    private String exampleTranslation;
    private String backContent;
}
