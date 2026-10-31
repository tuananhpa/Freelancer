package com.uranus.lms.modules.search;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class SearchResultDto {
    private String type;
    private UUID id;
    private String title;
    private String subtitle;
    private String link;
}
