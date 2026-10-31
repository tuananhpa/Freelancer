package com.uranus.lms.modules.exam;

import com.uranus.lms.modules.exam.dto.CreateExamRequest;
import com.uranus.lms.modules.exam.dto.ExamImportPassageDto;
import com.uranus.lms.modules.exam.dto.ExamImportQuestionDto;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Rule-based parser for Vietnamese/English multiple-choice exam documents.
 * Handles: Câu 1 / Question 1 / 1., options A-D (per line or inline), answer key at end.
 */
public final class ExamTextParser {

    private static final Pattern QUESTION_BOUNDARY = Pattern.compile(
            "(?im)(?:^|\\n|\\t|\\s{2,})(?:Question|Câu|Q)?\\s*(\\d+)\\s*[\\.\\):\\-]\\s+");

    private static final Pattern OPTION_LINE = Pattern.compile(
            "^\\s*([A-D])\\s*[\\.\\):\\-]\\s*(.+)$");

    private static final Pattern OPTION_MARKER = Pattern.compile(
            "(?m)(?:^|\\n|\\t|\\s{2,})([A-D])\\s*[\\.\\):\\-]\\s+");

    private static final Pattern SECTION_CUT = Pattern.compile(
            "(?im)\\n\\s*(?:(?:For\\s+questions.*?\\s*)?(?:Read\\b.*?(?:following|passage|text|advertisement|leaflet)|Mark\\b.*?(?:letter|option)|Choose\\b.*?(?:correct|answer)|Complete\\b.*?(?:following|sentence))|URANUS|Question \\d|THE END)");

    private static final Pattern RANGE_IN_INSTRUCTION = Pattern.compile(
            "(?i)(?:from\\s+(?:\\()?(\\d+)(?:\\))?\\s+to\\s+(?:\\()?(\\d+)(?:\\))?|questions\\s+(\\d+)\\s*-\\s*(\\d+))");

    private static final Pattern BLANK_NUMBER = Pattern.compile("\\((\\d+)\\)\\s*_{2,}");

    private static final Pattern ANSWER_KEY_HEADER = Pattern.compile(
            "(?i)(đáp\\s*án|answer\\s*key|key\\s*đáp\\s*án|bảng\\s*đáp\\s*án)\\s*:?\\s*$");

    private static final Pattern ANSWER_KEY_ENTRY = Pattern.compile(
            "(\\d+)\\s*[\\.\\):\\-]?\\s*([A-Da-d])");

    private ExamTextParser() {}

    public static List<CreateExamRequest.QuestionDto> parse(String rawText) {
        ExamParseResult result = parseStructured(rawText);
        return toLegacyQuestions(result);
    }

    public static ExamParseResult parseStructured(String rawText) {
        if (rawText == null || rawText.isBlank()) {
            return ExamParseResult.builder().passages(List.of()).questions(List.of()).build();
        }

        String text = stripBoilerplate(normalizeText(rawText));
        Map<Integer, Character> answerKey = extractAnswerKey(text);
        String body = stripAnswerKeySection(text);

        List<ExamImportPassageDto> passages = extractPassages(body);
        Map<Integer, String> questionToSection = mapQuestionsToSections(passages);

        List<QuestionBlock> blocks = splitQuestions(body);
        if (blocks.isEmpty()) {
            return ExamParseResult.builder().passages(passages).questions(List.of()).build();
        }

        blocks.sort(Comparator.comparingInt(b -> b.questionNumber));

        List<ExamImportQuestionDto> questions = new ArrayList<>();
        Set<Integer> seen = new HashSet<>();
        for (QuestionBlock block : blocks) {
            if (!seen.add(block.questionNumber)) {
                continue;
            }
            block.sectionId = questionToSection.get(block.questionNumber);
            block.questionText = buildStem(block, block.sectionId != null);
            block.options = sanitizeOptions(block.options);
            ExamImportQuestionDto dto = toImportQuestionDto(block, answerKey);
            if (dto != null && dto.getOptions() != null && dto.getOptions().size() >= 2) {
                questions.add(dto);
            }
        }
        questions.sort(Comparator.comparingInt(ExamImportQuestionDto::getSourceNumber));

        double defaultPoints = questions.isEmpty() ? 1.0
                : Math.round(10.0 / questions.size() * 100.0) / 100.0;
        for (ExamImportQuestionDto q : questions) {
            q.setPoints(defaultPoints);
        }

        return ExamParseResult.builder().passages(passages).questions(questions).build();
    }

