package com.uranus.lms.modules.mistakevault;

import com.uranus.lms.modules.exam.*;
import com.uranus.lms.modules.gamification.GamificationService;
import com.uranus.lms.modules.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MistakeVaultService {

    private final MistakeVaultRepository repository;
    private final GamificationService gamificationService;
    private final QuestionOptionRepository optionRepository;

    @Transactional(readOnly = true)
    public MistakeVaultStatsDto getVault(User student) {
        LocalDate today = LocalDate.now();
        List<MistakeVaultItem> due = repository.findByStudentAndNextReviewDateLessThanEqualOrderByNextReviewDateAsc(student, today);

        return MistakeVaultStatsDto.builder()
                .totalItems(repository.countByStudent(student))
                .dueToday(due.size())
                .dueItems(due.stream().map(this::toDto).toList())
                .build();
    }

    @Transactional
    public void syncFromExamResult(StudentExamResult result) {
        User student = result.getStudent();
        Exam exam = result.getExam();
        LocalDate today = LocalDate.now();

        for (StudentAnswer answer : result.getAnswers()) {
            if (Boolean.TRUE.equals(answer.getIsCorrect())) continue;
            if (answer.getQuestion() == null) continue;

            Question question = answer.getQuestion();
            String correctText = optionRepository.findByQuestionId(question.getId()).stream()
                    .filter(o -> Boolean.TRUE.equals(o.getIsCorrect()))
                    .map(QuestionOption::getContent)
                    .findFirst()
                    .orElse("—");
            String wrongText = answer.getSelectedOption() != null
                    ? answer.getSelectedOption().getContent()
                    : (answer.getTextResponse() != null ? answer.getTextResponse() : null);

            repository.findByStudentAndQuestionId(student, question.getId())
                    .ifPresentOrElse(item -> {
                        item.setWrongCount(item.getWrongCount() + 1);
                        item.setWrongAnswer(wrongText);
                        item.setRepetitions(0);
                        item.setIntervalDays(1);
                        item.setNextReviewDate(today);
                        repository.save(item);
                    }, () -> repository.save(MistakeVaultItem.builder()
                            .student(student)
                            .itemType("EXAM")
                            .questionId(question.getId())
                            .content(stripHtml(question.getContent()))
                            .correctAnswer(stripHtml(correctText))
                            .wrongAnswer(wrongText != null ? stripHtml(wrongText) : null)
                            .skillTag(question.getSkillTag())
                            .sourceTitle(exam.getTitle())
                            .nextReviewDate(today)
                            .build()));
        }
    }

    @Transactional
    public void addVocabMistake(User student, AddVocabMistakeRequest request) {
        if (request.getFlashcardId() == null || request.getFrontContent() == null) return;
        LocalDate today = LocalDate.now();

        repository.findByStudentAndFlashcardId(student, request.getFlashcardId())
                .ifPresentOrElse(item -> {
                    item.setWrongCount(item.getWrongCount() + 1);
                    item.setRepetitions(0);
                    item.setIntervalDays(1);
                    item.setNextReviewDate(today);
                    repository.save(item);
                }, () -> repository.save(MistakeVaultItem.builder()
                        .student(student)
                        .itemType("VOCAB")
                        .flashcardId(request.getFlashcardId())
                        .content(request.getFrontContent().trim())
                        .correctAnswer(request.getBackContent() != null ? request.getBackContent().trim() : "")
                        .skillTag("VOCABULARY")
                        .sourceTitle(request.getSourceTitle())
                        .nextReviewDate(today)
                        .build()));
    }

    @Transactional
    public MistakeVaultItemDto reviewItem(User student, UUID itemId, boolean remembered) {
        MistakeVaultItem item = repository.findByIdAndStudent(itemId, student)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy mục ôn tập"));

        LocalDate today = LocalDate.now();
        item.setLastReviewedAt(LocalDateTime.now());

        if (remembered) {
            item.setRepetitions(item.getRepetitions() + 1);
            if (item.getRepetitions() == 1) {
                item.setIntervalDays(1);
            } else if (item.getRepetitions() == 2) {
                item.setIntervalDays(3);
            } else {
                item.setIntervalDays(Math.max(1, (int) Math.round(item.getIntervalDays() * item.getEaseFactor())));
            }
            item.setEaseFactor(Math.min(3.0, item.getEaseFactor() + 0.1));
        } else {
            item.setRepetitions(0);
            item.setIntervalDays(1);
            item.setEaseFactor(Math.max(1.3, item.getEaseFactor() - 0.2));
            item.setWrongCount(item.getWrongCount() + 1);
        }

        item.setNextReviewDate(today.plusDays(item.getIntervalDays()));
        repository.save(item);
        gamificationService.recordActivity(student, "MISTAKE_REVIEW");

        return toDto(item);
    }

    private MistakeVaultItemDto toDto(MistakeVaultItem item) {
        return MistakeVaultItemDto.builder()
                .id(item.getId())
                .itemType(item.getItemType())
                .content(item.getContent())
                .correctAnswer(item.getCorrectAnswer())
                .wrongAnswer(item.getWrongAnswer())
                .skillTag(item.getSkillTag())
                .sourceTitle(item.getSourceTitle())
                .wrongCount(item.getWrongCount())
                .repetitions(item.getRepetitions())
                .intervalDays(item.getIntervalDays())
                .nextReviewDate(item.getNextReviewDate().toString())
                .build();
    }

    private String stripHtml(String html) {
        if (html == null) return "";
        return html.replaceAll("<[^>]*>", " ").replaceAll("\\s+", " ").trim();
    }
}
