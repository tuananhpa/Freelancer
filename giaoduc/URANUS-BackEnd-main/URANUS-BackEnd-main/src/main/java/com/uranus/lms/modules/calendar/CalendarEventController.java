package com.uranus.lms.modules.calendar;

import com.uranus.lms.modules.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/calendar")
@RequiredArgsConstructor
public class CalendarEventController {
    private final CalendarEventService calendarEventService;

    public record CreateEventRequest(
            UUID courseId,
            String title,
            String description,
            EventType eventType,
            LocalDateTime startTime,
            LocalDateTime endTime,
            String meetingLink
    ) {}

    @GetMapping
    public ResponseEntity<List<CalendarEventDto>> getEvents(
            @AuthenticationPrincipal User user,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return ResponseEntity.ok(calendarEventService.getEventsForUser(user, start, end));
    }

    @PostMapping
    public ResponseEntity<CalendarEventDto> createEvent(
            @AuthenticationPrincipal User user,
            @RequestBody CreateEventRequest request) {
        return ResponseEntity.ok(calendarEventService.createEvent(
                user, request.courseId(), request.title(), request.description(),
                request.eventType(), request.startTime(), request.endTime(), request.meetingLink()
        ));
    }
}