    static List<CreateExamRequest.QuestionDto> toLegacyQuestions(ExamParseResult result) {
        Map<String, ExamImportPassageDto> passageMap = new HashMap<>();
        for (ExamImportPassageDto p : result.getPassages()) {
            passageMap.put(p.getId(), p);
        }

        List<CreateExamRequest.QuestionDto> legacy = new ArrayList<>();
        for (ExamImportQuestionDto q : result.getQuestions()) {
            CreateExamRequest.QuestionDto dto = new CreateExamRequest.QuestionDto();
            StringBuilder content = new StringBuilder();
            if (q.getSectionId() != null && passageMap.containsKey(q.getSectionId())) {
                ExamImportPassageDto passage = passageMap.get(q.getSectionId());
                content.append(escapeHtml(passage.getContent())).append("\n\n");
            }
            content.append(escapeHtml(q.getStem()));
            dto.setContent(content.toString());
            dto.setPoints(q.getPoints());
            dto.setQuestionType(q.getQuestionType());
            dto.setSkillTag(q.getSkillTag());
            dto.setOrderIndex(q.getSourceNumber() - 1);
            dto.setOptions(q.getOptions());
            legacy.add(dto);
        }
        return legacy;
    }

    private static Map<Integer, String> mapQuestionsToSections(List<ExamImportPassageDto> passages) {
        Map<Integer, String> map = new HashMap<>();
        for (ExamImportPassageDto p : passages) {
            if (p.getQuestionNumbers() != null) {
                for (int n : p.getQuestionNumbers()) {
                    map.put(n, p.getId());
                }
            }
        }
        return map;
    }

    private static String normalizeText(String text) {
        return text
                .replace('\u00A0', ' ')
                .replace('\r', '\n')
                .replaceAll("\n{3,}", "\n\n")
                .trim();
    }

    private static String stripBoilerplate(String text) {
        String[] lines = text.split("\n", -1);
        StringBuilder sb = new StringBuilder();
        for (String line : lines) {
            if (isBoilerplateLine(line.trim())) {
                continue;
            }
            if (sb.length() > 0) {
                sb.append('\n');
            }
            sb.append(line);
        }
        return sb.toString().trim();
    }

    private static boolean isBoilerplateLine(String line) {
        if (line.isBlank()) {
            return false;
        }
        if (line.matches("(?i)URANUS DEVELOPING AND TRAINING CENTER")) {
            return true;
        }
        if (line.matches("(?i)URANUS – Developing and Training Center")) {
            return true;
        }
        if (line.matches("(?i)CS1:.*")) {
            return true;
        }
        if (line.matches("0?\\d{1,2}")) {
            return true;
        }
        if (line.matches("(?i)LỚP \\d+")) {
            return true;
        }
        if (line.matches("(?i)ĐỀ KHẢO SÁT.*")) {
            return true;
        }
        if (line.matches("(?i)Môn:.*")) {
            return true;
        }
        if (line.matches("(?i)Thời gian:.*")) {
            return true;
        }
        if (line.matches("(?i)THE END.*")) {
            return true;
        }
        return false;
    }

