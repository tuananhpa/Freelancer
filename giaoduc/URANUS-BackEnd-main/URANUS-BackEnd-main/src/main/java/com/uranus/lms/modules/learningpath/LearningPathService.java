package com.uranus.lms.modules.learningpath;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.uranus.lms.modules.course.Course;
import com.uranus.lms.modules.course.CourseRepository;
import com.uranus.lms.modules.course.CourseStatus;
import com.uranus.lms.modules.flashcard.FlashcardDeck;
import com.uranus.lms.modules.flashcard.FlashcardDeckRepository;
import com.uranus.lms.modules.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class LearningPathService {

    private final PlacementResultRepository placementResultRepository;
    private final CourseRepository courseRepository;
    private final FlashcardDeckRepository deckRepository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public LearningPathDto.StatusResponse getStatus(User user) {
        return placementResultRepository.findByUser(user)
                .map(r -> LearningPathDto.StatusResponse.builder()
                        .completed(true)
                        .recommendedLevel(r.getRecommendedLevel())
                        .skillScores(parseScores(r.getSkillScores()))
                        .build())
                .orElse(LearningPathDto.StatusResponse.builder().completed(false).build());
    }

    @Transactional(readOnly = true)
    public LearningPathDto.PlacementTestResponse getPlacementTest() {
        return LearningPathDto.PlacementTestResponse.builder()
                .questions(PlacementTestData.getQuestions())
                .build();
    }

    @Transactional
    public LearningPathDto.StatusResponse submitPlacementTest(User user, Map<String, String> answers) {
        Map<String, Integer> skillScores = PlacementTestData.scoreAnswers(answers != null ? answers : Map.of());
        return submitPlacement(user, skillScores);
    }

    @Transactional
    public LearningPathDto.StatusResponse submitPlacement(User user, Map<String, Integer> skillScores) {
        int avg = (int) skillScores.values().stream().mapToInt(Integer::intValue).average().orElse(3);
        String level = avg <= 2 ? "BEGINNER" : avg <= 3 ? "INTERMEDIATE" : avg <= 4 ? "UPPER_INTERMEDIATE" : "ADVANCED";

        PlacementResult result = placementResultRepository.findByUser(user)
                .orElse(PlacementResult.builder().user(user).build());
        result.setSkillScores(toJson(skillScores));
        result.setRecommendedLevel(level);
        placementResultRepository.save(result);

        return LearningPathDto.StatusResponse.builder()
                .completed(true)
                .recommendedLevel(level)
                .skillScores(skillScores)
                .build();
    }

    @Transactional(readOnly = true)
    public LearningPathDto.RecommendationsResponse getRecommendations(User user) {
        Map<String, Integer> scores = placementResultRepository.findByUser(user)
                .map(r -> parseScores(r.getSkillScores()))
                .orElse(Map.of("GRAMMAR", 3, "VOCABULARY", 3, "READING", 3));

        String weakest = scores.entrySet().stream()
                .min(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("VOCABULARY");

        List<LearningPathDto.RecommendationItem> items = new ArrayList<>();

        courseRepository.findByStatus(CourseStatus.PUBLISHED, PageRequest.of(0, 3))
                .getContent().forEach(c -> items.add(toCourseItem(c, weakest)));

        deckRepository.findByVisibility(com.uranus.lms.modules.access.Visibility.PUBLIC, PageRequest.of(0, 3))
                .getContent().forEach(d -> items.add(toDeckItem(d, weakest)));

        return LearningPathDto.RecommendationsResponse.builder()
                .weakestSkill(weakest)
                .items(items)
                .build();
    }

    private LearningPathDto.RecommendationItem toCourseItem(Course c, String skill) {
        return LearningPathDto.RecommendationItem.builder()
                .type("COURSE")
                .id(c.getId())
                .title(c.getTitle())
                .reason("Gợi ý cải thiện kỹ năng " + skill)
                .link("/courses/" + c.getId())
                .build();
    }

    private LearningPathDto.RecommendationItem toDeckItem(FlashcardDeck d, String skill) {
        return LearningPathDto.RecommendationItem.builder()
                .type("DECK")
                .id(d.getId())
                .title(d.getTitle())
                .reason("Ôn từ vựng cho " + skill)
                .link("/quizcards/" + d.getId() + "/study")
                .build();
    }

    private Map<String, Integer> parseScores(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (JsonProcessingException e) {
            return Map.of();
        }
    }

    private String toJson(Map<String, Integer> scores) {
        try {
            return objectMapper.writeValueAsString(scores);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }
}
