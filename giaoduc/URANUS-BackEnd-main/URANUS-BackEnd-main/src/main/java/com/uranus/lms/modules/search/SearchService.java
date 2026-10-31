package com.uranus.lms.modules.search;

import com.uranus.lms.modules.classroom.ClassMemberRepository;
import com.uranus.lms.modules.classroom.Classroom;
import com.uranus.lms.modules.course.Course;
import com.uranus.lms.modules.course.CourseRepository;
import com.uranus.lms.modules.course.CourseStatus;
import com.uranus.lms.modules.exam.Exam;
import com.uranus.lms.modules.exam.ExamRepository;
import com.uranus.lms.modules.flashcard.FlashcardDeck;
import com.uranus.lms.modules.flashcard.FlashcardDeckRepository;
import com.uranus.lms.modules.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SearchService {

    private static final int LIMIT_PER_TYPE = 5;

    private final CourseRepository courseRepository;
    private final ExamRepository examRepository;
    private final FlashcardDeckRepository deckRepository;
    private final ClassMemberRepository classMemberRepository;

    @Transactional(readOnly = true)
    public List<SearchResultDto> search(User user, String query) {
        if (query == null || query.trim().length() < 2) {
            return List.of();
        }
        String q = query.trim();
        List<SearchResultDto> results = new ArrayList<>();

        if ("TEACHER".equals(user.getRole().name()) || "TEACHING_ASSISTANT".equals(user.getRole().name()) || "ADMIN".equals(user.getRole().name())) {
            courseRepository.findByTeacherAndTitleContainingIgnoreCase(user, q, PageRequest.of(0, LIMIT_PER_TYPE))
                    .getContent().forEach(c -> results.add(toCourse(c)));
        }
        courseRepository.findByTitleContainingIgnoreCaseAndStatus(q, CourseStatus.PUBLISHED, PageRequest.of(0, LIMIT_PER_TYPE))
                .getContent().forEach(c -> addUnique(results, toCourse(c)));

        if ("TEACHER".equals(user.getRole().name()) || "TEACHING_ASSISTANT".equals(user.getRole().name()) || "ADMIN".equals(user.getRole().name())) {
            examRepository.findByTeacherAndTitleContainingIgnoreCase(user, q, PageRequest.of(0, LIMIT_PER_TYPE))
                    .getContent().forEach(e -> results.add(toExam(e)));
        }
        examRepository.findByTitleContainingIgnoreCaseAndIsPublishedTrue(q).stream()
                .limit(LIMIT_PER_TYPE)
                .forEach(e -> addUnique(results, toExam(e)));

        deckRepository.findByOwnerAndTitleContainingIgnoreCase(user, q, PageRequest.of(0, LIMIT_PER_TYPE))
                .getContent().forEach(d -> results.add(toDeck(d)));
        deckRepository.findByTitleContainingIgnoreCaseAndVisibility(q, com.uranus.lms.modules.access.Visibility.PUBLIC, PageRequest.of(0, LIMIT_PER_TYPE))
                .getContent().forEach(d -> addUnique(results, toDeck(d)));

        classMemberRepository.findByUserId(user.getId(), Pageable.unpaged()).getContent().stream()
                .map(m -> m.getClassroom())
                .filter(c -> c.getName().toLowerCase().contains(q.toLowerCase()))
                .limit(LIMIT_PER_TYPE)
                .forEach(c -> results.add(toClassroom(c)));

        return results.stream()
                .sorted(Comparator.comparing(SearchResultDto::getTitle, String.CASE_INSENSITIVE_ORDER))
                .limit(20)
                .collect(Collectors.toList());
    }

    private void addUnique(List<SearchResultDto> results, SearchResultDto item) {
        boolean exists = results.stream()
                .anyMatch(r -> r.getType().equals(item.getType()) && r.getId().equals(item.getId()));
        if (!exists) results.add(item);
    }

    private SearchResultDto toCourse(Course c) {
        return SearchResultDto.builder()
                .type("COURSE")
                .id(c.getId())
                .title(c.getTitle())
                .subtitle(c.getStatus() != null ? c.getStatus().name() : "Khóa học")
                .link("/courses/" + c.getId())
                .build();
    }

    private SearchResultDto toExam(Exam e) {
        return SearchResultDto.builder()
                .type("EXAM")
                .id(e.getId())
                .title(e.getTitle())
                .subtitle(e.getIsPublished() ? "Đề thi" : "Bản nháp")
                .link("/exams/take/" + e.getId())
                .build();
    }

    private SearchResultDto toDeck(FlashcardDeck d) {
        return SearchResultDto.builder()
                .type("DECK")
                .id(d.getId())
                .title(d.getTitle())
                .subtitle(d.getVisibility() == com.uranus.lms.modules.access.Visibility.PUBLIC ? "Quizcard công khai" : "Quizcard của bạn")
                .link("/quizcards/" + d.getId() + "/study")
                .build();
    }

    private SearchResultDto toClassroom(Classroom c) {
        return SearchResultDto.builder()
                .type("CLASS")
                .id(c.getId())
                .title(c.getName())
                .subtitle(c.getSubject() != null ? c.getSubject() : "Lớp học")
                .link("/classes/" + c.getId())
                .build();
    }
}