    private static List<ExamImportPassageDto> extractPassages(String text) {
        List<ExamImportPassageDto> sections = new ArrayList<>();
        String[] lines = text.split("\n", -1);
        
        for (int i = 0; i < lines.length; i++) {
            String line = lines[i].trim();
            // Generically match any instruction that tells the student to Read, Mark, Choose, Complete
            if (!line.matches("(?i).*(?:Read|Mark|Choose|Complete)\\b.*") && !line.matches("(?i).*For questions\\s+\\d+.*")) {
                continue;
            }

            StringBuilder instruction = new StringBuilder(line);
            int j = i + 1;
            while (j < lines.length && lines[j].trim().isEmpty()) {
                j++;
            }
            if (j < lines.length && !lines[j].trim().matches("(?i)Question\\s+\\d+.*")
                    && !lines[j].trim().matches("(?i)Mark the letter.*")
                    && !RANGE_IN_INSTRUCTION.matcher(instruction).find()
                    && RANGE_IN_INSTRUCTION.matcher(lines[j]).find()) {
                instruction.append(' ').append(lines[j].trim());
                j++;
            }

            Matcher rangeMatcher = RANGE_IN_INSTRUCTION.matcher(instruction);
            int from = 0;
            int to = 0;
            if (rangeMatcher.find()) {
                if (rangeMatcher.group(1) != null) {
                    from = Integer.parseInt(rangeMatcher.group(1));
                    to = Integer.parseInt(rangeMatcher.group(2));
                } else {
                    from = Integer.parseInt(rangeMatcher.group(3));
                    to = Integer.parseInt(rangeMatcher.group(4));
                }
            }

            StringBuilder passage = new StringBuilder();
            for (; j < lines.length; j++) {
                String pline = lines[j].trim();
                if (pline.isEmpty()) {
                    continue;
                }
                if (pline.matches("(?i)Question\\s+\\d+.*")) {
                    break;
                }
                if (pline.matches("(?i).*(?:Mark|Choose|Complete)\\b.*")) {
                    break;
                }
                if (isBoilerplateLine(pline)) {
                    continue;
                }
                if (passage.length() > 0) {
                    passage.append(' ');
                }
                passage.append(pline.replaceAll("\\s+", " ").trim());
            }

            String passageText = passage.toString().trim();
            if (passageText.isBlank()) {
                continue;
            }

            List<Integer> questionNumbers = new ArrayList<>();
            Set<Integer> blankNums = new TreeSet<>();
            Matcher blankMatcher = BLANK_NUMBER.matcher(passageText);
            while (blankMatcher.find()) {
                blankNums.add(Integer.parseInt(blankMatcher.group(1)));
            }

            if (!blankNums.isEmpty()) {
                questionNumbers.addAll(blankNums);
            } else if (from > 0 && to >= from) {
                for (int q = from; q <= to; q++) {
                    questionNumbers.add(q);
                }
            } else {
                List<Integer> following = findFollowingQuestionNumbers(lines, j);
                if (!following.isEmpty()) {
                    questionNumbers.addAll(following);
                }
            }

            if (questionNumbers.isEmpty()) {
                continue;
            }

            String sectionId = java.util.UUID.randomUUID().toString();
            sections.add(ExamImportPassageDto.builder()
                    .id(sectionId)
                    .instruction(instruction.toString().trim())
                    .content(passageText)
                    .questionNumbers(questionNumbers)
                    .build());
            i = j - 1;
        }
        return sections;
    }

    private static List<Integer> findFollowingQuestionNumbers(String[] lines, int startLine) {
        List<Integer> nums = new ArrayList<>();
        for (int j = startLine; j < lines.length; j++) {
            String pline = lines[j].trim();
            if (pline.isEmpty()) {
                continue;
            }
            if (pline.matches("(?i).*(?:Read|Mark|Choose|Complete)\\b.*") || pline.matches("(?i).*For questions\\s+\\d+.*")) {
                break;
            }
            Matcher qm = Pattern.compile("(?i)^Question\\s+(\\d+)").matcher(pline);
            if (qm.find()) {
                nums.add(Integer.parseInt(qm.group(1)));
            } else if (!nums.isEmpty()) {
                break;
            }
        }
        return nums;
    }

