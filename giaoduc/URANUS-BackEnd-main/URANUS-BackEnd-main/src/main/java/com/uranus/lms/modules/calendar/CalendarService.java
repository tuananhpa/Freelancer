package com.uranus.lms.modules.calendar;

import com.uranus.lms.modules.assignment.Assignment;
import com.uranus.lms.modules.assignment.AssignmentRepository;
import com.uranus.lms.modules.classroom.*;
import com.uranus.lms.modules.exam.Exam;
import com.uranus.lms.modules.exam.ExamRepository;
import com.uranus.lms.modules.user.User;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CalendarService {

    private final ClassMemberRepository classMemberRepository;
    private final AssignmentRepository assignmentRepository;
    private final ClassExamRepository classExamRepository;
    private final ExamRepository examRepository;

    @Transactional(readOnly = true)
    public List<CalendarEventDto> getEvents(User user, LocalDate from, LocalDate to) {
        List<CalendarEventDto> events = new ArrayList<>();
        LocalDateTime fromDt = from.atStartOfDay();
        LocalDateTime toDt = to.plusDays(1).atStartOfDay();

        List<ClassMember> memberships = classMemberRepository.findByUserId(user.getId(), Pageable.unpaged()).getContent();
        for (ClassMember m : memberships) {
            Classroom classroom = m.getClassroom();
            List<Assignment> assignments = assignmentRepository
                    .findByClassroom(classroom, Pageable.unpaged()).getContent();
            for (Assignment a : assignments) {
                if (a.getDueDate() == null) continue;
                LocalDateTime due = a.getDueDate();
                if (!due.isBefore(fromDt) && due.isBefore(toDt)) {
                    events.add(CalendarEventDto.builder()
                            .id(a.getId())
                            .title(a.getTitle())
                            .type("ASSIGNMENT")
                            .start(due.toString())
                            .classroomName(classroom.getName())
                            .link("/assignments/" + a.getId() + "/take")
                            .build());
                }
            }

            for (ClassExam ce : classExamRepository.findByClassroom(classroom)) {
                Exam exam = ce.getExam();
                LocalDateTime close = ce.getCloseTime();
                if (close != null && !close.isBefore(fromDt) && close.isBefore(toDt)) {
                    events.add(CalendarEventDto.builder()
                            .id(exam.getId())
                            .title(exam.getTitle())
                            .type("EXAM")
                            .start(close.toString())
                            .classroomName(classroom.getName())
                            .link("/exams/take/" + exam.getId())
                            .build());
                }
            }
        }

        if ("TEACHER".equals(user.getRole())) {
            examRepository.findByTeacherOrderByCreatedAtDesc(user, Pageable.unpaged())
                    .getContent().forEach(exam -> {
                        if (exam.getEndTime() != null) {
                            LocalDateTime end = exam.getEndTime();
                            if (!end.isBefore(fromDt) && end.isBefore(toDt)) {
                                events.add(CalendarEventDto.builder()
                                        .id(exam.getId())
                                        .title(exam.getTitle())
                                        .type("EXAM")
                                        .start(end.toString())
                                        .classroomName("Đề thi của bạn")
                                        .link("/exams")
                                        .build());
                            }
                        }
                    });
        }

        events.sort((a, b) -> a.getStart().compareTo(b.getStart()));
        return events;
    }

    @Data
    @Builder
    public static class CalendarEventDto {
        private UUID id;
        private String title;
        private String type;
        private String start;
        private String classroomName;
        private String link;
    }
}
