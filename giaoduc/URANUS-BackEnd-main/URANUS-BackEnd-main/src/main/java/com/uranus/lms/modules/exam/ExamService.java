package com.uranus.lms.modules.exam;

import com.uranus.lms.exception.BadRequestException;
import com.uranus.lms.exception.ResourceNotFoundException;
import com.uranus.lms.modules.exam.dto.*;
import com.uranus.lms.modules.exam.dto.ExamSnapshotDto;
import com.uranus.lms.modules.folder.ContentFolder;
import com.uranus.lms.modules.folder.ContentFolderService;
import com.uranus.lms.modules.user.User;
import com.uranus.lms.modules.auth.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import com.uranus.lms.common.response.RestPageImpl;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExamService {

    private final ExamRepository examRepository;
    private final StudentExamResultRepository resultRepository;
    private final QuestionOptionRepository optionRepository;
    private final DraftAnswerRepository draftAnswerRepository;
    private final ContentFolderService folderService;
    private final ExamAIService examAIService;
    private final StudentAnswerRepository studentAnswerRepository;
    private final UserFavoriteExamRepository favoriteExamRepository;
    private final com.uranus.lms.modules.gamification.GamificationService gamificationService;
    private final com.uranus.lms.modules.mistakevault.MistakeVaultService mistakeVaultService;
    private final EmailService emailService;
    private final ExamAccessControlService examAccessControlService;
    private final QuestionGroupRepository questionGroupRepository;
    private final com.uranus.lms.modules.access.StudentResourceAccessService studentResourceAccessService;
    private final com.uranus.lms.modules.classroom.ClassExamRepository classExamRepository;
    private final com.uranus.lms.modules.classroom.ClassroomRepository classroomRepository;
    private final com.uranus.lms.modules.classroom.ClassResourceRepository classResourceRepository;
    private final com.uranus.lms.modules.notification.NotificationService notificationService;

    public List<String> getAvailableSubjects() {
        return examRepository.findDistinctSubjects().stream()
                .filter(s -> s != null && !s.isEmpty())
                .flatMap(s -> java.util.Arrays.stream(s.split(",")))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .distinct()
                .sorted()
                .collect(java.util.stream.Collectors.toList());
    }

    public Page<ExamResponse> getAllPublishedExams(Pageable pageable, String search, String folderId, String subject, String grade, User user) {
        Specification<Exam> spec = Specification.where((Specification<Exam>) (root, query, cb) -> cb.isTrue(root.get("isPublished")));
        spec = spec.and((root, query, cb) -> cb.equal(root.get("visibility"), com.uranus.lms.modules.access.Visibility.PUBLIC));
        
        if (search != null && !search.trim().isEmpty()) {
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("title")), "%" + search.trim().toLowerCase() + "%"));
        }
        if (folderId != null && !folderId.trim().isEmpty()) {
            if ("none".equals(folderId)) {
                spec = spec.and((root, query, cb) -> cb.isNull(root.get("folder")));
            } else {
                try {
                    UUID folderUuid = UUID.fromString(folderId);
                    spec = spec.and((root, query, cb) -> cb.equal(root.join("folder").get("id"), folderUuid));
                } catch (IllegalArgumentException e) {
                    // Invalid UUID, ignore filter
                }
            }
        }
        if (subject != null && !subject.trim().isEmpty()) {
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("subject")), "%" + subject.trim().toLowerCase() + "%"));
        }
        if (grade != null && !grade.trim().isEmpty()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("grade"), grade));
        }

        Page<Exam> examPage = examRepository.findAll(spec, pageable);
        var refs = examPage.getContent().stream()
                .map(e -> new com.uranus.lms.modules.access.StudentResourceAccessService.ResourceRef(
                        e.getId(),
                        e.getTeacher() != null ? e.getTeacher().getId() : null,
                        e.getVisibility()))
                .toList();
        var decisions = studentResourceAccessService.decideForResources(
                user, refs);

        List<ExamResponse> content = examPage.getContent().stream().map(e -> {
            ExamResponse response = toResponse(e, true, user);
            var decision = decisions.get(e.getId());
            if (decision != null && decision.isLocked() && user != null && classExamRepository.isExamAssignedToUserClass(e.getId(), user.getId())) {
                decision = com.uranus.lms.modules.access.ResourceAccessDecision.full();
            }
            applyAccess(response, decision);
            return response;
        }).toList();

        return new RestPageImpl<>(content, examPage.getPageable(), examPage.getTotalElements());
    }

    public Page<ExamResponse> getTeacherExams(User teacher, Pageable pageable, String search, String folderId, String subject, String grade) {
        Specification<Exam> spec = Specification.where((root, query, cb) -> cb.equal(root.get("teacher"), teacher));
        
        if (search != null && !search.trim().isEmpty()) {
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("title")), "%" + search.trim().toLowerCase() + "%"));
        }
        if (folderId != null && !folderId.trim().isEmpty()) {
            if ("none".equals(folderId)) {
                spec = spec.and((root, query, cb) -> cb.isNull(root.get("folder")));
            } else {
                try {
                    UUID folderUuid = UUID.fromString(folderId);
                    spec = spec.and((root, query, cb) -> cb.equal(root.join("folder").get("id"), folderUuid));
                } catch (IllegalArgumentException e) {
                    // Invalid UUID, ignore filter
                }
            }
        }
        if (subject != null && !subject.trim().isEmpty()) {
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("subject")), "%" + subject.trim().toLowerCase() + "%"));
        }
        if (grade != null && !grade.trim().isEmpty()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("grade"), grade));
        }
        
        return examRepository.findAll(spec, pageable).map(e -> toResponse(e, false, teacher));
    }

    public ExamResponse getExamById(UUID id, User user, String accessCode) {
        return getExamById(id, user, accessCode, null);
    }

    public ExamResponse getExamById(UUID id, User user, String accessCode, UUID libraryResourceId) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đề thi với id: " + id));
        boolean forStudent = true;
        if (user != null && examAccessControlService.hasEditPermission(exam, user)) {
            forStudent = false; // Teacher / TA / Admin with edit permission
        }
        if (forStudent) {
            requireValidAccessCode(exam, accessCode);
        }
        boolean revealAnswers = !forStudent || examAccessControlService.isPureLibraryExam(exam, libraryResourceId);
        ExamResponse response = toResponse(exam, forStudent, user, revealAnswers);
        if (forStudent) {
            var decision = studentResourceAccessService.decideSingle(
                    user,
                    exam.getId(),
                    exam.getVisibility(),
                    exam.getTeacher() != null ? exam.getTeacher().getId() : null);
            if (decision.isLocked() && user != null && classExamRepository.isExamAssignedToUserClass(exam.getId(), user.getId())) {
                decision = com.uranus.lms.modules.access.ResourceAccessDecision.full();
            }
            if (decision.isLocked() && examAccessControlService.isAccessibleViaPublicLibraryResource(exam, libraryResourceId)) {
                decision = com.uranus.lms.modules.access.ResourceAccessDecision.full();
            }
            applyAccess(response, decision);
            if (Boolean.TRUE.equals(response.getLocked())) {
                response.setQuestions(List.of());
                response.setQuestionGroups(null);
            }
        } else {
            applyAccess(response, com.uranus.lms.modules.access.ResourceAccessDecision.full());
        }
        if (libraryResourceId != null || examAccessControlService.isPureLibraryExam(exam, libraryResourceId)) {
            response.setMaxAttempts(0);
        }
        return response;
    }

    @Cacheable(value = "examByCode", key = "#code")
    public ExamResponse getExamByCode(String code) {
        Exam exam = examRepository.findByExamCodeAndIsPublishedTrue(code)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đề thi với mã: " + code));
        return toResponse(exam, true, null);
    }

    @Transactional
    @CacheEvict(value = {"publishedExams", "examByCode"}, allEntries = true)
    // Autosave luu nhap goi chung DTO nay tu Buoc 1/4 (moi chon loai de, chua
    // co cau hoi), nen @NotEmpty tren DTO da bi bo. Chi bat buoc co cau hoi khi
    // thuc su XUAT BAN, tranh chan nham autosave nhu bug "Luu that bai" da gap.
    private void requireQuestionsIfPublishing(CreateExamRequest request) {
        if (Boolean.TRUE.equals(request.getIsPublished())
                && (request.getQuestions() == null || request.getQuestions().isEmpty())) {
            throw new IllegalArgumentException("Đề thi phải có ít nhất một câu hỏi");
        }
    }

    public ExamResponse createExam(CreateExamRequest request, User teacher) {
        requireQuestionsIfPublishing(request);
        String examCode = generateUniqueExamCode();

        Exam exam = Exam.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .subject(request.getSubject())
                .grade(request.getGrade())
                .examCode(examCode)
                .durationMinutes(request.getDurationMinutes())
                .passingScore(request.getPassingScore() != null ? request.getPassingScore() : 50.0)
                .shuffleQuestions(request.getShuffleQuestions() != null ? request.getShuffleQuestions() : false)
                .isPublished(request.getIsPublished() != null ? request.getIsPublished() : false)
                .visibility(request.getVisibility() != null ? request.getVisibility() : com.uranus.lms.modules.access.Visibility.PUBLIC)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .reviewPolicy(request.getReviewPolicy() != null ? request.getReviewPolicy() : "IMMEDIATELY")
                .maxAttempts(request.getMaxAttempts() != null ? request.getMaxAttempts() : 1)
                .examType(request.getExamType() != null ? request.getExamType() : "DETAILED")
                .pdfUrl(request.getPdfUrl())
                .audioUrl(request.getAudioUrl())
                .audioTracks(request.getAudioTracks() != null ? request.getAudioTracks() : new ArrayList<>())
                .accessCode(request.getAccessCode())
                .teacher(teacher)
                .folder(resolveFolder(request.getFolderId(), teacher))
                .questions(new ArrayList<>())
                .build();

        // PHẢI save exam trước để lấy ID, nếu không Hibernate sẽ báo lỗi TransientPropertyValueException khi save QuestionGroup
        final Exam savedExam = examRepository.save(exam);

        // 1. Tạo QuestionGroup entities trước (cần ID để gán cho question)
        Map<String, UUID> tempIdToGroupId = new HashMap<>();
        if (request.getQuestionGroups() != null) {
            List<QuestionGroup> groups = IntStream.range(0, request.getQuestionGroups().size())
                    .mapToObj(i -> {
                        CreateExamRequest.QuestionGroupDto gDto = request.getQuestionGroups().get(i);
                        return QuestionGroup.builder()
                                .exam(savedExam)
                                .groupTitle(gDto.getGroupTitle())
                                .passageText(gDto.getPassageText())
                                .audioUrl(gDto.getAudioUrl())
                                .orderIndex(i)
                                .build();
                    }).collect(Collectors.toList());
            List<QuestionGroup> savedGroups = questionGroupRepository.saveAll(groups);
            for (int i = 0; i < request.getQuestionGroups().size(); i++) {
                CreateExamRequest.QuestionGroupDto gDto = request.getQuestionGroups().get(i);
                if (gDto.getId() != null) {
                    tempIdToGroupId.put(gDto.getId(), savedGroups.get(i).getId());
                }
            }
        }

        if (request.getQuestions() != null) {
            List<Question> questions = IntStream.range(0, request.getQuestions().size())
                    .mapToObj(i -> {
                        CreateExamRequest.QuestionDto dto = request.getQuestions().get(i);
                        UUID resolvedGroupId = null;
                        if (dto.getGroupId() != null) {
                            resolvedGroupId = tempIdToGroupId.get(dto.getGroupId());
                            if (resolvedGroupId == null) {
                                try { resolvedGroupId = UUID.fromString(dto.getGroupId()); } catch(Exception e) {}
                            }
                        }
                        Question q = Question.builder()
                                .content(dto.getContent())
                                .imageUrl(dto.getImageUrl())
                                .questionType(dto.getQuestionType() != null ? dto.getQuestionType() : "MULTIPLE_CHOICE")
                                .skillTag(dto.getSkillTag() != null ? dto.getSkillTag() : "GENERAL")
                                .orderIndex(i)
                                .points(dto.getPoints() != null ? dto.getPoints() : 1.0)
                                .groupId(resolvedGroupId)
                                .scoringConfig(dto.getScoringConfig())
                                .explanation(dto.getExplanation())
                                .exam(savedExam)
                                .options(new ArrayList<>())
                                .build();

                        if (dto.getOptions() != null) {
                            List<QuestionOption> opts = dto.getOptions().stream()
                                    .map(o -> QuestionOption.builder()
                                            .content(o.getContent())
                                            .isCorrect(o.getIsCorrect() != null ? o.getIsCorrect() : false)
                                            .question(q)
                                            .build())
                                    .collect(Collectors.toList());
                            q.getOptions().addAll(opts);
                        }
                        return q;
                    })
                    .collect(Collectors.toList());
            savedExam.getQuestions().addAll(questions);
        }

        Exam finalExam = examRepository.save(savedExam);
        
        if (request.getVisibility() == com.uranus.lms.modules.access.Visibility.CLASSROOM && request.getAssignedClassIds() != null) {
            for (UUID classId : request.getAssignedClassIds()) {
                com.uranus.lms.modules.classroom.Classroom classroom = classroomRepository.findById(classId).orElse(null);
                if (classroom != null && !classResourceRepository.existsByClassroom_IdAndResourceId(classId, finalExam.getId())) {
                    com.uranus.lms.modules.classroom.ClassResource resource = com.uranus.lms.modules.classroom.ClassResource.builder()
                            .classroom(classroom)
                            .resourceId(finalExam.getId())
                            .resourceType(com.uranus.lms.modules.classroom.ClassResource.ResourceType.EXAM)
                            .folderId(null)
                            .build();
                    classResourceRepository.save(resource);
                }
            }
        }
        
        return toResponse(finalExam, false, teacher);
    }

    @Transactional
    @CacheEvict(value = {"publishedExams", "examByCode"}, allEntries = true)
    public ExamResponse updateExam(UUID examId, CreateExamRequest request, User teacher) {
        requireQuestionsIfPublishing(request);
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đề thi"));

        examAccessControlService.verifyEditPermission(exam, teacher);

        // Removed check for ongoing attempts to allow fixing exams

        exam.setTitle(request.getTitle());
        exam.setDescription(request.getDescription());
        exam.setSubject(request.getSubject());
        exam.setGrade(request.getGrade());
        exam.setDurationMinutes(request.getDurationMinutes());
        if (request.getPassingScore() != null) exam.setPassingScore(request.getPassingScore());
        if (request.getShuffleQuestions() != null) exam.setShuffleQuestions(request.getShuffleQuestions());
        if (request.getIsPublished() != null) exam.setIsPublished(request.getIsPublished());
        if (request.getVisibility() != null) exam.setVisibility(request.getVisibility());
        exam.setStartTime(request.getStartTime());
        exam.setEndTime(request.getEndTime());
        if (request.getReviewPolicy() != null) exam.setReviewPolicy(request.getReviewPolicy());
        if (request.getMaxAttempts() != null) exam.setMaxAttempts(request.getMaxAttempts());
        if (request.getExamType() != null) exam.setExamType(request.getExamType());
        exam.setPdfUrl(request.getPdfUrl());
        exam.setAudioUrl(request.getAudioUrl());
        exam.setAudioTracks(request.getAudioTracks() != null ? request.getAudioTracks() : new ArrayList<>());
        exam.setAccessCode(request.getAccessCode());
        exam.setFolder(resolveFolder(request.getFolderId(), teacher));

        // Xóa các bản nháp (drafts) liên quan đến bài thi này để tránh lỗi foreign key constraint
        draftAnswerRepository.deleteAllByExamId(exam.getId());

        // Process Question Groups
        Map<UUID, QuestionGroup> existingGroups = questionGroupRepository.findByExamIdOrderByOrderIndexAsc(exam.getId())
                .stream().collect(Collectors.toMap(QuestionGroup::getId, g -> g));
        Map<String, UUID> tempIdToGroupId = new HashMap<>();
        List<QuestionGroup> groupsToSave = new ArrayList<>();

        if (request.getQuestionGroups() != null) {
            for (int i = 0; i < request.getQuestionGroups().size(); i++) {
                CreateExamRequest.QuestionGroupDto gDto = request.getQuestionGroups().get(i);
                QuestionGroup group = null;
                if (gDto.getId() != null && gDto.getId().length() >= 36) {
                    try {
                        UUID gId = UUID.fromString(gDto.getId());
                        group = existingGroups.remove(gId);
                    } catch (Exception ignored) {}
                }
                if (group == null) {
                    group = new QuestionGroup();
                    group.setExam(exam);
                }
                group.setGroupTitle(gDto.getGroupTitle());
                group.setPassageText(gDto.getPassageText());
                group.setAudioUrl(gDto.getAudioUrl());
                group.setOrderIndex(i);
                groupsToSave.add(group);
            }
        }

        if (!existingGroups.isEmpty()) {
            questionGroupRepository.deleteAll(existingGroups.values());
        }

        List<QuestionGroup> savedGroups = questionGroupRepository.saveAll(groupsToSave);
        if (request.getQuestionGroups() != null) {
            for (int i = 0; i < request.getQuestionGroups().size(); i++) {
                CreateExamRequest.QuestionGroupDto gDto = request.getQuestionGroups().get(i);
                if (gDto.getId() != null) {
                    tempIdToGroupId.put(gDto.getId(), savedGroups.get(i).getId());
                }
            }
        }

        // Process Questions
        Map<UUID, Question> existingQuestions = exam.getQuestions().stream()
                .collect(Collectors.toMap(Question::getId, q -> q));
        List<Question> currentExamQuestions = new ArrayList<>(exam.getQuestions());
        currentExamQuestions.sort(Comparator.comparingInt(Question::getOrderIndex));

        List<Question> updatedQuestionsList = new ArrayList<>();

        if (request.getQuestions() != null) {
            for (int i = 0; i < request.getQuestions().size(); i++) {
                CreateExamRequest.QuestionDto dto = request.getQuestions().get(i);
                Question q = null;
                if (dto.getId() != null && dto.getId().length() >= 36) {
                    try {
                        UUID qId = UUID.fromString(dto.getId());
                        q = existingQuestions.remove(qId);
                    } catch (Exception ignored) {}
                }
                // Fallback: If not matched by UUID, reuse existing question at index i to preserve foreign key links!
                if (q == null && i < currentExamQuestions.size()) {
                    Question candidate = currentExamQuestions.get(i);
                    if (existingQuestions.containsKey(candidate.getId())) {
                        q = existingQuestions.remove(candidate.getId());
                    }
                }
                if (q == null) {
                    q = new Question();
                    q.setExam(exam);
                    q.setOptions(new ArrayList<>());
                }

                UUID resolvedGroupId = null;
                if (dto.getGroupId() != null) {
                    resolvedGroupId = tempIdToGroupId.get(dto.getGroupId());
                    if (resolvedGroupId == null) {
                        try { resolvedGroupId = UUID.fromString(dto.getGroupId()); } catch (Exception ignored) {}
                    }
                }

                q.setContent(dto.getContent());
                q.setImageUrl(dto.getImageUrl());
                q.setQuestionType(dto.getQuestionType() != null ? dto.getQuestionType() : "MULTIPLE_CHOICE");
                q.setSkillTag(dto.getSkillTag() != null ? dto.getSkillTag() : "GENERAL");
                q.setOrderIndex(i);
                q.setPoints(dto.getPoints() != null ? dto.getPoints() : 1.0);
                q.setGroupId(resolvedGroupId);
                q.setScoringConfig(dto.getScoringConfig());
                q.setExplanation(dto.getExplanation());

                // Process Options
                Map<UUID, QuestionOption> existingOptions = q.getOptions().stream()
                        .collect(Collectors.toMap(QuestionOption::getId, o -> o));
                List<QuestionOption> currentOptions = new ArrayList<>(q.getOptions());
                List<QuestionOption> updatedOptionsList = new ArrayList<>();

                if (dto.getOptions() != null) {
                    for (int j = 0; j < dto.getOptions().size(); j++) {
                        CreateExamRequest.OptionDto oDto = dto.getOptions().get(j);
                        QuestionOption opt = null;
                        if (oDto.getId() != null && oDto.getId().length() >= 36) {
                            try {
                                UUID optId = UUID.fromString(oDto.getId());
                                opt = existingOptions.remove(optId);
                            } catch (Exception ignored) {}
                        }
                        // Fallback: If not matched by UUID, reuse existing option at index j to preserve foreign key links!
                        if (opt == null && j < currentOptions.size()) {
                            QuestionOption candidate = currentOptions.get(j);
                            if (existingOptions.containsKey(candidate.getId())) {
                                opt = existingOptions.remove(candidate.getId());
                            }
                        }
                        if (opt == null) {
                            opt = new QuestionOption();
                            opt.setQuestion(q);
                        }
                        opt.setContent(oDto.getContent());
                        opt.setIsCorrect(oDto.getIsCorrect() != null ? oDto.getIsCorrect() : false);
                        updatedOptionsList.add(opt);
                    }
                }

                q.getOptions().removeIf(o -> !updatedOptionsList.contains(o));
                for (QuestionOption newOpt : updatedOptionsList) {
                    if (!q.getOptions().contains(newOpt)) {
                        q.getOptions().add(newOpt);
                    }
                }

                updatedQuestionsList.add(q);
            }
        }

        exam.getQuestions().removeIf(q -> !updatedQuestionsList.contains(q));
        for (Question newQ : updatedQuestionsList) {
            if (!exam.getQuestions().contains(newQ)) {
                exam.getQuestions().add(newQ);
            }
        }

        Exam savedExam = examRepository.save(exam);

        // Tự động chấm lại điểm
        autoRegradeExamResults(savedExam);

        return toResponse(savedExam, false, teacher);
    }

    private void autoRegradeExamResults(Exam exam) {
        List<StudentExamResult> results = resultRepository.findByExamAndSubmittedAtIsNotNull(exam);
        if (results.isEmpty()) return;
        
        ExamSnapshotDto snapshot = createSnapshot(exam);
        List<Question> sortedExamQuestions = new ArrayList<>(exam.getQuestions());
        sortedExamQuestions.sort(Comparator.comparingInt(Question::getOrderIndex));
        
        for (StudentExamResult result : results) {
            if (result.getAnswers() == null || result.getAnswers().isEmpty()) {
                // Đề thi này đã từng bị cập nhật ở bản cũ làm mất chi tiết bài làm, bỏ qua
                continue;
            }
            
            result.setExamSnapshot(snapshot);
            double totalScore = 0.0;
            
            for (int aIdx = 0; aIdx < result.getAnswers().size(); aIdx++) {
                StudentAnswer answer = result.getAnswers().get(aIdx);
                Question currentQuestion = answer.getQuestion();
                if (currentQuestion == null && aIdx < sortedExamQuestions.size()) {
                    currentQuestion = sortedExamQuestions.get(aIdx);
                    answer.setQuestion(currentQuestion);
                }
                if (currentQuestion == null) continue;
                
                String type = currentQuestion.getQuestionType();
                if (type == null) type = "MULTIPLE_CHOICE";
                
                if ("ESSAY".equals(type)) {
                    totalScore += (answer.getPointsEarned() != null ? answer.getPointsEarned() : 0.0);
                    continue;
                }
                
                double qScore = 0.0;
                boolean isCorrect = false;
                
                if ("MULTIPLE_CHOICE".equals(type) || "ABCD".equals(type)) {
                    QuestionOption selectedOpt = null;
                    if (answer.getSelectedOption() != null) {
                        selectedOpt = currentQuestion.getOptions().stream()
                                .filter(o -> o.getId().equals(answer.getSelectedOption().getId()))
                                .findFirst().orElse(null);
                    }
                    if (selectedOpt == null && answer.getTextResponse() != null && !answer.getTextResponse().trim().isEmpty()) {
                        String resp = answer.getTextResponse().trim();
                        selectedOpt = currentQuestion.getOptions().stream()
                                .filter(o -> o.getId().toString().equals(resp) || (o.getContent() != null && o.getContent().replaceAll("<[^>]+>", "").trim().equalsIgnoreCase(resp)))
                                .findFirst().orElse(null);
                        if (selectedOpt != null) {
                            answer.setSelectedOption(selectedOpt);
                        }
                    }
                    
                    if (selectedOpt != null && Boolean.TRUE.equals(selectedOpt.getIsCorrect())) {
                        qScore = currentQuestion.getPoints() != null ? currentQuestion.getPoints() : 1.0;
                        isCorrect = true;
                    } else if (selectedOpt == null && answer.getPointsEarned() != null && answer.getPointsEarned() > 0) {
                        // Safety: preserve existing earned points if option link is temporarily disconnected
                        qScore = answer.getPointsEarned();
                        isCorrect = Boolean.TRUE.equals(answer.getIsCorrect());
                    }
                } else if ("TRUE_FALSE".equals(type)) {
                    String selectedOptIdStr = answer.getTextResponse();
                    if (selectedOptIdStr != null && selectedOptIdStr.trim().startsWith("{")) {
                        try {
                            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                            @SuppressWarnings("unchecked")
                            Map<String, Boolean> statementAnswers = mapper.readValue(selectedOptIdStr, Map.class);
                            int totalStatements = currentQuestion.getOptions() != null ? currentQuestion.getOptions().size() : 0;
                            int wrongCount = 0;
                            for (QuestionOption opt : currentQuestion.getOptions()) {
                                Boolean studentAnswer = statementAnswers.get(opt.getId().toString());
                                boolean correctAns = Boolean.TRUE.equals(opt.getIsCorrect());
                                if (studentAnswer == null || studentAnswer != correctAns) wrongCount++;
                            }
                            double ratio = computeTrueFalseRatio(currentQuestion.getScoringConfig(), wrongCount, totalStatements);
                            qScore = (currentQuestion.getPoints() != null ? currentQuestion.getPoints() : 0.0) * ratio;
                            isCorrect = (wrongCount == 0);
                        } catch (Exception ignored) {}
                    }
                } else if ("SHORT_ANSWER".equals(type) || "FILL_BLANK".equals(type)) {
                    String studentText = answer.getTextResponse();
                    if (studentText != null && !studentText.trim().isEmpty()) {
                        studentText = normalizeShortAnswer(studentText);
                        if (currentQuestion.getOptions() != null) {
                            for (QuestionOption opt : currentQuestion.getOptions()) {
                                if (Boolean.TRUE.equals(opt.getIsCorrect()) && opt.getContent() != null) {
                                    String correctText = normalizeShortAnswer(opt.getContent());
                                    if (studentText.equals(correctText)) {
                                        isCorrect = true;
                                        qScore = currentQuestion.getPoints() != null ? currentQuestion.getPoints() : 1.0;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
                
                answer.setIsCorrect(isCorrect);
                answer.setPointsEarned(qScore);
                totalScore += qScore;
            }
            
            if (totalScore == 0.0 && result.getTotalScore() != null && result.getTotalScore() > 0.0) {
                totalScore = result.getTotalScore();
            }
            result.setTotalScore(totalScore);
            double maxScore = snapshot != null && snapshot.getMaxScore() != null ? snapshot.getMaxScore() : sortedExamQuestions.stream().mapToDouble(sq -> sq.getPoints() != null ? sq.getPoints() : 0.0).sum();
            if (maxScore == 0.0 && exam.getQuestions() != null) {
                maxScore = exam.getQuestions().stream().mapToDouble(sq -> sq.getPoints() != null ? sq.getPoints() : 0.0).sum();
            }
            double percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
            double passingScore = exam.getPassingScore() != null ? exam.getPassingScore() : 0.0;
            boolean passed = exam.getPassingScore() == null || percentage >= passingScore;
            result.setIsPassed(passed);
        }
        
        resultRepository.saveAll(results);
    }

    @Transactional
    @CacheEvict(value = {"publishedExams", "examByCode"}, allEntries = true)
    public ExamResponse togglePublish(UUID examId, User teacher) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đề thi"));
        examAccessControlService.verifyEditPermission(exam, teacher);
        exam.setIsPublished(!exam.getIsPublished());
        return toResponse(examRepository.save(exam), false, teacher);
    }

    @Transactional
    @CacheEvict(value = {"publishedExams", "examByCode"}, allEntries = true)
    public void deleteExam(UUID examId, User teacher) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đề thi"));
        examAccessControlService.verifyEditPermission(exam, teacher);
        favoriteExamRepository.deleteByExam(exam);
        examRepository.delete(exam);
    }

    // --- Làm bài & Nộp bài ---

    @Transactional
    public OngoingExamResponse startExam(UUID examId, User student, String accessCode) {
        return startExam(examId, student, accessCode, null);
    }

    public OngoingExamResponse startExam(UUID examId, User student, String accessCode, UUID libraryResourceId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đề thi"));
        requireValidAccessCode(exam, accessCode);

        var decision = studentResourceAccessService.decideSingle(
                student,
                exam.getId(),
                exam.getVisibility(),
                exam.getTeacher() != null ? exam.getTeacher().getId() : null);
        if (decision.isLocked() && student != null && classExamRepository.isExamAssignedToUserClass(exam.getId(), student.getId())) {
            decision = com.uranus.lms.modules.access.ResourceAccessDecision.full();
        }
        if (decision.isLocked() && examAccessControlService.isAccessibleViaPublicLibraryResource(exam, libraryResourceId)) {
            decision = com.uranus.lms.modules.access.ResourceAccessDecision.full();
        }
        if (decision.isLocked()) {
            throw new com.uranus.lms.exception.ForbiddenException(
                    decision.getUnlockHint() != null
                            ? decision.getUnlockHint()
                            : "Bạn cần đăng ký học để làm đề thi này.");
        }

        // Kiểm tra thời gian mở/đóng
        LocalDateTime now = LocalDateTime.now();
        if (exam.getStartTime() != null && now.isBefore(exam.getStartTime())) {
            throw new BadRequestException("Đề thi chưa đến giờ mở.");
        }
        if (exam.getEndTime() != null && now.isAfter(exam.getEndTime())) {
            throw new BadRequestException("Đề thi đã đóng.");
        }

        // Kiểm tra bài đang làm dở
        Optional<StudentExamResult> ongoing = resultRepository.findFirstByStudentAndExamAndSubmittedAtIsNull(student, exam);
        if (ongoing.isPresent()) {
            StudentExamResult result = ongoing.get();
            Map<String, String> answers = new HashMap<>();
            List<DraftAnswer> drafts = draftAnswerRepository.findByResult(result);
            drafts.forEach(d -> {
                if (d.getQuestion() != null) {
                    if (d.getSelectedOption() != null) {
                        answers.put(d.getQuestion().getId().toString(), d.getSelectedOption().getId().toString());
                    } else if (d.getTextResponse() != null) {
                        answers.put(d.getQuestion().getId().toString(), d.getTextResponse());
                    }
                }
            });
            long elapsedSeconds = Duration.between(result.getStartedAt(), now).getSeconds();
            return OngoingExamResponse.builder()
                    .resultId(result.getId().toString())
                    .answers(answers)
                    .cheatWarningCount(result.getCheatWarningCount())
                    .cheatDetails(result.getCheatDetails())
                    .elapsedSeconds(elapsedSeconds)
                    .examSnapshot(hideExplanationForOngoing(result.getExamSnapshot() != null ? result.getExamSnapshot() : createSnapshot(exam)))
                    .build();
        }

        // Kiểm tra số lần làm bài (maxAttempts = 0 hoặc null nghĩa là không giới hạn)
        // Nếu làm bài từ kho học liệu thì cố định số lần làm là không giới hạn
        boolean isLibraryExam = libraryResourceId != null || examAccessControlService.isPureLibraryExam(exam, libraryResourceId);
        if (!isLibraryExam) {
            long attempts = resultRepository.countByStudentAndExamAndSubmittedAtIsNotNull(student, exam);
            if (exam.getMaxAttempts() != null && exam.getMaxAttempts() > 0 && attempts >= exam.getMaxAttempts()) {
                throw new BadRequestException("Bạn đã hết số lần làm bài cho phép.");
            }
        }

        StudentExamResult result = StudentExamResult.builder()
                .student(student)
                .exam(exam)
                .startedAt(LocalDateTime.now())
                .examSnapshot(createSnapshot(exam))
                .build();

        result = resultRepository.save(result);
        
        return OngoingExamResponse.builder()
                .resultId(result.getId().toString())
                .answers(new HashMap<>())
                .cheatWarningCount(0)
                .cheatDetails("[]")
                .elapsedSeconds(0L)
                .examSnapshot(hideExplanationForOngoing(result.getExamSnapshot()))
                .build();
    }

    @Transactional
    public void saveDraft(UUID examId, User student, SubmitExamRequest request) {
        Exam exam = examRepository.findById(examId).orElseThrow();
        StudentExamResult result = resultRepository.findFirstByStudentAndExamAndSubmittedAtIsNull(student, exam)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy bài thi đang làm hợp lệ."));

        if (request.getCheatWarningCount() != null) {
            result.setCheatWarningCount(request.getCheatWarningCount());
        }
        if (request.getCheatDetails() != null) {
            result.setCheatDetails(request.getCheatDetails());
        }
        resultRepository.save(result);

        if (request.getAnswers() == null) return;

        for (Map.Entry<String, String> entry : request.getAnswers().entrySet()) {
            try {
                UUID qId = UUID.fromString(entry.getKey());
                String answerStr = entry.getValue();

                Question question = exam.getQuestions().stream()
                        .filter(q -> q.getId().equals(qId)).findFirst()
                        .orElse(null);
                if (question == null) continue;

                DraftAnswer draft = draftAnswerRepository.findByResultAndQuestion(result, question)
                        .orElse(DraftAnswer.builder().result(result).question(question).build());

                draft.setSelectedOption(null);
                draft.setTextResponse(null);

                if (answerStr != null && !answerStr.trim().isEmpty()) {
                    if ("ESSAY".equals(question.getQuestionType()) || 
                        "SHORT_ANSWER".equals(question.getQuestionType()) || 
                        "FILL_BLANK".equals(question.getQuestionType()) || 
                        ("TRUE_FALSE".equals(question.getQuestionType()) && answerStr.trim().startsWith("{"))) {
                        draft.setTextResponse(answerStr);
                    } else {
                        try {
                            UUID optId = UUID.fromString(answerStr);
                            QuestionOption option = optionRepository.findById(optId).orElse(null);
                            draft.setSelectedOption(option);
                        } catch (IllegalArgumentException e) {
                            // ignore invalid UUID
                        }
                    }
                }

                draftAnswerRepository.save(draft);
            } catch (Exception ignored) {}
        }
    }

    @Transactional
    public StudentExamResult submitExam(UUID examId, User student, SubmitExamRequest request) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đề thi"));
        StudentExamResult result = resultRepository.findFirstByStudentAndExamAndSubmittedAtIsNull(student, exam)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy bài thi đang làm hợp lệ."));

        if (result.getSubmittedAt() != null) {
            throw new IllegalStateException("Bài thi này đã được nộp.");
        }

        if (request.getCheatWarningCount() != null) {
            result.setCheatWarningCount(request.getCheatWarningCount());
        }
        if (request.getCheatDetails() != null) {
            result.setCheatDetails(request.getCheatDetails());
        }

        // Lấy đáp án từ request hoặc draft nếu có
        Map<String, String> finalAnswers = request.getAnswers() != null ? request.getAnswers() : new HashMap<>();
        if (finalAnswers.isEmpty()) {
            List<DraftAnswer> drafts = draftAnswerRepository.findByResult(result);
            drafts.forEach(d -> {
                if (d.getQuestion() != null) {
                    if (d.getSelectedOption() != null) {
                        finalAnswers.put(d.getQuestion().getId().toString(), d.getSelectedOption().getId().toString());
                    } else if (d.getTextResponse() != null) {
                        finalAnswers.put(d.getQuestion().getId().toString(), d.getTextResponse());
                    }
                }
            });
        }

        double totalScore = 0.0;
        ExamSnapshotDto snapshot = result.getExamSnapshot();
        if (snapshot == null) {
            // Fallback for old exams before snapshot feature
            snapshot = createSnapshot(exam);
        }
        List<ExamSnapshotDto.SnapshotQuestionDto> snapshotQuestions = snapshot.getQuestions();

        for (ExamSnapshotDto.SnapshotQuestionDto question : snapshotQuestions) {
            String selectedOptIdStr = finalAnswers.get(question.getQuestionId().toString());
            
            StudentAnswer answer = StudentAnswer.builder()
                    .result(result)
                    // We must lookup the real question entity to link, even if it's updated.
                    // If it was deleted, linking might fail, so we find it optionally.
                    .question(examRepository.findById(examId).get().getQuestions().stream()
                            .filter(q -> q.getId().equals(question.getQuestionId())).findFirst().orElse(null))
                    .build();

            if (question.getQuestionType() != null && question.getQuestionType().equals("ESSAY")) {
                answer.setTextResponse(selectedOptIdStr);
                ExamAIService.EssayGradeResult gradeResult = examAIService.gradeEssay(
                        question.getContent(), selectedOptIdStr, question.getPoints(), exam.getSubject(), student.getId());
                // Điểm AI chỉ là bản nháp — chưa "reviewed" cho tới khi giáo viên duyệt (xem reviewEssayAnswer)
                answer.setAiSuggestedScore(gradeResult.score);
                answer.setPointsEarned(gradeResult.score);
                answer.setAiFeedback(examAIService.serializeFeedback(gradeResult));
                answer.setIsCorrect(gradeResult.score >= (question.getPoints() / 2));
                answer.setReviewed(false);
                totalScore += gradeResult.score;
            } else if ("TRUE_FALSE".equals(question.getQuestionType()) && selectedOptIdStr != null && selectedOptIdStr.trim().startsWith("{")) {
                // TRUE_FALSE multi-statement: answer is JSON {"optId": true/false, ...}
                answer.setTextResponse(selectedOptIdStr);
                try {
                    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                    @SuppressWarnings("unchecked")
                    Map<String, Boolean> statementAnswers = mapper.readValue(selectedOptIdStr, Map.class);
                    List<ExamSnapshotDto.SnapshotOptionDto> opts = question.getOptions();
                    int totalStatements = opts != null ? opts.size() : 0;
                    int wrongCount = 0;
                    for (ExamSnapshotDto.SnapshotOptionDto opt : (opts != null ? opts : new ArrayList<ExamSnapshotDto.SnapshotOptionDto>())) {
                        Boolean studentAnswer = statementAnswers.get(opt.getOptionId().toString());
                        boolean correctAnswer = Boolean.TRUE.equals(opt.getIsCorrect());
                        if (studentAnswer == null || studentAnswer != correctAnswer) wrongCount++;
                    }
                    double ratio = computeTrueFalseRatio(question.getScoringConfig(), wrongCount, totalStatements);
                    double earned = question.getPoints() * ratio;
                    answer.setIsCorrect(wrongCount == 0);
                    answer.setPointsEarned(earned);
                    totalScore += earned;
                } catch (Exception e) {
                    answer.setIsCorrect(false);
                    answer.setPointsEarned(0.0);
                }
            } else if ("SHORT_ANSWER".equals(question.getQuestionType()) || "FILL_BLANK".equals(question.getQuestionType())) {
                answer.setTextResponse(selectedOptIdStr);
                if (selectedOptIdStr != null && !selectedOptIdStr.trim().isEmpty()) {
                    String studentText = normalizeShortAnswer(selectedOptIdStr);
                    boolean correct = false;
                    
                    List<ExamSnapshotDto.SnapshotOptionDto> options = question.getOptions();
                    if (options != null) {
                        for (ExamSnapshotDto.SnapshotOptionDto opt : options) {
                            if (Boolean.TRUE.equals(opt.getIsCorrect()) && opt.getContent() != null) {
                                String correctText = normalizeShortAnswer(opt.getContent());
                                if (studentText.equals(correctText)) {
                                    correct = true;
                                    break;
                                }
                            }
                        }
                    }
                    
                    if (correct) {
                        answer.setIsCorrect(true);
                        answer.setPointsEarned(question.getPoints());
                        totalScore += question.getPoints();
                    } else {
                        answer.setIsCorrect(false);
                        answer.setPointsEarned(0.0);
                    }
                } else {
                    answer.setIsCorrect(false);
                    answer.setPointsEarned(0.0);
                }
            } else {
                if (selectedOptIdStr != null && !selectedOptIdStr.isEmpty()) {
                    answer.setTextResponse(selectedOptIdStr);
                    try {
                        UUID selectedOptionId = UUID.fromString(selectedOptIdStr);
                        ExamSnapshotDto.SnapshotOptionDto selectedOption = question.getOptions().stream()
                                .filter(o -> o.getOptionId().equals(selectedOptionId))
                                .findFirst().orElse(null);
                        
                        if (selectedOption != null) {
                            answer.setSelectedOption(optionRepository.findById(selectedOptionId).orElse(null));
                            if (Boolean.TRUE.equals(selectedOption.getIsCorrect())) {
                                answer.setIsCorrect(true);
                                answer.setPointsEarned(question.getPoints());
                                totalScore += question.getPoints();
                            } else {
                                answer.setIsCorrect(false);
                                answer.setPointsEarned(0.0);
                            }
                        } else {
                            answer.setIsCorrect(false);
                            answer.setPointsEarned(0.0);
                        }
                    } catch (IllegalArgumentException e) {
                        answer.setIsCorrect(false);
                        answer.setPointsEarned(0.0);
                    }
                } else {
                    answer.setIsCorrect(false);
                    answer.setPointsEarned(0.0);
                }
            }
            result.getAnswers().add(answer);
        }

        result.setSubmittedAt(LocalDateTime.now());
        result.setTotalScore(totalScore);
        double maxScore = snapshot.getMaxScore() != null ? snapshot.getMaxScore() : snapshotQuestions.stream().mapToDouble(ExamSnapshotDto.SnapshotQuestionDto::getPoints).sum();
        double percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
        result.setIsPassed(percentage >= exam.getPassingScore());

        // Xóa draft
        draftAnswerRepository.deleteAllByResult(result);

        StudentExamResult saved = resultRepository.save(result);
        mistakeVaultService.syncFromExamResult(saved);
        gamificationService.recordActivity(student, "EXAM_COMPLETE");

        boolean pendingReview = hasPendingEssay(saved);
        String targetEmail = (request.getNotifyEmail() != null && !request.getNotifyEmail().isBlank())
                ? request.getNotifyEmail() : student.getEmail();

        if (pendingReview) {
            // Còn câu tự luận AI chấm nháp chưa được giáo viên duyệt — KHÔNG lộ điểm cho học sinh lúc này.
            notificationService.sendNotification(
                    student,
                    "Đã nộp bài thi: " + exam.getTitle(),
                    "Bạn đã nộp bài thi thành công. Giáo viên đang chấm bài, kết quả sẽ có sau khi được duyệt.",
                    "/exams/" + exam.getId() + "/results/" + saved.getId(),
                    com.uranus.lms.modules.notification.NotificationType.EXAM,
                    null,
                    "EXAM_SUBMISSION",
                    saved.getId().toString()
            );
        } else {
            try {
                sendResultEmail(targetEmail, student.getFullName(), exam.getTitle(), totalScore, maxScore, percentage, saved.getIsPassed());
            } catch (Exception e) {
                log.warn("Could not send result email to {}: {}", targetEmail, e.getMessage());
            }

            String scoreFormatted = String.format("%.1f", totalScore);
            String maxScoreFormatted = String.format("%.1f", maxScore);
            notificationService.sendNotification(
                    student,
                    "Đã nộp bài thi: " + exam.getTitle(),
                    "Bạn đã nộp bài thi thành công. Điểm số: " + scoreFormatted + "/" + maxScoreFormatted + " (" + (saved.getIsPassed() ? "Đạt" : "Chưa đạt") + ").",
                    "/exams/" + exam.getId() + "/results/" + saved.getId(),
                    com.uranus.lms.modules.notification.NotificationType.EXAM,
                    null,
                    "EXAM_SUBMISSION",
                    saved.getId().toString()
            );
        }

        // Notify Exam Creator / Teacher — giáo viên luôn được biết kết quả (kể cả khi chờ duyệt) để vào duyệt
        if (exam.getTeacher() != null && !exam.getTeacher().getId().equals(student.getId())) {
            String teacherMsg = pendingReview
                    ? student.getFullName() + " đã nộp bài thi '" + exam.getTitle() + "' — có câu tự luận cần bạn duyệt điểm."
                    : student.getFullName() + " đã hoàn thành bài thi '" + exam.getTitle() + "' với kết quả "
                        + String.format("%.1f", totalScore) + "/" + String.format("%.1f", maxScore);
            notificationService.sendNotification(
                    exam.getTeacher(),
                    "Học sinh đã nộp bài thi",
                    teacherMsg,
                    "/exams/" + exam.getId() + "/results/" + saved.getId(),
                    com.uranus.lms.modules.notification.NotificationType.EXAM,
                    student,
                    "EXAM_SUBMISSION",
                    saved.getId().toString()
            );
        }

        return saved;
    }

    // --- Lịch sử và Kết quả ---

    public Page<ExamHistoryResponse> getStudentHistory(User student, String search, Boolean isPassed, java.time.LocalDateTime fromDate, java.time.LocalDateTime toDate, Pageable pageable) {
        return resultRepository.findStudentHistoryWithFilters(student, search, isPassed, fromDate, toDate, pageable)
                .map(this::toHistoryResponse);
    }

    public ExamResultDetailResponse getResultDetail(UUID resultId, User user) {
        StudentExamResult result = resultRepository.findById(resultId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kết quả"));

        // Security check
        if (!result.getStudent().getId().equals(user.getId()) && !examAccessControlService.hasEditPermission(result.getExam(), user)) {
            throw new BadRequestException("Bạn không có quyền xem kết quả này");
        }

        Exam exam = result.getExam();
        ExamSnapshotDto snapshot = result.getExamSnapshot();
        if (snapshot == null) {
            snapshot = createSnapshot(exam);
        }
        double maxScore = snapshot.getMaxScore() != null ? snapshot.getMaxScore() : snapshot.getQuestions().stream().mapToDouble(ExamSnapshotDto.SnapshotQuestionDto::getPoints).sum();
        long timeTaken = secondsBetween(result.getStartedAt(), result.getSubmittedAt());

        boolean isOwner = user != null && user.getId().equals(result.getStudent().getId());
        boolean hasStaffPrivilege = examAccessControlService.hasEditPermission(exam, user)
                || (user != null && (user.getRole() == com.uranus.lms.modules.user.Role.ADMIN
                || user.getRole() == com.uranus.lms.modules.user.Role.TEACHER
                || user.getRole() == com.uranus.lms.modules.user.Role.TEACHING_ASSISTANT));
        boolean isTeacherOrTa = (user != null && user.getId().equals(exam.getTeacher().getId())) || hasStaffPrivilege;

        // Chỉ học sinh bình thường (không có quyền giáo viên/quản trị) mới bị đánh dấu pending khi còn câu tự luận AI chấm nháp chưa được giáo viên duyệt
        boolean pendingTeacherReview = isOwner && !hasStaffPrivilege && hasPendingEssay(result);

        ExamResultDetailResponse.ExamResultDetailResponseBuilder builder = ExamResultDetailResponse.builder()
                .resultId(result.getId())
                .examId(exam.getId())
                .examTitle(exam.getTitle())
                .examCode(exam.getExamCode())
                .totalScore(result.getTotalScore())
                .maxScore(maxScore)
                .scorePercentage(maxScore > 0 ? ((result.getTotalScore() != null ? result.getTotalScore() : 0.0) / maxScore) * 100 : 0)
                .isPassed(result.getIsPassed())
                .startedAt(result.getStartedAt())
                .submittedAt(result.getSubmittedAt())
                .timeTakenSeconds(timeTaken)
                .correctCount((int) result.getAnswers().stream().filter(a -> Boolean.TRUE.equals(a.getIsCorrect())).count())
                .totalCount(exam.getQuestions().size())
                .cheatWarningCount(result.getCheatWarningCount())
                .cheatDetails(result.getCheatDetails())
                .pendingTeacherReview(pendingTeacherReview);

        // Review policy
        boolean canReview = false;
        String reviewMessage = null;

        if (isTeacherOrTa) {
            canReview = true; // Teacher / TA always can see other's submissions
        } else if ("IMMEDIATELY".equals(exam.getReviewPolicy())) {
            canReview = true;
        } else if ("NEVER".equals(exam.getReviewPolicy())) {
            reviewMessage = "Giáo viên không cho phép xem lại chi tiết bài thi.";
        } else if ("AFTER_ALL_SUBMITTED".equals(exam.getReviewPolicy())) {
            // Đơn giản hóa: nếu quá endTime thì cho xem
            if (exam.getEndTime() != null && LocalDateTime.now().isAfter(exam.getEndTime())) {
                canReview = true;
            } else {
                reviewMessage = "Chỉ có thể xem kết quả chi tiết sau khi thời gian thi kết thúc.";
            }
        }

        // Nếu bài làm có câu tự luận đang chờ duyệt điểm, luôn mở quyền cho học sinh xem lại bài viết và phân tích lỗi
        if (!canReview && pendingTeacherReview) {
            canReview = true;
        }

        if (canReview) {
            List<ExamResultDetailResponse.QuestionResultDto> qResultDtos = snapshot.getQuestions().stream().map(q -> {
                StudentAnswer ans = result.getAnswers().stream()
                        .filter(a -> a.getQuestion() != null && a.getQuestion().getId().equals(q.getQuestionId()))
                        .findFirst().orElse(null);

                List<ExamResultDetailResponse.OptionResultDto> oResultDtos = q.getOptions().stream().map(o ->
                        ExamResultDetailResponse.OptionResultDto.builder()
                                .id(o.getOptionId())
                                .content(o.getContent())
                                .isCorrect(o.getIsCorrect())
                                .isSelected(ans != null && ans.getSelectedOption() != null && ans.getSelectedOption().getId().equals(o.getOptionId()))
                                .build()
                ).collect(Collectors.toList());

                boolean isEssay = "ESSAY".equals(q.getQuestionType());
                boolean isEssayPending = isEssay && !Boolean.TRUE.equals(ans != null ? ans.getReviewed() : false);

                String essayStatus = null;
                if (isEssay) {
                    if (ans == null || ans.getTextResponse() == null || ans.getTextResponse().trim().isEmpty()) {
                        essayStatus = "NOT_SUBMITTED";
                    } else if (Boolean.TRUE.equals(ans.getReviewed())) {
                        essayStatus = "TEACHER_REVIEWED";
                    } else if (ans.getAiFeedback() != null && (
                            ans.getAiFeedback().contains("quá tải") ||
                            ans.getAiFeedback().contains("lỗi xảy ra") ||
                            ans.getAiFeedback().contains("Không thể chấm") ||
                            ans.getAiFeedback().contains("chấm tay sau") ||
                            ans.getAiFeedback().contains("Chưa cấu hình AI")
                    )) {
                        essayStatus = "AI_FAILED";
                    } else if (ans.getAiSuggestedScore() != null) {
                        essayStatus = "AI_SCORED";
                    } else {
                        essayStatus = "PENDING_AI";
                    }
                }

                // Với học sinh khi câu tự luận chưa duyệt: ẩn điểm số chính thức và nhận xét AI (chờ giáo viên duyệt và gửi mới hiển thị)
                Double pointsEarned = (pendingTeacherReview && isEssayPending) ? null : (ans != null ? ans.getPointsEarned() : 0.0);
                Boolean isCorrect = (pendingTeacherReview && isEssayPending) ? null : (ans != null ? ans.getIsCorrect() : false);
                String aiFeedback = (pendingTeacherReview && isEssayPending) ? null : (ans != null ? ans.getAiFeedback() : null);

                return ExamResultDetailResponse.QuestionResultDto.builder()
                        .questionId(q.getQuestionId())
                        .answerId(ans != null ? ans.getId() : null)
                        .reviewed(ans != null ? ans.getReviewed() : null)
                        .essayStatus(essayStatus)
                        .questionContent(q.getContent())
                        .explanation(q.getExplanation())
                        .questionType(q.getQuestionType())
                        .sheetAnswerType(q.getSheetAnswerType())
                        .orderIndex(q.getOrderIndex())
                        .points(q.getPoints())
                        .pointsEarned(pointsEarned)
                        .isCorrect(isCorrect)
                        .textResponse(ans != null ? ans.getTextResponse() : null)
                        .aiFeedback(aiFeedback)
                        .options(oResultDtos)
                        .build();
            }).collect(Collectors.toList());

            builder.questions(qResultDtos);
        }

        if (pendingTeacherReview) {
            builder.reviewMessage("Bài làm có câu tự luận đang chờ giáo viên chấm & duyệt điểm. Bạn có thể xem lại bài viết bên dưới. Nhận xét chi tiết sẽ hiển thị sau khi giáo viên duyệt.");
        } else if (!canReview) {
            builder.reviewMessage(reviewMessage);
        }

        return builder.build();
    }

    /** true nếu bài còn câu tự luận đã được AI chấm nháp nhưng giáo viên chưa duyệt. */
    private boolean hasPendingEssay(StudentExamResult result) {
        return result.getAnswers().stream()
                .anyMatch(a -> a.getQuestion() != null && "ESSAY".equals(a.getQuestion().getQuestionType()) && !Boolean.TRUE.equals(a.getReviewed()));
    }

    private double computeTrueFalseRatio(String scoringConfig, int wrongCount, int totalStatements) {
        if (wrongCount == 0) return 1.0;
        
        // Define default fallback MOET partial scoring rule
        double fallbackRatio = 0.0;
        if (wrongCount == 1) fallbackRatio = 0.5;
        else if (wrongCount == 2) fallbackRatio = 0.25;
        else if (wrongCount == 3) fallbackRatio = 0.1;

        if (scoringConfig == null || scoringConfig.isBlank() || "null".equals(scoringConfig)) {
            return fallbackRatio;
        }
        
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(scoringConfig);
            if (root.isTextual()) {
                root = mapper.readTree(root.asText());
            }
            String type = root.path("type").asText("ALL_OR_NOTHING");
            if ("ALL_OR_NOTHING".equals(type)) return 0.0;
            // PARTIAL: find threshold matching wrongCount
            com.fasterxml.jackson.databind.JsonNode thresholds = root.path("thresholds");
            if (thresholds.isArray()) {
                // Sort by wrongCount desc to find best matching threshold
                double ratio = 0.0;
                int bestMatch = Integer.MAX_VALUE;
                for (com.fasterxml.jackson.databind.JsonNode t : thresholds) {
                    int wc = t.path("wrongCount").asInt();
                    if (wc == wrongCount) {
                        return t.path("ratio").asDouble(0.0);
                    }
                    if (wc < wrongCount && (wrongCount - wc) < bestMatch) {
                        bestMatch = wrongCount - wc;
                        ratio = t.path("ratio").asDouble(0.0);
                    }
                }
                return ratio;
            }
        } catch (Exception ignored) {}
        
        return fallbackRatio; // Fallback to partial if parsing fails or invalid format
    }

    private String generateUniqueExamCode() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        Random rnd = new Random();
        while (true) {
            StringBuilder sb = new StringBuilder(6);
            for (int i = 0; i < 6; i++) sb.append(chars.charAt(rnd.nextInt(chars.length())));
            String code = sb.toString();
            if (!examRepository.existsByExamCode(code)) return code;
        }
    }

    private ExamSnapshotDto createSnapshot(Exam exam) {
        // Load question groups từ DB
        List<QuestionGroup> dbGroups = questionGroupRepository.findByExamIdOrderByOrderIndexAsc(exam.getId());
        List<ExamSnapshotDto.SnapshotGroupDto> groupDtos = dbGroups.stream()
                .map(g -> ExamSnapshotDto.SnapshotGroupDto.builder()
                        .groupId(g.getId())
                        .groupTitle(g.getGroupTitle())
                        .passageText(g.getPassageText())
                        .audioUrl(g.getAudioUrl())
                        .orderIndex(g.getOrderIndex())
                        .build())
                .collect(Collectors.toList());

        return ExamSnapshotDto.builder()
                .examId(exam.getId())
                .examTitle(exam.getTitle())
                .examCode(exam.getExamCode())
                .durationMinutes(exam.getDurationMinutes())
                .passingScore(exam.getPassingScore())
                .maxScore(exam.getQuestions() != null ? exam.getQuestions().stream().mapToDouble(Question::getPoints).sum() : 0.0)
                .examType(exam.getExamType())
                .pdfUrl(exam.getPdfUrl())
                .audioUrl(exam.getAudioUrl())
                .audioTracks(exam.getAudioTracks())
                .groups(groupDtos)
                .questions(exam.getQuestions() != null ? exam.getQuestions().stream().map(q -> ExamSnapshotDto.SnapshotQuestionDto.builder()
                        .questionId(q.getId())
                        .content(q.getContent())
                        .imageUrl(q.getImageUrl())
                        .questionType(q.getQuestionType())
                        .skillTag(q.getSkillTag())
                        .points(q.getPoints())
                        .orderIndex(q.getOrderIndex())
                        .explanation(q.getExplanation())
                        .sheetAnswerType(q.getSheetAnswerType())
                        .groupId(q.getGroupId())
                        .scoringConfig(q.getScoringConfig())
                        .options(q.getOptions() != null ? q.getOptions().stream().map(o -> ExamSnapshotDto.SnapshotOptionDto.builder()
                                .optionId(o.getId())
                                .content(o.getContent())
                                .isCorrect(o.getIsCorrect())
                                .build()).collect(Collectors.toList()) : new ArrayList<>())
                        .build()).collect(Collectors.toList()) : new ArrayList<>())
                .build();
    }

    // Snapshot day du (isCorrect, explanation) chi danh cho luc CHAM DIEM /
    // XEM LAI sau khi nop bai. startExam tra thang snapshot nay cho hoc sinh
    // dang lam bai - phai an ca giai thich lan isCorrect di, neu khong hoc
    // sinh doc duoc dap an dung ngay tu luc chua nop bai qua response cua API
    // (vd mo DevTools xem network trong luc lam bai).
    private ExamSnapshotDto hideExplanationForOngoing(ExamSnapshotDto snapshot) {
        if (snapshot == null || snapshot.getQuestions() == null) return snapshot;
        List<ExamSnapshotDto.SnapshotQuestionDto> sanitized = snapshot.getQuestions().stream()
                .map(q -> {
                    List<ExamSnapshotDto.SnapshotOptionDto> sanitizedOptions = q.getOptions() == null
                            ? null
                            : q.getOptions().stream()
                                .map(o -> o.toBuilder().isCorrect(null).build())
                                .collect(Collectors.toList());
                    return q.toBuilder().explanation(null).options(sanitizedOptions).build();
                })
                .collect(Collectors.toList());
        return snapshot.toBuilder().questions(sanitized).build();
    }

    // ─── Favorite Exam ──────────────────────────────────────
    public boolean toggleFavorite(UUID examId, User user) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đề thi"));

        var existing = favoriteExamRepository.findByUserAndExam(user, exam);
        if (existing.isPresent()) {
            favoriteExamRepository.delete(existing.get());
            return false;
        } else {
            favoriteExamRepository.save(UserFavoriteExam.builder()
                    .user(user)
                    .exam(exam)
                    .build());
            return true;
        }
    }

    public boolean isFavorited(UUID examId, User user) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đề thi"));
        return favoriteExamRepository.existsByUserAndExam(user, exam);
    }

    public Page<ExamResponse> getFavoriteExams(User user, Pageable pageable, String search, String subject, String grade) {
        return favoriteExamRepository.findFavoriteExamsByUser(user, search, subject, grade, pageable)
                .map(e -> toResponse(e, true, user));
    }

    private ExamResponse toResponse(Exam exam, boolean forStudent, User user) {
        return toResponse(exam, forStudent, user, !forStudent);
    }

    private ExamResponse toResponse(Exam exam, boolean forStudent, User user, boolean revealAnswers) {
        boolean canSeeQuestions = true;
        if (forStudent) {
            LocalDateTime now = LocalDateTime.now();
            if (exam.getStartTime() != null && now.isBefore(exam.getStartTime())) {
                canSeeQuestions = false;
            }
        }
        
        List<ExamResponse.QuestionResponse> questionResponses = (!canSeeQuestions || exam.getQuestions() == null) ? List.of() :
                exam.getQuestions().stream().map(q -> ExamResponse.QuestionResponse.builder()
                        .id(q.getId())
                        .content(q.getContent())
                        .imageUrl(q.getImageUrl())
                        .questionType(q.getQuestionType())
                        .skillTag(q.getSkillTag())
                        .orderIndex(q.getOrderIndex())
                        .points(q.getPoints())
                        .explanation(revealAnswers ? q.getExplanation() : null)
                        .groupId(q.getGroupId())
                        .sheetAnswerType(q.getSheetAnswerType())
                        .options(q.getOptions() == null ? List.of() : q.getOptions().stream()
                                .map(o -> ExamResponse.OptionResponse.builder()
                                        .id(o.getId())
                                        .content(o.getContent())
                                        .isCorrect(revealAnswers ? o.getIsCorrect() : null)
                                        .build())
                                .collect(Collectors.toList()))
                        .build()).collect(Collectors.toList());

        List<ExamResponse.QuestionGroupResponse> groupResponses = null;
        if (canSeeQuestions) {
            List<QuestionGroup> dbGroups = questionGroupRepository.findByExamIdOrderByOrderIndexAsc(exam.getId());
            groupResponses = dbGroups.stream().map(g -> ExamResponse.QuestionGroupResponse.builder()
                    .id(g.getId())
                    .groupTitle(g.getGroupTitle())
                    .passageText(g.getPassageText())
                    .audioUrl(g.getAudioUrl())
                    .orderIndex(g.getOrderIndex())
                    .build()).collect(Collectors.toList());
        }

        Long userAttemptCount = null;
        UUID latestResultId = null;
        if (forStudent && user != null) {
            userAttemptCount = resultRepository.countByStudentAndExamAndSubmittedAtIsNotNull(user, exam);
            Optional<StudentExamResult> latest = resultRepository.findFirstByStudentAndExamAndSubmittedAtIsNotNullOrderBySubmittedAtDesc(user, exam);
            if (latest.isPresent()) {
                latestResultId = latest.get().getId();
            }
        }

        return ExamResponse.builder()
                .id(exam.getId())
                .title(exam.getTitle())
                .description(exam.getDescription())
                .subject(exam.getSubject())
                .grade(exam.getGrade())
                .durationMinutes(exam.getDurationMinutes())
                .passingScore(exam.getPassingScore())
                .isPublished(exam.getIsPublished())
                .visibility(exam.getVisibility() != null ? exam.getVisibility().name() : null)
                .shuffleQuestions(exam.getShuffleQuestions())
                .questionCount(exam.getQuestions() == null ? 0 : exam.getQuestions().size())
                .teacherName(exam.getTeacher() != null ? exam.getTeacher().getFullName() : null)
                .teacherAvatar(exam.getTeacher() != null ? exam.getTeacher().getAvatarUrl() : null)
                .teacherId(exam.getTeacher() != null ? exam.getTeacher().getId() : null)
                .createdAt(exam.getCreatedAt())
                .startTime(exam.getStartTime())
                .endTime(exam.getEndTime())
                .reviewPolicy(exam.getReviewPolicy())
                .maxAttempts(exam.getMaxAttempts())
                .userAttemptCount(userAttemptCount)
                .latestResultId(latestResultId)
                .examCode(exam.getExamCode())
                .folderId(exam.getFolder() != null ? exam.getFolder().getId() : null)
                .folderName(exam.getFolder() != null ? exam.getFolder().getName() : null)
                .isFavorited(user != null ? favoriteExamRepository.existsByUserAndExam(user, exam) : null)
                .examType(exam.getExamType())
                .pdfUrl(exam.getPdfUrl())
                .audioUrl(exam.getAudioUrl())
                .audioTracks(exam.getAudioTracks())
                .hasPassword(exam.getAccessCode() != null && !exam.getAccessCode().isEmpty())
                .accessCode(!forStudent ? exam.getAccessCode() : null)
                .questions(questionResponses)
                .questionGroups(groupResponses)
                .build();
    }

    private void applyAccess(ExamResponse response, com.uranus.lms.modules.access.ResourceAccessDecision decision) {
        if (decision == null) {
            decision = com.uranus.lms.modules.access.ResourceAccessDecision.previewLocked();
        }
        response.setAccessLevel(decision.getAccessLevel().name());
        response.setLocked(decision.isLocked());
        response.setPreviewRank(decision.getPreviewRank());
        response.setUnlockHint(decision.getUnlockHint());
        if (decision.isLocked()) {
            response.setQuestions(List.of());
            response.setQuestionGroups(null);
        }
    }

    private ContentFolder resolveFolder(UUID folderId, User owner) {
        if (folderId == null) return null;
        return folderService.getFolderById(folderId, owner);
    }

    /**
     * Duration.between nem NullPointerException("temporal") neu mot dau la null.
     * Bai dang lam do chua co submittedAt, va truoc day chi mot ban ghi nhu vay
     * la lam 500 ca trang lich su.
     */
    private long secondsBetween(java.time.LocalDateTime from, java.time.LocalDateTime to) {
        if (from == null || to == null) return 0;
        return Duration.between(from, to).getSeconds();
    }

    private ExamHistoryResponse toHistoryResponse(StudentExamResult r) {
        Exam exam = r.getExam();
        double maxScore = exam.getQuestions().stream()
                .filter(java.util.Objects::nonNull)
                .mapToDouble(q -> q.getPoints() != null ? q.getPoints() : 0.0)
                .sum();
        long timeTaken = secondsBetween(r.getStartedAt(), r.getSubmittedAt());
        boolean pendingReview = hasPendingEssay(r);

        ExamHistoryResponse.ExamHistoryResponseBuilder builder = ExamHistoryResponse.builder()
                .resultId(r.getId())
                .examId(exam.getId())
                .examTitle(exam.getTitle())
                .examCode(exam.getExamCode())
                .teacherName(exam.getTeacher() != null ? exam.getTeacher().getFullName() : null)
                .startedAt(r.getStartedAt())
                .submittedAt(r.getSubmittedAt())
                .timeTakenSeconds(timeTaken)
                .attemptNumber(1)
                .totalAttempts(exam.getMaxAttempts())
                .cheatWarningCount(r.getCheatWarningCount())
                .pendingTeacherReview(pendingReview);

        if (pendingReview) {
            builder.reviewMessage("Giáo viên đang chấm bài, kết quả sẽ có sau khi được duyệt.");
        } else {
            builder.totalScore(r.getTotalScore())
                   .maxScore(maxScore)
                   .scorePercentage(maxScore > 0 ? ((r.getTotalScore() != null ? r.getTotalScore() : 0.0) / maxScore) * 100 : 0)
                   .isPassed(r.getIsPassed());
        }

        return builder.build();
    }

    // ── Analytics ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ExamAnalyticsResponse getExamAnalytics(UUID examId, User teacher) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đề thi"));
        if (!examAccessControlService.hasEditPermission(exam, teacher)) {
            throw new BadRequestException("Bạn không có quyền xem báo cáo đề thi này.");
        }

        List<StudentExamResult> results = resultRepository.findByExamAndSubmittedAtIsNotNull(exam);
        double maxPossible = exam.getQuestions().stream().mapToDouble(Question::getPoints).sum();

        int total = results.size();
        int passCount = (int) results.stream().filter(r -> Boolean.TRUE.equals(r.getIsPassed())).count();
        double avgScore = results.stream().mapToDouble(r -> r.getTotalScore() != null ? r.getTotalScore() : 0).average().orElse(0);
        double maxScore = results.stream().mapToDouble(r -> r.getTotalScore() != null ? r.getTotalScore() : 0).max().orElse(0);
        double minScore = results.stream().mapToDouble(r -> r.getTotalScore() != null ? r.getTotalScore() : 0).min().orElse(0);
        double avgPct = maxPossible > 0 ? (avgScore / maxPossible) * 100 : 0;

        // Score distribution buckets (10% each)
        int[] buckets = new int[10];
        for (StudentExamResult r : results) {
            if (r.getTotalScore() == null) continue;
            double pct = maxPossible > 0 ? (r.getTotalScore() / maxPossible) * 100 : 0;
            int idx = Math.min((int)(pct / 10), 9);
            buckets[idx]++;
        }
        List<ExamAnalyticsResponse.ScoreBucket> distribution = new java.util.ArrayList<>();
        String[] labels = {"0-10%","10-20%","20-30%","30-40%","40-50%","50-60%","60-70%","70-80%","80-90%","90-100%"};
        for (int i = 0; i < 10; i++) {
            distribution.add(ExamAnalyticsResponse.ScoreBucket.builder()
                    .label(labels[i]).count(buckets[i])
                    .percentage(total > 0 ? (buckets[i] * 100.0 / total) : 0)
                    .build());
        }

        // Per-question analytics
        Map<String, String> skillLabels = Map.of(
                "GENERAL", "Chung", "GRAMMAR", "Ngữ pháp", "VOCABULARY", "Từ vựng",
                "READING", "Đọc hiểu", "LISTENING", "Nghe", "WRITING", "Viết"
        );

        List<ExamAnalyticsResponse.QuestionAnalytics> qAnalytics = exam.getQuestions().stream().map(q -> {
            List<StudentAnswer> answersForQ = results.stream()
                    .flatMap(r -> {
                        List<StudentAnswer> answers = r.getAnswers();
                        if (answers == null) return java.util.stream.Stream.empty();
                        return answers.stream().filter(a ->
                            (a.getQuestion() != null && a.getQuestion().getId().equals(q.getId()))
                            || (a.getQuestion() == null && answers.indexOf(a) == q.getOrderIndex())
                        );
                    })
                    .collect(Collectors.toList());
            int correctCount = (int) answersForQ.stream().filter(a -> Boolean.TRUE.equals(a.getIsCorrect())).count();
            int answered = answersForQ.size();

            List<ExamAnalyticsResponse.OptionStats> optStats = q.getOptions().stream().map(o -> {
                int selectedCount = (int) answersForQ.stream()
                        .filter(a -> a.getSelectedOption() != null && a.getSelectedOption().getId().equals(o.getId()))
                        .count();
                return ExamAnalyticsResponse.OptionStats.builder()
                        .optionId(o.getId())
                        .content(o.getContent().replaceAll("<[^>]+>", ""))
                        .isCorrect(Boolean.TRUE.equals(o.getIsCorrect()))
                        .selectedCount(selectedCount)
                        .selectedRate(answered > 0 ? (selectedCount * 100.0 / answered) : 0)
                        .build();
            }).collect(Collectors.toList());

            return ExamAnalyticsResponse.QuestionAnalytics.builder()
                    .questionId(q.getId())
                    .orderIndex(q.getOrderIndex())
                    .questionContent(q.getContent().replaceAll("<[^>]+>", ""))
                    .skillTag(q.getSkillTag())
                    .points(q.getPoints())
                    .correctCount(correctCount)
                    .totalAnswered(answered)
                    .correctRate(answered > 0 ? (correctCount * 100.0 / answered) : 0)
                    .optionStats(optStats)
                    .build();
        }).collect(Collectors.toList());

        // Skill analytics
        Map<String, List<ExamAnalyticsResponse.QuestionAnalytics>> bySkill = qAnalytics.stream()
                .collect(Collectors.groupingBy(qa -> qa.getSkillTag() != null ? qa.getSkillTag() : "GENERAL"));
        List<ExamAnalyticsResponse.SkillAnalytics> skillAnalytics = bySkill.entrySet().stream()
                .map(e -> ExamAnalyticsResponse.SkillAnalytics.builder()
                        .skillTag(e.getKey())
                        .skillLabel(skillLabels.getOrDefault(e.getKey(), e.getKey()))
                        .totalQuestions(e.getValue().size())
                        .averageCorrectRate(e.getValue().stream().mapToDouble(ExamAnalyticsResponse.QuestionAnalytics::getCorrectRate).average().orElse(0))
                        .build())
                .collect(Collectors.toList());

        // Student score table
        Map<UUID, Integer> attemptCounters = new HashMap<>();
        List<ExamAnalyticsResponse.StudentScoreRow> rows = results.stream()
                .sorted(Comparator.comparing(r -> r.getStartedAt() != null ? r.getStartedAt() : LocalDateTime.MIN))
                .map(r -> {
            int attemptNum = attemptCounters.getOrDefault(r.getStudent().getId(), 0) + 1;
            attemptCounters.put(r.getStudent().getId(), attemptNum);

            double rMax = maxPossible;
            long timeTaken = r.getStartedAt() != null && r.getSubmittedAt() != null
                    ? java.time.Duration.between(r.getStartedAt(), r.getSubmittedAt()).getSeconds() : 0;
            return ExamAnalyticsResponse.StudentScoreRow.builder()
                    .resultId(r.getId())
                    .studentId(r.getStudent().getId())
                    .studentName(r.getStudent().getFullName())
                    .studentEmail(r.getStudent().getEmail())
                    .totalScore(r.getTotalScore() != null ? r.getTotalScore() : 0)
                    .maxScore(rMax)
                    .scorePercentage(rMax > 0 ? ((r.getTotalScore() != null ? r.getTotalScore() : 0) / rMax) * 100 : 0)
                    .isPassed(Boolean.TRUE.equals(r.getIsPassed()))
                    .timeTakenSeconds(timeTaken)
                    .cheatWarningCount(r.getCheatWarningCount() != null ? r.getCheatWarningCount() : 0)
                    .cheatDetails(r.getCheatDetails())
                    .submittedAt(r.getSubmittedAt() != null ? r.getSubmittedAt().toString() : null)
                    .attemptNumber(attemptNum)
                    .build();
        }).collect(Collectors.toList());

        return ExamAnalyticsResponse.builder()
                .examId(exam.getId())
                .examTitle(exam.getTitle())
                .examCode(exam.getExamCode())
                .totalSubmissions(total)
                .averageScore(Math.round(avgScore * 100.0) / 100.0)
                .averagePercentage(Math.round(avgPct * 100.0) / 100.0)
                .maxScore(maxScore)
                .minScore(minScore)
                .passCount(passCount)
                .failCount(total - passCount)
                .passRate(total > 0 ? (passCount * 100.0 / total) : 0)
                .maxPossibleScore(maxPossible)
                .scoreDistribution(distribution)
                .questionAnalytics(qAnalytics)
                .skillAnalytics(skillAnalytics)
                .studentScores(rows)
                .build();
    }

    @Transactional
    public void deleteExamResult(UUID examId, UUID resultId, User teacher) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đề thi"));
        if (!examAccessControlService.hasEditPermission(exam, teacher)) {
            throw new BadRequestException("Bạn không có quyền xóa kết quả của đề thi này.");
        }

        StudentExamResult result = resultRepository.findById(resultId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kết quả thi"));
        
        if (!result.getExam().getId().equals(examId)) {
            throw new BadRequestException("Kết quả thi không thuộc về đề thi này.");
        }

        resultRepository.delete(result);
    }

    private void sendResultEmail(String to, String studentName, String examTitle,
                                  double score, double maxScore, double percentage, Boolean isPassed) {
        String status = Boolean.TRUE.equals(isPassed) ? "ĐẠT ✅" : "CHƯA ĐẠT ❌";
        String color = Boolean.TRUE.equals(isPassed) ? "#16a34a" : "#dc2626";
        String html = "<div style='font-family:sans-serif;max-width:600px;margin:auto;padding:32px;background:#f9fafb;border-radius:16px'>" +
                "<h2 style='color:#1e293b'>🎓 Kết quả bài thi</h2>" +
                "<p style='color:#475569'>Xin chào <strong>" + studentName + "</strong>,</p>" +
                "<p style='color:#475569'>Bạn vừa hoàn thành bài thi <strong>" + examTitle + "</strong>.</p>" +
                "<div style='background:#fff;border-radius:12px;padding:24px;margin:20px 0;border:1px solid #e2e8f0'>" +
                "<table style='width:100%;border-collapse:collapse'>" +
                "<tr><td style='padding:8px 0;color:#64748b;font-size:14px'>Điểm số</td>" +
                "<td style='padding:8px 0;font-weight:bold;font-size:20px;color:#1e293b;text-align:right'>" + String.format("%.2f", score) + " / " + String.format("%.2f", maxScore) + "</td></tr>" +
                "<tr><td style='padding:8px 0;color:#64748b;font-size:14px'>Phần trăm</td>" +
                "<td style='padding:8px 0;font-weight:bold;font-size:18px;color:#1e293b;text-align:right'>" + String.format("%.1f", percentage) + "%</td></tr>" +
                "<tr><td style='padding:8px 0;color:#64748b;font-size:14px'>Kết quả</td>" +
                "<td style='padding:8px 0;font-weight:bold;font-size:18px;color:" + color + ";text-align:right'>" + status + "</td></tr>" +
                "</table></div>" +
                "<p style='color:#94a3b8;font-size:12px;margin-top:24px'>Email này được gửi tự động từ hệ thống URANUS LMS.</p></div>";
        emailService.sendEmail(to, "[URANUS] Kết quả bài thi: " + examTitle, html);
    }

    @Transactional(readOnly = true)
    public ProctoringResponse getProctoringSession(UUID examId, User teacher) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đề thi"));
        if (!examAccessControlService.hasEditPermission(exam, teacher)) {
            throw new BadRequestException("Bạn không có quyền giám sát đề thi này.");
        }

        int totalQuestions = exam.getQuestions() != null ? exam.getQuestions().size() : 0;
        List<StudentExamResult> inProgress = resultRepository.findByExamAndSubmittedAtIsNull(exam);

        List<ProctoringResponse.ActiveAttempt> attempts = inProgress.stream()
                .map(r -> ProctoringResponse.ActiveAttempt.builder()
                        .resultId(r.getId())
                        .studentId(r.getStudent().getId())
                        .studentName(r.getStudent().getFullName())
                        .studentEmail(r.getStudent().getEmail())
                        .startedAt(r.getStartedAt())
                        .answeredCount((int) draftAnswerRepository.countByResult(r))
                        .totalQuestions(totalQuestions)
                        .cheatWarningCount(r.getCheatWarningCount() != null ? r.getCheatWarningCount() : 0)
                        .cheatDetails(r.getCheatDetails())
                        .submitted(false)
                        .submittedAt(null)
                        .totalScore(null)
                        .build())
                .toList();

        return ProctoringResponse.builder()
                .examId(exam.getId())
                .examTitle(exam.getTitle())
                .totalQuestions(totalQuestions)
                .activeAttempts(attempts)
                .build();
    }

    // De thi HIDDEN co dat mat khau (accessCode) truoc day khong duoc kiem tra o
    // dau ca - StudentResourceAccessService coi HIDDEN la "co link la vao duoc",
    // nen mat khau giao vien dat chi la trang tri, ai co link deu doc/lam duoc
    // de thi. Ap dung o ca getExamById (xem truoc) va startExam (bat dau lam
    // bai thuc su), vi hoc sinh co the goi thang startExam de bo qua buoc GET.
    private void requireValidAccessCode(Exam exam, String accessCode) {
        if (exam.getVisibility() != com.uranus.lms.modules.access.Visibility.HIDDEN
                || exam.getAccessCode() == null || exam.getAccessCode().isEmpty()) {
            return;
        }
        if (accessCode == null || accessCode.isEmpty()) {
            throw new com.uranus.lms.common.exception.AppException(com.uranus.lms.common.exception.ErrorCode.ACCESS_CODE_REQUIRED);
        }
        if (!exam.getAccessCode().equals(accessCode)) {
            throw new com.uranus.lms.common.exception.AppException(com.uranus.lms.common.exception.ErrorCode.INVALID_ACCESS_CODE);
        }
    }

    public boolean verifyExamPassword(UUID examId, String password) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đề thi"));
        
        if (exam.getAccessCode() == null || exam.getAccessCode().isEmpty()) {
            return true; // No password required
        }
        
        return exam.getAccessCode().equals(password);
    }

    @Transactional
    public String regradeShortAnswers(UUID examId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đề thi"));
        
        List<StudentExamResult> results = resultRepository.findByExamAndSubmittedAtIsNotNull(exam);
        int updatedCount = 0;
        
        for (StudentExamResult result : results) {
            boolean changed = false;
            double currentTotal = 0.0;
            
            ExamSnapshotDto snapshot = result.getExamSnapshot();
            if (snapshot == null) {
                snapshot = createSnapshot(exam);
            }
            List<ExamSnapshotDto.SnapshotQuestionDto> snapshotQuestions = snapshot != null && snapshot.getQuestions() != null ? snapshot.getQuestions() : new ArrayList<>();
            
            for (StudentAnswer answer : result.getAnswers()) {
                Question q = answer.getQuestion();
                if (q == null) continue; // Skip deleted questions
                
                if ("SHORT_ANSWER".equals(q.getQuestionType()) || "FILL_BLANK".equals(q.getQuestionType())) {
                    String studentText = answer.getTextResponse();
                    if (studentText != null && !studentText.trim().isEmpty()) {
                        studentText = normalizeShortAnswer(studentText);
                        boolean correct = false;
                        
                        // Try to find the question in snapshot
                        ExamSnapshotDto.SnapshotQuestionDto snapQ = snapshotQuestions.stream()
                                .filter(sq -> sq.getQuestionId().equals(q.getId()))
                                .findFirst().orElse(null);
                                
                        if (snapQ != null && snapQ.getOptions() != null) {
                            for (ExamSnapshotDto.SnapshotOptionDto opt : snapQ.getOptions()) {
                                if (Boolean.TRUE.equals(opt.getIsCorrect()) && opt.getContent() != null) {
                                    String correctText = normalizeShortAnswer(opt.getContent());
                                    if (studentText.equals(correctText)) {
                                        correct = true;
                                        break;
                                    }
                                }
                            }
                        } else {
                            if (q.getOptions() != null) {
                                for (QuestionOption opt : q.getOptions()) {
                                    if (Boolean.TRUE.equals(opt.getIsCorrect()) && opt.getContent() != null) {
                                        String correctText = normalizeShortAnswer(opt.getContent());
                                        if (studentText.equals(correctText)) {
                                            correct = true;
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                        
                        double newPoints = correct ? (q.getPoints() != null ? q.getPoints() : 0.0) : 0.0;
                        double oldPoints = answer.getPointsEarned() != null ? answer.getPointsEarned() : 0.0;
                        if (!Boolean.valueOf(correct).equals(answer.getIsCorrect()) || Math.abs(oldPoints - newPoints) > 0.001) {
                            answer.setIsCorrect(correct);
                            answer.setPointsEarned(newPoints);
                            changed = true;
                        }
                    } else {
                        if (Boolean.TRUE.equals(answer.getIsCorrect())) {
                            answer.setIsCorrect(false);
                            answer.setPointsEarned(0.0);
                            changed = true;
                        }
                    }
                }
                currentTotal += answer.getPointsEarned() != null ? answer.getPointsEarned() : 0.0;
            }
            
            double oldTotal = result.getTotalScore() != null ? result.getTotalScore() : 0.0;
            if (changed || Math.abs(oldTotal - currentTotal) > 0.001) {
                result.setTotalScore(currentTotal);
                double maxScore = snapshot != null && snapshot.getMaxScore() != null ? snapshot.getMaxScore() : snapshotQuestions.stream().mapToDouble(sq -> sq.getPoints() != null ? sq.getPoints() : 0.0).sum();
                if (maxScore == 0.0 && exam.getQuestions() != null) {
                    maxScore = exam.getQuestions().stream().mapToDouble(sq -> sq.getPoints() != null ? sq.getPoints() : 0.0).sum();
                }
                double percentage = maxScore > 0 ? (currentTotal / maxScore) * 100 : 0;
                double passingScore = exam.getPassingScore() != null ? exam.getPassingScore() : 0.0;
                result.setIsPassed(percentage >= passingScore);
                resultRepository.save(result);
                updatedCount++;
            }
        }
        return "Đã chấm lại " + updatedCount + " bài nộp cho đề thi " + exam.getTitle();
    }

    @Transactional
    public String addBonusPoints(UUID resultId, double bonusPoints) {
        StudentExamResult result = resultRepository.findById(resultId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kết quả bài thi"));
        
        double currentTotal = result.getTotalScore() != null ? result.getTotalScore() : 0.0;
        double newTotal = currentTotal + bonusPoints;
        result.setTotalScore(newTotal);
        
        Exam exam = result.getExam();
        ExamSnapshotDto snapshot = result.getExamSnapshot();
        List<ExamSnapshotDto.SnapshotQuestionDto> snapshotQuestions = snapshot != null && snapshot.getQuestions() != null ? snapshot.getQuestions() : new ArrayList<>();
        
        double maxScore = snapshot != null && snapshot.getMaxScore() != null ? snapshot.getMaxScore() : snapshotQuestions.stream().mapToDouble(sq -> sq.getPoints() != null ? sq.getPoints() : 0.0).sum();
        if (maxScore == 0.0 && exam.getQuestions() != null) {
            maxScore = exam.getQuestions().stream().mapToDouble(sq -> sq.getPoints() != null ? sq.getPoints() : 0.0).sum();
        }
        
        double percentage = maxScore > 0 ? (newTotal / maxScore) * 100 : 0;
        double passingScore = exam.getPassingScore() != null ? exam.getPassingScore() : 0.0;
        result.setIsPassed(percentage >= passingScore);
        
        resultRepository.save(result);
        return "Đã cộng thêm " + bonusPoints + " điểm. Điểm tổng mới: " + newTotal;
    }

    /** Danh sách câu tự luận đã nộp, AI đã chấm nháp, đang chờ giáo viên duyệt. */
    @Transactional(readOnly = true)
    public List<EssayReviewItemResponse> getPendingEssayReviews(UUID examId) {
        return studentAnswerRepository.findPendingEssayReviews(examId).stream()
                .map(a -> EssayReviewItemResponse.builder()
                        .answerId(a.getId())
                        .resultId(a.getResult().getId())
                        .studentName(a.getResult().getStudent().getFullName())
                        .studentEmail(a.getResult().getStudent().getEmail())
                        .questionContent(a.getQuestion() != null ? a.getQuestion().getContent() : null)
                        .studentAnswer(a.getTextResponse())
                        .maxPoints(a.getQuestion() != null ? a.getQuestion().getPoints() : null)
                        .aiSuggestedScore(a.getAiSuggestedScore())
                        .aiFeedback(a.getAiFeedback())
                        .submittedAt(a.getResult().getSubmittedAt())
                        .build())
                .toList();
    }

    /** Giáo viên duyệt (giữ nguyên hoặc sửa) điểm AI chấm nháp cho một câu tự luận. */
    @Transactional
    public String reviewEssayAnswer(UUID answerId, EssayReviewRequest request) {
        StudentAnswer answer = studentAnswerRepository.findById(answerId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy câu trả lời"));

        if (answer.getQuestion() == null || !"ESSAY".equals(answer.getQuestion().getQuestionType())) {
            throw new BadRequestException("Câu trả lời này không phải câu tự luận cần duyệt");
        }

        double maxPoints = answer.getQuestion().getPoints() != null ? answer.getQuestion().getPoints() : 0.0;
        double oldScore = answer.getPointsEarned() != null ? answer.getPointsEarned() : 0.0;
        double newScore = request.getScore() != null
                ? Math.max(0.0, Math.min(request.getScore(), maxPoints))
                : oldScore;

        answer.setPointsEarned(newScore);
        answer.setIsCorrect(newScore >= (maxPoints / 2));
        if (request.getFeedback() != null) {
            answer.setAiFeedback(request.getFeedback());
        }
        answer.setReviewed(true);
        studentAnswerRepository.save(answer);

        StudentExamResult result = answer.getResult();
        double delta = newScore - oldScore;
        double newTotal = (result.getTotalScore() != null ? result.getTotalScore() : 0.0) + delta;
        result.setTotalScore(newTotal);

        Exam exam = result.getExam();
        ExamSnapshotDto snapshot = result.getExamSnapshot();
        List<ExamSnapshotDto.SnapshotQuestionDto> snapshotQuestions = snapshot != null && snapshot.getQuestions() != null ? snapshot.getQuestions() : new ArrayList<>();
        double maxScore = snapshot != null && snapshot.getMaxScore() != null ? snapshot.getMaxScore() : snapshotQuestions.stream().mapToDouble(sq -> sq.getPoints() != null ? sq.getPoints() : 0.0).sum();
        if (maxScore == 0.0 && exam != null && exam.getQuestions() != null) {
            maxScore = exam.getQuestions().stream().mapToDouble(sq -> sq.getPoints() != null ? sq.getPoints() : 0.0).sum();
        }
        if (maxScore == 0.0) {
            maxScore = maxPoints > 0 ? maxPoints : 10.0;
        }
        double percentage = maxScore > 0 ? (newTotal / maxScore) * 100 : 0;
        double passingScore = exam != null && exam.getPassingScore() != null ? exam.getPassingScore() : 50.0;
        if (passingScore <= 10.0 && maxScore > 0) {
            passingScore = (passingScore / maxScore) * 100.0;
        }

        // Tự động chuyển sang ĐẠT khi gửi điểm:
        boolean isPassed = Boolean.TRUE.equals(request.getIsPassed())
                || percentage >= passingScore
                || percentage >= 50.0
                || (newScore >= (maxPoints / 2) && newTotal > 0);
        result.setIsPassed(isPassed);
        resultRepository.save(result);

        // Câu tự luận cuối cùng vừa được duyệt xong — giờ mới báo điểm thật cho học sinh
        if (!hasPendingEssay(result)) {
            User student = result.getStudent();
            String targetEmail = student.getEmail();
            try {
                sendResultEmail(targetEmail, student.getFullName(), exam.getTitle(), newTotal, maxScore, percentage, result.getIsPassed());
            } catch (Exception e) {
                log.warn("Could not send result email to {}: {}", targetEmail, e.getMessage());
            }
            notificationService.sendNotification(
                    student,
                    "Kết quả bài thi: " + exam.getTitle(),
                    "Giáo viên đã chấm xong bài thi. Điểm số: " + String.format("%.1f", newTotal) + "/" + String.format("%.1f", maxScore)
                            + " (" + (Boolean.TRUE.equals(result.getIsPassed()) ? "Đạt" : "Chưa đạt") + ").",
                    "/exams/" + exam.getId() + "/results/" + result.getId(),
                    com.uranus.lms.modules.notification.NotificationType.EXAM,
                    null,
                    "EXAM_SUBMISSION",
                    result.getId().toString()
            );
        }

        return "Đã duyệt điểm: " + newScore + "/" + maxPoints;
    }

    @Transactional
    public EssayReviewItemResponse regradeEssayWithAI(UUID answerId, User currentUser) {
        StudentAnswer answer = studentAnswerRepository.findById(answerId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy câu trả lời"));

        if (answer.getQuestion() == null || !"ESSAY".equals(answer.getQuestion().getQuestionType())) {
            throw new BadRequestException("Câu trả lời này không phải câu tự luận");
        }

        if (currentUser != null) {
            boolean isTeacherOrStaff = currentUser.getRole() == com.uranus.lms.modules.user.Role.TEACHER ||
                    currentUser.getRole() == com.uranus.lms.modules.user.Role.TEACHING_ASSISTANT ||
                    currentUser.getRole() == com.uranus.lms.modules.user.Role.ADMIN;
            boolean isOwner = answer.getResult() != null &&
                    answer.getResult().getStudent() != null &&
                    answer.getResult().getStudent().getId().equals(currentUser.getId());

            if (!isTeacherOrStaff && !isOwner) {
                throw new org.springframework.security.access.AccessDeniedException("Bạn không có quyền yêu cầu chấm lại bài làm này.");
            }
        }

        Exam exam = answer.getResult().getExam();
        double maxPoints = answer.getQuestion().getPoints() != null ? answer.getQuestion().getPoints() : 0.0;
        ExamAIService.EssayGradeResult gradeResult = examAIService.gradeEssay(
                answer.getQuestion().getContent(),
                answer.getTextResponse(),
                maxPoints,
                exam != null ? exam.getSubject() : null,
                answer.getResult().getStudent().getId()
        );

        answer.setAiSuggestedScore(gradeResult.score);
        answer.setAiFeedback(examAIService.serializeFeedback(gradeResult));

        // Chấm lại điểm: cập nhật điểm mới và đặt lại reviewed = false để giáo viên duyệt lại điểm
        double oldEarned = answer.getPointsEarned() != null ? answer.getPointsEarned() : 0.0;
        answer.setPointsEarned(gradeResult.score);
        answer.setIsCorrect(gradeResult.score >= (maxPoints / 2));
        answer.setReviewed(false);

        StudentExamResult res = answer.getResult();
        if (res != null) {
            double currentTotal = res.getTotalScore() != null ? res.getTotalScore() : 0.0;
            double newTotal = Math.max(0.0, currentTotal - oldEarned + gradeResult.score);
            res.setTotalScore(Math.round(newTotal * 100.0) / 100.0);

            Exam currExam = res.getExam();
            ExamSnapshotDto snapshot = res.getExamSnapshot();
            double maxScore = snapshot != null && snapshot.getMaxScore() != null ? snapshot.getMaxScore() : (maxPoints > 0 ? maxPoints : 10.0);
            double passingScore = currExam != null && currExam.getPassingScore() != null ? currExam.getPassingScore() : 50.0;
            if (passingScore <= 10.0 && maxScore > 0) {
                passingScore = (passingScore / maxScore) * 100.0;
            }
            double percentage = maxScore > 0 ? (newTotal / maxScore) * 100 : 0;
            boolean isPassed = percentage >= passingScore
                    || percentage >= 50.0
                    || (gradeResult.score >= (maxPoints / 2) && newTotal > 0);
            res.setIsPassed(isPassed);
            resultRepository.save(res);
        }

        studentAnswerRepository.save(answer);

        return EssayReviewItemResponse.builder()
                .answerId(answer.getId())
                .resultId(answer.getResult().getId())
                .studentName(answer.getResult().getStudent().getFullName())
                .studentEmail(answer.getResult().getStudent().getEmail())
                .questionContent(answer.getQuestion() != null ? answer.getQuestion().getContent() : null)
                .studentAnswer(answer.getTextResponse())
                .maxPoints(answer.getQuestion() != null ? answer.getQuestion().getPoints() : null)
                .aiSuggestedScore(answer.getAiSuggestedScore())
                .aiFeedback(answer.getAiFeedback())
                .submittedAt(answer.getResult().getSubmittedAt())
                .build();
    }

    public EssayReviewItemResponse regradeEssayWithAI(UUID answerId) {
        return regradeEssayWithAI(answerId, null);
    }

    @Transactional
    public EssayReviewItemResponse regradeEssayQuestionWithAI(UUID resultId, UUID questionId, User currentUser) {
        StudentExamResult result = resultRepository.findById(resultId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kết quả bài thi"));
        StudentAnswer answer = result.getAnswers().stream()
                .filter(a -> a.getQuestion() != null && a.getQuestion().getId().equals(questionId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy câu trả lời của câu hỏi này"));
        return regradeEssayWithAI(answer.getId(), currentUser);
    }

    @Transactional
    public String reviewEssayQuestion(UUID resultId, UUID questionId, EssayReviewRequest request) {
        StudentExamResult result = resultRepository.findById(resultId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kết quả bài thi"));
        StudentAnswer answer = result.getAnswers().stream()
                .filter(a -> a.getQuestion() != null && a.getQuestion().getId().equals(questionId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy câu trả lời của câu hỏi này"));
        return reviewEssayAnswer(answer.getId(), request);
    }

    @Transactional
    public ExamResultDetailResponse regradeAllEssaysInResult(UUID resultId, User currentUser) {
        StudentExamResult result = resultRepository.findById(resultId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kết quả bài thi"));

        if (currentUser != null) {
            boolean isTeacherOrStaff = currentUser.getRole() == com.uranus.lms.modules.user.Role.TEACHER ||
                    currentUser.getRole() == com.uranus.lms.modules.user.Role.TEACHING_ASSISTANT ||
                    currentUser.getRole() == com.uranus.lms.modules.user.Role.ADMIN;
            boolean isOwner = result.getStudent() != null && result.getStudent().getId().equals(currentUser.getId());
            if (!isTeacherOrStaff && !isOwner) {
                throw new org.springframework.security.access.AccessDeniedException("Bạn không có quyền yêu cầu chấm lại bài làm này.");
            }
        }

        List<StudentAnswer> essayAnswers = result.getAnswers().stream()
                .filter(a -> a.getQuestion() != null && "ESSAY".equals(a.getQuestion().getQuestionType()))
                .toList();

        for (StudentAnswer answer : essayAnswers) {
            try {
                regradeEssayWithAI(answer.getId(), currentUser);
            } catch (Exception e) {
                log.error("Lỗi khi chấm lại câu tự luận {}: {}", answer.getId(), e.getMessage());
            }
        }

        return getResultDetail(resultId, currentUser);
    }

    @Transactional
    public String regradeAllPendingEssaysInExam(UUID examId) {
        List<EssayReviewItemResponse> pending = getPendingEssayReviews(examId);
        int count = 0;
        for (EssayReviewItemResponse item : pending) {
            try {
                regradeEssayWithAI(item.getAnswerId(), null);
                count++;
            } catch (Exception e) {
                log.error("Lỗi khi chấm lại tự luận answerId={}: {}", item.getAnswerId(), e.getMessage());
            }
        }
        return "Đã hoàn tất chấm lại bằng AI cho " + count + " câu tự luận.";
    }

    @Transactional
    public ExamResultDetailResponse approveAndPublishResult(UUID resultId, User currentUser) {
        StudentExamResult result = resultRepository.findById(resultId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kết quả bài thi"));

        if (currentUser != null) {
            boolean isTeacherOrStaff = currentUser.getRole() == com.uranus.lms.modules.user.Role.TEACHER ||
                    currentUser.getRole() == com.uranus.lms.modules.user.Role.TEACHING_ASSISTANT ||
                    currentUser.getRole() == com.uranus.lms.modules.user.Role.ADMIN;
            boolean isOwner = result.getStudent() != null && result.getStudent().getId().equals(currentUser.getId());
            if (!isTeacherOrStaff && !isOwner && !examAccessControlService.hasEditPermission(result.getExam(), currentUser)) {
                throw new org.springframework.security.access.AccessDeniedException("Bạn không có quyền duyệt bài thi này.");
            }
        }

        double currentTotal = 0.0;
        for (StudentAnswer answer : result.getAnswers()) {
            if (answer.getQuestion() != null && "ESSAY".equals(answer.getQuestion().getQuestionType())) {
                if (!Boolean.TRUE.equals(answer.getReviewed())) {
                    double score = answer.getPointsEarned() != null ? answer.getPointsEarned() :
                            (answer.getAiSuggestedScore() != null ? answer.getAiSuggestedScore() : 0.0);
                    answer.setPointsEarned(score);
                    double maxPoints = answer.getQuestion().getPoints() != null ? answer.getQuestion().getPoints() : 0.0;
                    answer.setIsCorrect(score >= (maxPoints / 2));
                    answer.setReviewed(true);
                    studentAnswerRepository.save(answer);
                }
            }
            currentTotal += (answer.getPointsEarned() != null ? answer.getPointsEarned() : 0.0);
        }

        result.setTotalScore(Math.round(currentTotal * 100.0) / 100.0);
        Exam exam = result.getExam();
        ExamSnapshotDto snapshot = result.getExamSnapshot();
        List<ExamSnapshotDto.SnapshotQuestionDto> snapshotQuestions = snapshot != null && snapshot.getQuestions() != null ? snapshot.getQuestions() : new ArrayList<>();
        double maxScore = snapshot != null && snapshot.getMaxScore() != null ? snapshot.getMaxScore() : snapshotQuestions.stream().mapToDouble(sq -> sq.getPoints() != null ? sq.getPoints() : 0.0).sum();
        if (maxScore == 0.0 && exam != null && exam.getQuestions() != null) {
            maxScore = exam.getQuestions().stream().mapToDouble(sq -> sq.getPoints() != null ? sq.getPoints() : 0.0).sum();
        }
        if (maxScore == 0.0) {
            maxScore = 10.0;
        }
        double percentage = maxScore > 0 ? (result.getTotalScore() / maxScore) * 100 : 0;
        double passingScore = exam != null && exam.getPassingScore() != null ? exam.getPassingScore() : 50.0;
        if (passingScore <= 10.0 && maxScore > 0) {
            passingScore = (passingScore / maxScore) * 100.0;
        }
        boolean isPassed = percentage >= passingScore
                || percentage >= 50.0
                || result.getTotalScore() >= (maxScore * 0.5);
        result.setIsPassed(isPassed);
        resultRepository.save(result);

        User student = result.getStudent();
        if (student != null) {
            try {
                sendResultEmail(student.getEmail(), student.getFullName(), exam.getTitle(), result.getTotalScore(), maxScore, percentage, result.getIsPassed());
            } catch (Exception e) {
                log.warn("Could not send result email: {}", e.getMessage());
            }
            try {
                notificationService.sendNotification(
                        student,
                        "Kết quả bài thi: " + exam.getTitle(),
                        "Giáo viên đã duyệt điểm bài thi của bạn. Điểm số: " + String.format("%.1f", result.getTotalScore()) + "/" + String.format("%.1f", maxScore)
                                + " (" + (Boolean.TRUE.equals(result.getIsPassed()) ? "Đạt" : "Chưa đạt") + ").",
                        "/exams/" + exam.getId() + "/results/" + result.getId(),
                        com.uranus.lms.modules.notification.NotificationType.EXAM,
                        null,
                        "EXAM_SUBMISSION",
                        result.getId().toString()
                );
            } catch (Exception e) {
                log.warn("Could not send notification: {}", e.getMessage());
            }
        }

        return getResultDetail(resultId, currentUser);
    }

    @Transactional
    public ExamResultDetailResponse updateResultPassStatus(UUID resultId, Boolean isPassed, Double totalScore, User currentUser) {
        StudentExamResult result = resultRepository.findById(resultId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kết quả bài thi"));

        if (isPassed != null) {
            result.setIsPassed(isPassed);
        }

        if (totalScore != null) {
            result.setTotalScore(Math.max(0.0, totalScore));
            Exam exam = result.getExam();
            ExamSnapshotDto snapshot = result.getExamSnapshot();
            List<ExamSnapshotDto.SnapshotQuestionDto> snapshotQuestions = snapshot != null && snapshot.getQuestions() != null ? snapshot.getQuestions() : new ArrayList<>();
            double maxScore = snapshot != null && snapshot.getMaxScore() != null ? snapshot.getMaxScore() : snapshotQuestions.stream().mapToDouble(sq -> sq.getPoints() != null ? sq.getPoints() : 0.0).sum();
            if (maxScore == 0.0 && exam.getQuestions() != null) {
                maxScore = exam.getQuestions().stream().mapToDouble(sq -> sq.getPoints() != null ? sq.getPoints() : 0.0).sum();
            }
            double passingScore = exam.getPassingScore() != null ? exam.getPassingScore() : 0.0;
            double percentage = maxScore > 0 ? (result.getTotalScore() / maxScore) * 100 : 0;
            if (isPassed == null) {
                result.setIsPassed(percentage >= passingScore);
            }
        }

        // Tự động đánh dấu reviewed = true cho các câu tự luận nếu đã đạt
        if (Boolean.TRUE.equals(result.getIsPassed()) && result.getAnswers() != null) {
            for (StudentAnswer answer : result.getAnswers()) {
                if (answer.getQuestion() != null && "ESSAY".equals(answer.getQuestion().getQuestionType())) {
                    answer.setReviewed(true);
                    if (answer.getPointsEarned() == null || answer.getPointsEarned() == 0.0) {
                        double maxP = answer.getQuestion().getPoints() != null ? answer.getQuestion().getPoints() : 0.0;
                        answer.setPointsEarned(maxP);
                        answer.setIsCorrect(true);
                    }
                    studentAnswerRepository.save(answer);
                }
            }
        }

        resultRepository.save(result);

        User student = result.getStudent();
        if (student != null) {
            try {
                notificationService.sendNotification(
                        student,
                        "Cập nhật kết quả bài thi: " + result.getExam().getTitle(),
                        "Bài thi của bạn đã được cập nhật trạng thái: " + (Boolean.TRUE.equals(result.getIsPassed()) ? "ĐẠT TIÊU CHUẨN ✅" : "CHƯA ĐẠT ❌") + ".",
                        "/exams/" + result.getExam().getId() + "/results/" + result.getId(),
                        com.uranus.lms.modules.notification.NotificationType.EXAM,
                        null,
                        "EXAM_SUBMISSION",
                        result.getId().toString()
                );
            } catch (Exception e) {
                log.warn("Could not send notification: {}", e.getMessage());
            }
        }

        return getResultDetail(resultId, currentUser);
    }


    /**
     * Chuan hoa dap an tra loi ngan / dien khuyet truoc khi so khop: khong phan biet hoa thuong,
     * bo dau cau o dau/cuoi (hoc sinh co dua ghi dau cham, co dua khong), gop khoang trang,
     * doi nhay cong (ban phim dien thoai) ve nhay thang, bo the HTML/&nbsp; tu trinh soan de.
     */
    static String normalizeShortAnswer(String raw) {
        if (raw == null) return "";
        String s = raw.replaceAll("<[^>]+>", " ")
                .replace("&nbsp;", " ").replace("\u00A0", " ")
                .replace("&amp;", "&").replace("&#39;", "'").replace("&quot;", "\"")
                .replace('\u2019', '\'').replace('\u2018', '\'')
                .replace('\u201C', '"').replace('\u201D', '"');
        s = java.text.Normalizer.normalize(s, java.text.Normalizer.Form.NFC);
        s = s.toLowerCase(java.util.Locale.ROOT).replaceAll("\\s+", " ").trim();
        // Chi bo dau cau that su - giu nguyen - + % $ de "-5" khong thanh "5" o cau Toan.
        s = s.replaceAll("^[.,!?;:\"'()\\[\\]\u2026\\s]+|[.,!?;:\"'()\\[\\]\u2026\\s]+$", "");
        s = s.replaceAll("\\s+([.,!?;:])", "$1");
        return s;
    }
}