    private static String buildStem(QuestionBlock block, boolean hasPassageSection) {
        String stem = block.questionText;
        boolean genericStem = stem.equals("Câu " + block.questionNumber);
        if (genericStem) {
            return "Question " + block.questionNumber + ".";
        }
        if (hasPassageSection && stem.length() < 20) {
            return "Question " + block.questionNumber + ".";
        }
        return stem;
    }

    private static List<OptionBlock> sanitizeOptions(List<OptionBlock> options) {
        List<OptionBlock> abcd = takeFirstAbcdSet(options);
        for (OptionBlock ob : abcd) {
            ob.content = trimOptionContent(ob.content);
        }
        return abcd;
    }

    private static List<OptionBlock> takeFirstAbcdSet(List<OptionBlock> raw) {
        Map<Character, OptionBlock> map = new LinkedHashMap<>();
        for (OptionBlock ob : raw) {
            if (ob.letter >= 'A' && ob.letter <= 'D' && !map.containsKey(ob.letter)) {
                map.put(ob.letter, ob);
            }
            if (map.size() == 4) {
                break;
            }
        }
        List<OptionBlock> result = new ArrayList<>();
        for (char c = 'A'; c <= 'D'; c++) {
            if (map.containsKey(c)) {
                result.add(map.get(c));
            }
        }
        return result.size() >= 2 ? result : raw.stream().limit(4).toList();
    }

    private static String trimOptionContent(String content) {
        if (content == null) {
            return "";
        }
        Matcher m = Pattern.compile("(?i)\\s{2,}(?:Read |URANUS|Question |Mark the|THE END)").matcher(content);
        if (m.find()) {
            return content.substring(0, m.start()).replaceAll("\\s+", " ").trim();
        }
        return content.replaceAll("\\s+", " ").trim();
    }

    private static Map<Integer, Character> extractAnswerKey(String text) {
        Map<Integer, Character> key = new HashMap<>();
        String[] lines = text.split("\n");
        int keyStart = -1;

        for (int i = 0; i < lines.length; i++) {
            if (ANSWER_KEY_HEADER.matcher(lines[i].trim()).find()) {
                keyStart = i;
                break;
            }
        }

        String keySection;
        if (keyStart >= 0) {
            keySection = String.join("\n", Arrays.copyOfRange(lines, keyStart, lines.length));
        } else {
            keySection = text.length() > 2000 ? text.substring(text.length() - 2000) : text;
        }

        Matcher m = ANSWER_KEY_ENTRY.matcher(keySection);
        while (m.find()) {
            int qNum = Integer.parseInt(m.group(1));
            char letter = Character.toUpperCase(m.group(2).charAt(0));
            key.put(qNum, letter);
        }
        return key;
    }

    private static String stripAnswerKeySection(String text) {
        String[] lines = text.split("\n");
        for (int i = lines.length - 1; i >= Math.max(0, lines.length - 30); i--) {
            if (ANSWER_KEY_HEADER.matcher(lines[i].trim()).find()) {
                return String.join("\n", Arrays.copyOfRange(lines, 0, i)).trim();
            }
        }
        return text;
    }

    private static List<QuestionBlock> splitQuestions(String body) {
        List<QuestionBlock> blocks = new ArrayList<>();
        Matcher matcher = QUESTION_BOUNDARY.matcher(body);

        List<int[]> positions = new ArrayList<>();
        while (matcher.find()) {
            int qNum = parseQuestionNumber(matcher);
            positions.add(new int[]{matcher.start(), matcher.end(), qNum});
        }

        if (positions.isEmpty()) {
            return blocks;
        }

        for (int i = 0; i < positions.size(); i++) {
            int contentStart = positions.get(i)[1];
            int contentEnd = (i + 1 < positions.size()) ? positions.get(i + 1)[0] : body.length();
            String chunk = body.substring(contentStart, contentEnd).trim();
            chunk = truncateChunkAtNextSection(chunk);
            if (chunk.isBlank()) {
                continue;
            }
            QuestionBlock block = new QuestionBlock();
            block.questionNumber = positions.get(i)[2];
            parseChunk(chunk, block);
            blocks.add(block);
        }
        return blocks;
    }

