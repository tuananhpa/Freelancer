# Danh sách endpoint của backend Java gốc

Sinh tự động bằng `node tools/list-endpoints.mjs` từ 35 controller — **256 endpoint**. Backend Cloudflare phải trả đúng các path này (frontend gọi `/api/...`).
Cột "Quyền" là `@PreAuthorize` trong Java (trống = chỉ cần đăng nhập, hoặc công khai nếu SecurityConfig cho phép — xem PLAN.md §5).

| Method | Path | Quyền | Handler Java |
|---|---|---|---|
| GET | `/api/activities` |  | `ActivityController.list` |
| POST | `/api/activities` |  | `ActivityController.create` |
| DELETE | `/api/activities/{id}` |  | `ActivityController.delete` |
| GET | `/api/activities/{id}` |  | `ActivityController.getById` |
| PUT | `/api/activities/{id}` |  | `ActivityController.update` |
| POST | `/api/activities/{id}/approve` |  | `ActivityController.approve` |
| POST | `/api/activities/{id}/archive` |  | `ActivityController.archive` |
| PATCH | `/api/activities/{id}/pin` |  | `ActivityController.setPinned` |
| POST | `/api/activities/{id}/reject` |  | `ActivityController.reject` |
| POST | `/api/activities/{id}/submit` |  | `ActivityController.submit` |
| GET | `/api/activities/pending-count` |  | `ActivityController.pendingCount` |
| GET | `/api/admin/users` |  | `UserController.getAllUsers` |
| POST | `/api/admin/users` |  | `UserController.createUser` |
| DELETE | `/api/admin/users/{id}` |  | `UserController.deleteUser` |
| GET | `/api/admin/users/{id}` |  | `UserController.getUserById` |
| PUT | `/api/admin/users/{id}` |  | `UserController.updateUser` |
| GET | `/api/admin/users/{id}/classrooms` |  | `UserController.getUserClassrooms` |
| PUT | `/api/admin/users/{id}/classrooms` |  | `UserController.updateUserClassrooms` |
| PATCH | `/api/admin/users/{id}/student-code` |  | `UserController.updateStudentCode` |
| PUT | `/api/admin/users/bulk-status` |  | `UserController.bulkUpdateUserStatus` |
| GET | `/api/analytics/admin` |  | `AnalyticsController.getAdminStats` |
| GET | `/api/analytics/progress-report` |  | `AnalyticsController.getProgressReport` |
| GET | `/api/analytics/student` |  | `AnalyticsController.getStudentStats` |
| GET | `/api/analytics/teacher` |  | `AnalyticsController.getTeacherStats` |
| GET | `/api/audit-logs` | hasRole('ADMIN') | `AuditLogController.getAuditLogs` |
| POST | `/api/auth/forgot-password` |  | `AuthController.forgotPassword` |
| POST | `/api/auth/google` |  | `AuthController.loginWithGoogle` |
| POST | `/api/auth/login` |  | `AuthController.login` |
| POST | `/api/auth/logout` |  | `AuthController.logout` |
| POST | `/api/auth/register` |  | `AuthController.register` |
| POST | `/api/auth/resend-verification` |  | `AuthController.resendVerification` |
| POST | `/api/auth/reset-password` |  | `AuthController.resetPassword` |
| POST | `/api/auth/verify` |  | `AuthController.verifyEmail` |
| GET | `/api/calendar/events` |  | `CalendarController.getEvents` |
| GET | `/api/classes` |  | `ClassroomController.getMyClasses` |
| POST | `/api/classes` | hasRole('ADMIN') | `ClassroomController.createClassroom` |
| GET | `/api/classes/{classId}` |  | `ClassroomController.getClassroomById` |
| GET | `/api/classes/{classId}/attendance` |  | `ClassroomAttendanceController.getAttendance` |
| POST | `/api/classes/{classId}/attendance` |  | `ClassroomAttendanceController.recordAttendance` |
| GET | `/api/classes/{classId}/courses` |  | `ClassroomController.getLinkedCourses` |
| DELETE | `/api/classes/{classId}/courses/{courseId}` |  | `ClassroomController.unlinkCourse` |
| POST | `/api/classes/{classId}/courses/{courseId}` |  | `ClassroomController.linkCourse` |
| GET | `/api/classes/{classId}/folders` |  | `ClassroomController.getClassFolders` |
| POST | `/api/classes/{classId}/folders` |  | `ClassroomController.createClassFolder` |
| DELETE | `/api/classes/{classId}/folders/{folderId}` |  | `ClassroomController.deleteClassFolder` |
| PUT | `/api/classes/{classId}/folders/{folderId}` |  | `ClassroomController.updateClassFolder` |
| GET | `/api/classes/{classId}/members` |  | `ClassroomController.getMembers` |
| POST | `/api/classes/{classId}/members` |  | `ClassroomController.addMember` |
| DELETE | `/api/classes/{classId}/members/{studentId}` |  | `ClassroomController.removeMember` |
| PUT | `/api/classes/{classId}/members/{studentId}/role` |  | `ClassroomController.updateMemberRole` |
| GET | `/api/classes/{classId}/posts` |  | `ClassroomController.getClassPosts` |
| POST | `/api/classes/{classId}/posts` |  | `ClassroomController.createPost` |
| DELETE | `/api/classes/{classId}/posts/{postId}` |  | `ClassroomController.deletePost` |
| PUT | `/api/classes/{classId}/posts/{postId}` |  | `ClassroomController.updatePost` |
| GET | `/api/classes/{classId}/posts/{postId}/comments` |  | `ClassroomController.getPostComments` |
| POST | `/api/classes/{classId}/posts/{postId}/comments` |  | `ClassroomController.addPostComment` |
| DELETE | `/api/classes/{classId}/posts/{postId}/comments/{commentId}` |  | `ClassroomController.deletePostComment` |
| PUT | `/api/classes/{classId}/posts/{postId}/comments/{commentId}` |  | `ClassroomController.updatePostComment` |
| POST | `/api/classes/{classId}/posts/{postId}/comments/{commentId}/like` |  | `ClassroomController.toggleLikeComment` |
| POST | `/api/classes/{classId}/posts/{postId}/like` |  | `ClassroomController.toggleLike` |
| POST | `/api/classes/{classId}/remind-deadline` |  | `ClassroomController.remindDeadline` |
| GET | `/api/classes/{classId}/resources` |  | `ClassroomController.getClassResources` |
| POST | `/api/classes/{classId}/resources` |  | `ClassroomController.assignResource` |
| DELETE | `/api/classes/{classId}/resources/{resourceId}` |  | `ClassroomController.removeResource` |
| PUT | `/api/classes/{classId}/settings/info` |  | `ClassroomController.updateClassInfo` |
| PUT | `/api/classes/{classId}/settings/leaderboard` |  | `ClassroomController.updateLeaderboard` |
| PUT | `/api/classes/{classId}/settings/meeting-link` |  | `ClassroomController.updateMeetingLink` |
| PUT | `/api/classes/{classId}/settings/thumbnail` |  | `ClassroomController.updateThumbnail` |
| GET | `/api/classes/admin/all` | hasAnyRole('ADMIN', 'OFFICE') | `ClassroomController.getAllClassroomsAdmin` |
| GET | `/api/classes/admin/groups` | hasAnyRole('ADMIN', 'OFFICE') | `ClassroomController.getAdminGroups` |
| POST | `/api/classes/admin/groups` | hasAnyRole('ADMIN', 'OFFICE') | `ClassroomController.createAdminGroup` |
| DELETE | `/api/classes/admin/groups/{classId}` | hasAnyRole('ADMIN', 'OFFICE') | `ClassroomController.deleteAdminGroup` |
| PUT | `/api/classes/admin/groups/{classId}` | hasAnyRole('ADMIN', 'OFFICE') | `ClassroomController.updateAdminGroup` |
| POST | `/api/classes/join` |  | `ClassroomController.joinClassroom` |
| GET | `/api/courses` |  | `CourseController.getAllPublishedCourses` |
| POST | `/api/courses` |  | `CourseController.createCourse` |
| DELETE | `/api/courses/{id}` |  | `CourseController.deleteCourse` |
| GET | `/api/courses/{id}` |  | `CourseController.getCourseById` |
| PUT | `/api/courses/{id}` |  | `CourseController.updateCourse` |
| POST | `/api/courses/{id}/enroll` |  | `CourseController.enrollInCourse` |
| GET | `/api/courses/{id}/progress` |  | `CourseController.getCourseProgress` |
| POST | `/api/courses/{id}/sections` | hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN') | `CourseController.addSection` |
| DELETE | `/api/courses/lessons/{lessonId}` | hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN') | `CourseController.deleteLesson` |
| PUT | `/api/courses/lessons/{lessonId}` | hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN') | `CourseController.updateLesson` |
| POST | `/api/courses/lessons/{lessonId}/complete` |  | `CourseController.markLessonComplete` |
| GET | `/api/courses/my-enrollments` |  | `CourseController.getMyEnrollments` |
| DELETE | `/api/courses/sections/{sectionId}` | hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN') | `CourseController.deleteSection` |
| PUT | `/api/courses/sections/{sectionId}` | hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN') | `CourseController.updateSection` |
| POST | `/api/courses/sections/{sectionId}/lessons` | hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN') | `CourseController.addLesson` |
| GET | `/api/courses/teacher` |  | `CourseController.getTeacherCourses` |
| POST | `/api/exams` |  | `ExamController.createExam` |
| DELETE | `/api/exams/{id}` |  | `ExamController.deleteExam` |
| GET | `/api/exams/{id}` |  | `ExamController.getExamById` |
| PUT | `/api/exams/{id}` |  | `ExamController.updateExam` |
| GET | `/api/exams/{id}/analytics` |  | `ExamController.getExamAnalytics` |
| POST | `/api/exams/{id}/draft` |  | `ExamController.saveDraft` |
| GET | `/api/exams/{id}/export-excel` |  | `ExamController.exportResultsExcel` |
| GET | `/api/exams/{id}/favorite` |  | `ExamController.isFavorited` |
| POST | `/api/exams/{id}/favorite` |  | `ExamController.toggleFavorite` |
| GET | `/api/exams/{id}/pending-essay-reviews` | hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN') | `ExamController.getPendingEssayReviews` |
| GET | `/api/exams/{id}/proctoring` |  | `ExamController.getProctoringSession` |
| PATCH | `/api/exams/{id}/publish` |  | `ExamController.togglePublish` |
| POST | `/api/exams/{id}/regrade-all-essays` | hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN') | `ExamController.regradeAllPendingEssaysInExam` |
| POST | `/api/exams/{id}/regrade-short-answers` | hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN') | `ExamController.regradeShortAnswers` |
| DELETE | `/api/exams/{id}/results/{resultId}` |  | `ExamController.deleteExamResult` |
| POST | `/api/exams/{id}/start` |  | `ExamController.startExam` |
| POST | `/api/exams/{id}/submit` |  | `ExamController.submitExam` |
| POST | `/api/exams/{id}/verify-password` |  | `ExamController.verifyPassword` |
| POST | `/api/exams/answers/{answerId}/regrade-ai` | hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN', 'STUDENT') | `ExamController.regradeEssayWithAI` |
| PATCH | `/api/exams/answers/{answerId}/review` | hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN', 'STUDENT') | `ExamController.reviewEssayAnswer` |
| GET | `/api/exams/code/{code}` |  | `ExamController.getExamByCode` |
| GET | `/api/exams/favorites` |  | `ExamController.getFavoriteExams` |
| GET | `/api/exams/history` |  | `ExamController.getStudentHistory` |
| POST | `/api/exams/import-ai-scan` | hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN') | `ExamImportController.importAiScan` |
| POST | `/api/exams/import-document` | hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN') | `ExamImportController.importDocument` |
| POST | `/api/exams/import-pdf` | hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN') | `ExamImportController.importFromPdf` |
| POST | `/api/exams/import-structure` | hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN') | `ExamImportController.importStructure` |
| GET | `/api/exams/public` |  | `ExamController.getAllPublishedExams` |
| GET | `/api/exams/results/{resultId}` |  | `ExamController.getResultDetail` |
| POST | `/api/exams/results/{resultId}/add-bonus` | hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN') | `ExamController.addBonusPoints` |
| PATCH | `/api/exams/results/{resultId}/pass-status` | hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN', 'STUDENT') | `ExamController.updatePassStatus` |
| POST | `/api/exams/results/{resultId}/publish-grade` | hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN', 'STUDENT') | `ExamController.approveAndPublishResult` |
| POST | `/api/exams/results/{resultId}/questions/{questionId}/regrade-ai` | hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN', 'STUDENT') | `ExamController.regradeEssayQuestionWithAI` |
| PATCH | `/api/exams/results/{resultId}/questions/{questionId}/review` | hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN', 'STUDENT') | `ExamController.reviewEssayQuestion` |
| POST | `/api/exams/results/{resultId}/regrade-all-essays` | hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN', 'STUDENT') | `ExamController.regradeAllEssaysInResult` |
| GET | `/api/exams/results/{resultId}/review` |  | `ExamController.getResultReview` |
| GET | `/api/exams/subjects` |  | `ExamController.getAvailableSubjects` |
| GET | `/api/exams/teacher` |  | `ExamController.getTeacherExams` |
| POST | `/api/flashcards/decks` |  | `FlashcardController.createDeck` |
| DELETE | `/api/flashcards/decks/{id}` |  | `FlashcardController.deleteDeck` |
| GET | `/api/flashcards/decks/{id}` |  | `FlashcardController.getDeckById` |
| PUT | `/api/flashcards/decks/{id}` |  | `FlashcardController.updateDeck` |
| GET | `/api/flashcards/decks/{id}/due` |  | `FlashcardController.getDueCards` |
| GET | `/api/flashcards/decks/{id}/favorite` |  | `FlashcardController.isFavorited` |
| POST | `/api/flashcards/decks/{id}/favorite` |  | `FlashcardController.toggleFavorite` |
| GET | `/api/flashcards/decks/{id}/progress` |  | `FlashcardController.getDeckProgress` |
| PUT | `/api/flashcards/decks/{id}/rating` |  | `FlashcardController.rateDeck` |
| POST | `/api/flashcards/decks/{id}/share` |  | `FlashcardController.incrementShareCount` |
| GET | `/api/flashcards/decks/{id}/statistics` |  | `FlashcardController.getDeckStatistics` |
| GET | `/api/flashcards/decks/{id}/suggested` |  | `FlashcardController.getSuggestedDecks` |
| POST | `/api/flashcards/decks/{id}/view` |  | `FlashcardController.incrementViewCount` |
| GET | `/api/flashcards/favorites` |  | `FlashcardController.getFavoriteDecks` |
| GET | `/api/flashcards/my-decks` |  | `FlashcardController.getMyDecks` |
| PUT | `/api/flashcards/progress/{cardId}` |  | `FlashcardController.updateProgress` |
| GET | `/api/flashcards/public` |  | `FlashcardController.getAllPublicDecks` |
| GET | `/api/folders` |  | `ContentFolderController.getMyFolders` |
| POST | `/api/folders` |  | `ContentFolderController.createFolder` |
| DELETE | `/api/folders/{id}` |  | `ContentFolderController.deleteFolder` |
| GET | `/api/gamification` |  | `GamificationController.getStats` |
| POST | `/api/gamification/activity` |  | `GamificationController.recordActivity` |
| GET | `/api/gamification/leaderboard` |  | `GamificationController.getLeaderboard` |
| POST | `/api/learning-path/placement` |  | `LearningPathController.submitPlacement` |
| GET | `/api/learning-path/placement-test` |  | `LearningPathController.getPlacementTest` |
| POST | `/api/learning-path/placement-test/submit` |  | `LearningPathController.submitPlacementTest` |
| GET | `/api/learning-path/recommendations` |  | `LearningPathController.getRecommendations` |
| GET | `/api/learning-path/status` |  | `LearningPathController.getStatus` |
| GET | `/api/lessons/{lessonId}/comments` |  | `LessonCommentController.getComments` |
| POST | `/api/lessons/{lessonId}/comments` |  | `LessonCommentController.addComment` |
| POST | `/api/media/upload` | hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN') | `MediaController.uploadFile` |
| GET | `/api/mistake-vault` |  | `MistakeVaultController.getVault` |
| POST | `/api/mistake-vault/{id}/review` |  | `MistakeVaultController.review` |
| POST | `/api/mistake-vault/vocab` |  | `MistakeVaultController.addVocabMistake` |
| GET | `/api/notifications` |  | `NotificationController.getNotifications` |
| DELETE | `/api/notifications/{id}` |  | `NotificationController.deleteNotification` |
| PUT | `/api/notifications/{id}/read` |  | `NotificationController.markAsRead` |
| DELETE | `/api/notifications/clear-read` |  | `NotificationController.clearReadNotifications` |
| PUT | `/api/notifications/read-all` |  | `NotificationController.markAllAsRead` |
| GET | `/api/notifications/unread-count` |  | `NotificationController.getUnreadCount` |
| GET | `/api/public/activities` |  | `PublicActivityController.list` |
| GET | `/api/public/activities/{slug}` |  | `PublicActivityController.getBySlug` |
| GET | `/api/resources` |  | `ContentResourceController.getResources` |
| POST | `/api/resources` |  | `ContentResourceController.createResource` |
| DELETE | `/api/resources/{id}` |  | `ContentResourceController.deleteResource` |
| GET | `/api/resources/{id}` |  | `ContentResourceController.getResourceById` |
| PUT | `/api/resources/{id}` |  | `ContentResourceController.updateResource` |
| POST | `/api/resources/{id}/bookmark` |  | `ContentResourceController.toggleBookmark` |
| POST | `/api/resources/{id}/like` |  | `ContentResourceController.toggleLike` |
| GET | `/api/resources/{id}/submissions` |  | `ContentResourceController.getSubmissions` |
| POST | `/api/resources/{id}/submissions` |  | `ContentResourceController.submitWriting` |
| GET | `/api/resources/{id}/submissions/me` |  | `ContentResourceController.getMySubmission` |
| GET | `/api/resources/my-bookmarks` |  | `ContentResourceController.getMyBookmarks` |
| GET | `/api/resources/my-uploads` |  | `ContentResourceController.getMyUploads` |
| POST | `/api/resources/submissions/{submissionId}/grade` |  | `ContentResourceController.gradeSubmission` |
| GET | `/api/search` |  | `SearchController.search` |
| POST | `/api/share` |  | `ShareController.createShare` |
| GET | `/api/share/{token}` |  | `ShareController.resolve` |
| POST | `/api/share/clone/deck/{deckId}` |  | `ShareController.cloneDeck` |
| POST | `/api/support/conversations` |  | `SupportController.openConversation` |
| GET | `/api/support/conversations/{id}` |  | `SupportController.getConversation` |
| POST | `/api/support/conversations/{id}/assign` | hasAnyRole('OFFICE','ADMIN') | `SupportController.assign` |
| POST | `/api/support/conversations/{id}/attachments` |  | `SupportController.uploadAttachment` |
| POST | `/api/support/conversations/{id}/close` | hasAnyRole('OFFICE','ADMIN') | `SupportController.close` |
| GET | `/api/support/conversations/{id}/messages` |  | `SupportController.listMessages` |
| POST | `/api/support/conversations/{id}/messages` |  | `SupportController.sendMessage` |
| POST | `/api/support/conversations/{id}/typing` |  | `SupportController.sendTyping` |
| POST | `/api/support/conversations/claim` |  | `SupportController.claim` |
| POST | `/api/support/guest-session` |  | `SupportController.openGuestSession` |
| GET | `/api/support/inbox` | hasAnyRole('OFFICE','ADMIN') | `SupportController.inbox` |
| GET | `/api/support/inbox/unread-count` | hasAnyRole('OFFICE','ADMIN') | `SupportController.unreadCount` |
| GET | `/api/users/me` |  | `UserProfileController.getMyProfile` |
| PUT | `/api/users/me` |  | `UserProfileController.updateMyProfile` |
| PUT | `/api/users/me/password` |  | `UserProfileController.changeMyPassword` |
| PUT | `/api/users/me/role` |  | `UserProfileController.updateMyRole` |
| POST | `/api/v1/assignments` |  | `AssignmentController.createAssignment` |
| POST | `/api/v1/assignments/{assignmentId}/ai-grade` |  | `AiWritingGradingController.gradeAllInAssignment` |
| GET | `/api/v1/assignments/{assignmentId}/ai-grading/batch-status/{batchId}` |  | `AiWritingGradingController.getBatchStatus` |
| DELETE | `/api/v1/assignments/{id}` |  | `AssignmentController.deleteAssignment` |
| GET | `/api/v1/assignments/{id}` |  | `AssignmentController.getAssignmentById` |
| PUT | `/api/v1/assignments/{id}` |  | `AssignmentController.updateAssignment` |
| GET | `/api/v1/assignments/{id}/submissions` |  | `AssignmentController.getSubmissionsByAssignment` |
| GET | `/api/v1/assignments/{id}/submissions/my` |  | `AssignmentController.getMySubmission` |
| POST | `/api/v1/assignments/{id}/submit` |  | `AssignmentController.submitAssignment` |
| POST | `/api/v1/assignments/ai-grading/batch` |  | `AiWritingGradingController.batchGradeSelected` |
| GET | `/api/v1/assignments/classroom/{classroomId}` |  | `AssignmentController.getAssignmentsByClassroom` |
| GET | `/api/v1/assignments/course/{courseId}` |  | `AssignmentController.getAssignmentsByCourse` |
| POST | `/api/v1/assignments/submissions/{submissionId}/ai-grade` |  | `AiWritingGradingController.gradeSubmission` |
| GET | `/api/v1/assignments/submissions/{submissionId}/ai-grading` |  | `AiWritingGradingController.getAssessment` |
| PATCH | `/api/v1/assignments/submissions/{submissionId}/ai-grading` |  | `AiWritingGradingController.updateTeacherAssessment` |
| POST | `/api/v1/assignments/submissions/{submissionId}/ai-grading/regrade` |  | `AiWritingGradingController.regradeSubmission` |
| POST | `/api/v1/assignments/submissions/{submissionId}/grade` |  | `AssignmentController.gradeSubmission` |
| GET | `/api/v1/calendar` |  | `CalendarEventController.getEvents` |
| POST | `/api/v1/calendar` |  | `CalendarEventController.createEvent` |
| POST | `/api/v1/certificates/issue/{courseId}/{studentId}` |  | `CertificateController.issueCertificate` |
| GET | `/api/v1/certificates/my` |  | `CertificateController.getMyCertificates` |
| GET | `/api/v1/certificates/verify/{code}` |  | `CertificateController.verifyCertificate` |
| DELETE | `/api/v1/class-exams/{id}` | hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN') | `ClassExamController.unlinkExamFromClassroom` |
| PUT | `/api/v1/class-exams/{id}` | hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN') | `ClassExamController.updateClassExam` |
| GET | `/api/v1/class-exams/classroom/{classroomId}` |  | `ClassExamController.getClassExams` |
| POST | `/api/v1/class-exams/classroom/{classroomId}` | hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN') | `ClassExamController.linkExamToClassroom` |
| GET | `/api/v1/class-exams/exam/{examId}` | hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN') | `ClassExamController.getClassExamsByExamId` |
| POST | `/api/v1/class-exams/exam/{examId}/batch-sync` | hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN') | `ClassExamController.batchSyncClassExams` |
| GET | `/api/v1/classrooms/{id}/gradebook` | hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN', 'STUDENT') | `ClassroomAnalyticsController.getGradebook` |
| GET | `/api/v1/classrooms/{id}/leaderboard` |  | `ClassroomAnalyticsController.getLeaderboard` |
| POST | `/api/v1/discussions/{discussionId}/replies` |  | `DiscussionController.addReply` |
| GET | `/api/v1/discussions/{id}` |  | `DiscussionController.getDiscussion` |
| GET | `/api/v1/discussions/course/{courseId}` |  | `DiscussionController.getCourseDiscussions` |
| POST | `/api/v1/discussions/course/{courseId}` |  | `DiscussionController.createDiscussion` |
| GET | `/api/v1/files/download/{fileName:.+}` |  | `FileController.downloadFile` |
| POST | `/api/v1/files/upload` |  | `FileController.uploadFile` |
| GET | `/api/v1/students` | hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN', 'OFFICE') | `StudentProfileController.getStudents` |
| POST | `/api/v1/students` | hasAnyRole('ADMIN', 'OFFICE') | `StudentProfileController.createOrLinkProfile` |
| DELETE | `/api/v1/students/{id}` | hasAnyRole('ADMIN', 'OFFICE') | `StudentProfileController.deleteProfile` |
| PUT | `/api/v1/students/{id}` | hasAnyRole('ADMIN', 'OFFICE') | `StudentProfileController.updateProfile` |
| PUT | `/api/v1/students/{id}/classrooms` | hasAnyRole('ADMIN', 'OFFICE') | `StudentProfileController.updateStudentClassrooms` |
| DELETE | `/api/v1/students/{id}/classrooms/{classroomId}` | hasAnyRole('ADMIN', 'OFFICE') | `StudentProfileController.removeStudentFromClassroom` |
| POST | `/api/v1/students/{id}/classrooms/{classroomId}` | hasAnyRole('ADMIN', 'OFFICE') | `StudentProfileController.addStudentToClassroom` |
| DELETE | `/api/v1/students/bulk` | hasAnyRole('ADMIN', 'OFFICE') | `StudentProfileController.bulkDeleteProfiles` |
| GET | `/api/v1/students/by-classroom/{classroomId}` | hasAnyRole('ADMIN', 'OFFICE') | `StudentProfileController.getStudentsByClassroom` |
| POST | `/api/v1/students/import` | hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN', 'OFFICE') | `StudentProfileController.importStudents` |
| POST | `/api/v1/students/import-admin` | hasAnyRole('ADMIN', 'OFFICE') | `StudentProfileController.importAdminStudents` |
| POST | `/api/v1/students/import-global` | hasAnyRole('ADMIN', 'OFFICE') | `StudentProfileController.importGlobalStudents` |
| POST | `/api/v1/students/link-account` | hasRole('STUDENT') | `StudentProfileController.linkAccount` |
| POST | `/api/v1/students/register` |  | `StudentProfileController.register` |
| GET | `/api/v1/students/user/{userId}` | hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN', 'OFFICE') | `StudentProfileController.getStudentProfileByUserId` |
| GET | `/api/v1/students/verify-code` |  | `StudentProfileController.verifyStudentCode` |
| POST | `/api/vocabulary/ai/auto-fill` | hasAnyRole('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN') | `VocabularyAIController.autoFill` |
