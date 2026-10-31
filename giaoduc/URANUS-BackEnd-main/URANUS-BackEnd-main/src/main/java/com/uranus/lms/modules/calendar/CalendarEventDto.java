package com.uranus.lms.modules.calendar;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class CalendarEventDto {
    private UUID id;
    private UUID courseId;
    private String courseName;
    private String title;
    private String description;
    private EventType eventType;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String meetingLink;
}