    private static String truncateChunkAtNextSection(String chunk) {
        Matcher m = SECTION_CUT.matcher(chunk);
        if (m.find() && hasOptionBlock(chunk.substring(0, m.start()))) {
            return chunk.substring(0, m.start()).trim();
        }
        return chunk;
    }

    private static boolean hasOptionBlock(String text) {
        return findOptionsStart(text) >= 0;
    }

    private static int parseQuestionNumber(Matcher matcher) {
        for (int g = 1; g <= 3; g++) {
            if (matcher.group(g) != null) {
                return Integer.parseInt(matcher.group(g));
            }
        }
        return 0;
    }

    private static void parseChunk(String chunk, QuestionBlock block) {
        chunk = stripBoilerplate(chunk);
        int optionsStart = findOptionsStart(chunk);

        String questionPart;
        String optionsPart;
        if (optionsStart >= 0) {
            questionPart = chunk.substring(0, optionsStart).trim();
            optionsPart = chunk.substring(optionsStart);
        } else {
            questionPart = chunk.trim();
            optionsPart = "";
        }

        List<OptionBlock> options = parseInlineOptions(optionsPart);
        if (options.size() < 2) {
            options = parseOptionsLineByLine(chunk);
            if (options.size() >= 2) {
                questionPart = extractQuestionBeforeOptions(chunk, options.get(0).letter);
            }
        }

        block.questionText = questionPart.isBlank()
                ? "Câu " + block.questionNumber
                : formatStemLayout(questionPart);
        block.options = options;
    }

    /** Giữ xuống dòng cho câu sắp xếp (a. b. c. d. e.) */
    private static String formatStemLayout(String text) {
        if (text == null || text.isBlank()) {
            return text;
        }

        Pattern itemStart = Pattern.compile("(?i)(?:^|\\s)([a-e]|[ivx]+)\\s*[\\.:]");
        int itemCount = 0;
        Matcher counter = itemStart.matcher(text);
        while (counter.find()) {
            itemCount++;
        }

        if (itemCount >= 2) {
            if (text.contains("\n")) {
                StringBuilder sb = new StringBuilder();
                for (String line : text.split("\n")) {
                    String t = line.trim();
                    if (t.isEmpty()) {
                        continue;
                    }
                    if (sb.length() > 0) {
                        sb.append('\n');
                    }
                    sb.append(t.replaceAll("\\s+", " ").trim());
                }
                return sb.toString();
            }

            String[] parts = text.trim().split("(?i)(?=\\s*(?:[a-e]|[ivx]+)\\s*[\\.:])");
            StringBuilder sb = new StringBuilder();
            for (String part : parts) {
                String t = part.trim();
                if (t.isEmpty()) {
                    continue;
                }
                if (sb.length() > 0) {
                    sb.append('\n');
                }
                sb.append(t.replaceAll("\\s+", " ").trim());
            }
            return sb.toString();
        }

        return text.replaceAll("\\s+", " ").trim();
    }

    private static int findOptionsStart(String chunk) {
        Matcher lineMatcher = Pattern.compile("(?m)^\\s*A\\s*[\\.\\):\\-]\\s+").matcher(chunk);
        if (lineMatcher.find()) {
            return lineMatcher.start();
        }
        Matcher inlineMatcher = Pattern.compile("\\sA\\s*[\\.\\):\\-]\\s+").matcher(chunk);
        if (inlineMatcher.find()) {
            return inlineMatcher.start();
        }
        if (chunk.matches("(?s)^\\s*A\\s*[\\.\\):\\-]\\s+.*")) {
            return 0;
        }
        return -1;
    }

