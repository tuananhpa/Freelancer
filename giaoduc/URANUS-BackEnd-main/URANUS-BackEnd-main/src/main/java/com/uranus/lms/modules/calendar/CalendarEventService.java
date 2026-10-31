package com.uranus.lms.modules.calendar;

import com.uranus.lms.modules.course.Course;
import com.uranus.lms.modules.course.CourseRepository;
import com.uranus.lms.modules.course.EnrollmentRepository;
import com.uranus.lms.modules.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CalendarEventService {
    private final CalendarEventRepository calendarEventRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;

    public List<CalendarEventDto> getEventsForUser(User user, LocalDateTime start, LocalDateTime end) {
        List<UUID> courseIds;
        if (user.getRole() == com.uranus.lms.modules.user.Role.TEACHER || user.getRole() == com.uranus.lms.modules.user.Role.TEACHING_ASSISTANT || user.getRole() == com.uranus.lms.modules.user.Role.ADMIN) {
            courseIds = courseRepository.findByTeacher(user, org.springframework.data.domain.Pageable.unpaged()).stream()
                    .map(Course::getId)
                    .collect(Collectors.toList());
        } else {
            courseIds = enrollmentRepository.findByStudent(user, org.springframework.data.domain.Pageable.unpaged()).stream()
                    .map(e -> e.getCourse().getId())
                    .collect(Collectors.toList());
        }

        if (courseIds.isEmpty()) {
            courseIds.add(UUID.randomUUID());
        }

        return calendarEventRepository.findEventsForUser(courseIds, start, end).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public CalendarEventDto createEvent(User user, UUID courseId, String title, String description, 
                                        EventType type, LocalDateTime start, LocalDateTime end, String link) {
        Course course = null;
        if (courseId != null) {
            course = courseRepository.findById(courseId)
                    .orElseThrow(() -> new IllegalArgumentException("Course not found"));
        }

        CalendarEvent event = CalendarEvent.builder()
                .course(course)
                .title(title)
                .description(description)
                .eventType(type)
                .startTime(start)
                .endTime(end)
                .meetingLink(link)
                .build();

        return mapToDto(calendarEventRepository.save(event));
    }

    private CalendarEventDto mapToDto(CalendarEvent event) {
        return CalendarEventDto.builder()
                .id(event.getId())
                .courseId(event.getCourse() != null ? event.getCourse().getId() : null)
                .courseName(event.getCourse() != null ? event.getCourse().getTitle() : null)
                .title(event.getTitle())
                .description(event.getDescription())
                .eventType(event.getEventType())
                .startTime(event.getStartTime())
                .endTime(event.getEndTime())
                .meetingLink(event.getMeetingLink())
                .build();
    }
}
