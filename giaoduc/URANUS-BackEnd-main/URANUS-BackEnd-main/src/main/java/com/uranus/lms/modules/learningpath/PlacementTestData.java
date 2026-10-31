package com.uranus.lms.modules.learningpath;

import com.uranus.lms.modules.learningpath.LearningPathDto.PlacementOptionDto;
import com.uranus.lms.modules.learningpath.LearningPathDto.PlacementQuestionDto;

import java.util.*;

public final class PlacementTestData {

    private static final Map<String, String> CORRECT_ANSWERS = new HashMap<>();
    private static final List<PlacementQuestionDto> QUESTIONS = new ArrayList<>();

    static {
        add("g1", "GRAMMAR", "Choose the correct form: She ___ to school every day.",
                Map.of("a", "go", "b", "goes", "c", "going", "d", "gone"), "b");
        add("g2", "GRAMMAR", "Which sentence is correct?",
                Map.of("a", "He don't like coffee.", "b", "He doesn't likes coffee.", "c", "He doesn't like coffee.", "d", "He not like coffee."), "c");
        add("g3", "GRAMMAR", "Fill in: If I ___ rich, I would travel the world.",
                Map.of("a", "am", "b", "was", "c", "were", "d", "be"), "c");

        add("v1", "VOCABULARY", "What is the meaning of 'generous'?",
                Map.of("a", "Angry", "b", "Willing to give", "c", "Lazy", "d", "Quiet"), "b");
        add("v2", "VOCABULARY", "Choose the synonym of 'rapid':",
                Map.of("a", "Slow", "b", "Quick", "c", "Heavy", "d", "Late"), "b");
        add("v3", "VOCABULARY", "A person who treats patients is a:",
                Map.of("a", "Teacher", "b", "Engineer", "c", "Doctor", "d", "Artist"), "c");

        add("r1", "READING", "Read: 'Tom wakes up at 6 AM and jogs before breakfast.' When does Tom jog?",
                Map.of("a", "After dinner", "b", "Before breakfast", "c", "At noon", "d", "At midnight"), "b");
        add("r2", "READING", "Read: 'The library closes at 8 PM on weekdays.' When does it close on weekdays?",
                Map.of("a", "6 PM", "b", "7 PM", "c", "8 PM", "d", "9 PM"), "c");
        add("r3", "READING", "Read: 'Maria moved to Hanoi last year for her new job.' Why did Maria move?",
                Map.of("a", "For vacation", "b", "For her new job", "c", "For school", "d", "For family"), "b");

        add("l1", "LISTENING", "Script: 'Please turn to page 42.' What should students do?",
                Map.of("a", "Close the book", "b", "Open page 42", "c", "Leave the room", "d", "Write an essay"), "b");
        add("l2", "LISTENING", "Script: 'The meeting starts at 3:30 in Room B.' When does the meeting start?",
                Map.of("a", "3:00", "b", "3:15", "c", "3:30", "d", "4:30"), "c");
        add("l3", "LISTENING", "Script: 'Could you speak more slowly, please?' What does the speaker want?",
                Map.of("a", "Louder voice", "b", "Faster speech", "c", "Slower speech", "d", "Written notes"), "c");

        add("w1", "WRITING", "Choose the best sentence for a formal email opening:",
                Map.of("a", "Hey!!! What's up?", "b", "Dear Mr. Smith, I am writing to inquire about...", "c", "Yo bro,", "d", "Urgent!!! Read this!!!"), "b");
        add("w2", "WRITING", "Which connector best shows contrast?",
                Map.of("a", "Therefore", "b", "Moreover", "c", "However", "d", "Firstly"), "c");
        add("w3", "WRITING", "Choose the correct punctuation:",
                Map.of("a", "its raining", "b", "Its raining", "c", "It's raining", "d", "Its' raining"), "c");
    }

    private PlacementTestData() {}

    private static void add(String id, String skill, String content,
            Map<String, String> options, String correct) {
        CORRECT_ANSWERS.put(id, correct);
        List<PlacementOptionDto> optionDtos = new ArrayList<>();
        options.forEach((optId, text) -> optionDtos.add(
                PlacementOptionDto.builder().id(optId).content(text).build()));
        QUESTIONS.add(PlacementQuestionDto.builder()
                .id(id)
                .skillTag(skill)
                .content(content)
                .options(optionDtos)
                .build());
    }

    public static List<PlacementQuestionDto> getQuestions() {
        return Collections.unmodifiableList(QUESTIONS);
    }

    public static Map<String, Integer> scoreAnswers(Map<String, String> answers) {
        Map<String, int[]> tallies = new LinkedHashMap<>();
        for (String skill : List.of("GRAMMAR", "VOCABULARY", "READING", "LISTENING", "WRITING")) {
            tallies.put(skill, new int[]{0, 0});
        }
        for (PlacementQuestionDto q : QUESTIONS) {
            int[] t = tallies.get(q.getSkillTag());
            t[1]++;
            String selected = answers.get(q.getId());
            if (selected != null && selected.equals(CORRECT_ANSWERS.get(q.getId()))) {
                t[0]++;
            }
        }
        Map<String, Integer> scores = new LinkedHashMap<>();
        tallies.forEach((skill, t) -> {
            int correct = t[0];
            int total = t[1];
            int score = total == 0 ? 3 : Math.max(1, Math.min(5, (int) Math.round(1 + 4.0 * correct / total)));
            scores.put(skill, score);
        });
        return scores;
    }
}