    private static String extractQuestionBeforeOptions(String chunk, char firstLetter) {
        Pattern marker = Pattern.compile("\\b" + firstLetter + "\\s*[\\.\\):\\-]\\s*");
        Matcher m = marker.matcher(chunk);
        if (m.find()) {
            return chunk.substring(0, m.start()).trim();
        }
        return "";
    }

    private static List<OptionBlock> parseInlineOptions(String text) {
        if (text == null || text.isBlank()) {
            return List.of();
        }

        List<OptionBlock> options = new ArrayList<>();
        Matcher m = OPTION_MARKER.matcher(text);
        List<int[]> markers = new ArrayList<>();

        while (m.find()) {
            markers.add(new int[]{m.start(), m.end(), m.group(1).charAt(0)});
        }

        for (int i = 0; i < markers.size() && i < 8; i++) {
            int contentStart = markers.get(i)[1];
            int contentEnd = (i + 1 < markers.size()) ? markers.get(i + 1)[0] : text.length();
            String content = text.substring(contentStart, contentEnd).trim();
            if (!content.isEmpty()) {
                OptionBlock ob = new OptionBlock();
                ob.letter = Character.toUpperCase((char) markers.get(i)[2]);
                ob.content = content;
                options.add(ob);
            }
        }
        return options;
    }

    private static List<OptionBlock> parseOptionsLineByLine(String chunk) {
        List<OptionBlock> options = new ArrayList<>();
        for (String line : chunk.split("\n")) {
            String trimmed = line.trim();
            if (trimmed.isEmpty()) {
                continue;
            }
            Matcher optMatcher = OPTION_LINE.matcher(trimmed);
            if (optMatcher.matches()) {
                OptionBlock opt = new OptionBlock();
                opt.letter = Character.toUpperCase(optMatcher.group(1).charAt(0));
                opt.content = optMatcher.group(2).trim();
                options.add(opt);
            } else {
                List<OptionBlock> inline = parseInlineOptions(trimmed);
                if (inline.size() >= 2) {
                    options.addAll(inline);
                }
            }
        }
        return options;
    }

    private static ExamImportQuestionDto toImportQuestionDto(QuestionBlock block, Map<Integer, Character> answerKey) {
        if (block.options.size() < 2) {
            return null;
        }

        Character correctLetter = answerKey.get(block.questionNumber);
        boolean hasKey = correctLetter != null;

        List<CreateExamRequest.OptionDto> options = new ArrayList<>();
        for (OptionBlock ob : block.options) {
            CreateExamRequest.OptionDto opt = new CreateExamRequest.OptionDto();
            opt.setContent(escapeHtml(ob.content));
            if (hasKey) {
                opt.setIsCorrect(ob.letter == correctLetter.charValue());
            } else {
                opt.setIsCorrect(false);
            }
            options.add(opt);
        }

        return ExamImportQuestionDto.builder()
                .sourceNumber(block.questionNumber)
                .sectionId(block.sectionId)
                .stem(escapeHtmlWithBreaks(block.questionText))
                .points(1.0)
                .questionType("MULTIPLE_CHOICE")
                .skillTag("GENERAL")
                .options(options)
                .build();
    }

    private static String escapeHtmlWithBreaks(String text) {
        return escapeHtml(text).replace("\n", "<br/>");
    }

    private static String escapeHtml(String text) {
        if (text == null) return "";
        return text
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;");
    }

    private static class QuestionBlock {
        int questionNumber;
        String sectionId;
        String questionText = "";
        List<OptionBlock> options = new ArrayList<>();
    }

    private static class OptionBlock {
        char letter;
        String content;
    }
}
