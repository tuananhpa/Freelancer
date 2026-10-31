-- Schema D1 sinh tự động từ 58 entity + migration Flyway của backend Java (tools/extract-schema.mjs).
-- Kiểu: uuid/varchar/timestamp/json -> TEXT, bool -> INTEGER 0/1. Không sửa tay; chạy lại script.
PRAGMA foreign_keys = ON;

CREATE TABLE "activities" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "summary" TEXT,
  "content" TEXT,
  "cover_image_url" TEXT,
  "images" TEXT,
  "category" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "pinned" INTEGER NOT NULL,
  "author_id" TEXT NOT NULL,
  "reviewed_by" TEXT,
  "review_note" TEXT,
  "published_at" TEXT,
  "view_count" INTEGER NOT NULL,
  "created_at" TEXT,
  "updated_at" TEXT,
  UNIQUE ("slug"),
  FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE,
  FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX "idx_activities_category" ON "activities" ("category");
CREATE INDEX "idx_activities_public" ON "activities" ("status", "pinned" DESC, "published_at" DESC);

CREATE TABLE "assignment_submissions" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "assignment_id" TEXT NOT NULL,
  "student_id" TEXT NOT NULL,
  "content" TEXT,
  "file_url" TEXT,
  "score" REAL,
  "feedback" TEXT,
  "status" TEXT,
  "submitted_at" TEXT,
  "graded_at" TEXT,
  UNIQUE ("assignment_id", "student_id"),
  FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id"),
  FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE "assignments" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "attachment_url" TEXT,
  "due_date" TEXT,
  "max_score" REAL NOT NULL,
  "assignment_type" TEXT,
  "instructions" TEXT,
  "min_word_count" INTEGER,
  "max_word_count" INTEGER,
  "expected_answer" TEXT,
  "language_level" TEXT,
  "rubric_config" TEXT,
  "course_id" TEXT,
  "classroom_id" TEXT,
  "teacher_id" TEXT NOT NULL,
  "created_at" TEXT,
  FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id"),
  FOREIGN KEY ("course_id") REFERENCES "courses"("id"),
  FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX "idx_assignments_classroom_id" ON "assignments" ("classroom_id");

CREATE TABLE "attendances" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "classroom_id" TEXT NOT NULL,
  "student_id" TEXT NOT NULL,
  "attendance_date" TEXT NOT NULL,
  "week_number" INTEGER NOT NULL,
  "session_number" INTEGER NOT NULL,
  "status" TEXT NOT NULL,
  "recorded_by" TEXT NOT NULL,
  "created_at" TEXT,
  UNIQUE ("classroom_id", "student_id", "week_number", "session_number"),
  UNIQUE ("classroom_id", "student_id", "week_number", "session_number"),
  FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id"),
  FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE CASCADE,
  FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE "audit_logs" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "user_id" TEXT,
  "action" TEXT NOT NULL,
  "entity_name" TEXT NOT NULL,
  "entity_id" TEXT NOT NULL,
  "previous_state" TEXT,
  "new_state" TEXT,
  "ip_address" TEXT,
  "created_at" TEXT,
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX "idx_audit_created_at" ON "audit_logs" ("created_at");
CREATE INDEX "idx_audit_entity" ON "audit_logs" ("entity_name", "entity_id");
CREATE INDEX "idx_audit_user" ON "audit_logs" ("user_id");

CREATE TABLE "calendar_events" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "course_id" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "event_type" TEXT NOT NULL,
  "start_time" TEXT NOT NULL,
  "end_time" TEXT,
  "meeting_link" TEXT,
  "created_at" TEXT,
  "updated_at" TEXT,
  FOREIGN KEY ("course_id") REFERENCES "courses"("id")
);
CREATE INDEX "idx_calendar_event_course" ON "calendar_events" ("course_id");
CREATE INDEX "idx_calendar_event_start" ON "calendar_events" ("start_time");

CREATE TABLE "certificates" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "user_id" TEXT NOT NULL,
  "course_id" TEXT NOT NULL,
  "issue_date" TEXT,
  "unique_code" TEXT NOT NULL,
  "pdf_url" TEXT,
  UNIQUE ("unique_code"),
  UNIQUE ("user_id", "course_id"),
  FOREIGN KEY ("course_id") REFERENCES "courses"("id"),
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE "class_exams" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "classroom_id" TEXT NOT NULL,
  "exam_id" TEXT NOT NULL,
  "open_time" TEXT,
  "close_time" TEXT,
  "folder_id" TEXT,
  "created_at" TEXT,
  FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id"),
  FOREIGN KEY ("exam_id") REFERENCES "exams"("id")
);
CREATE INDEX "idx_class_exams_classroom_id" ON "class_exams" ("classroom_id");

CREATE TABLE "class_folders" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "name" TEXT NOT NULL,
  "classroom_id" TEXT NOT NULL,
  "parent_id" TEXT,
  "created_at" TEXT,
  FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id"),
  FOREIGN KEY ("parent_id") REFERENCES "class_folders"("id"),
  FOREIGN KEY ("parent_id") REFERENCES "class_folders"("id") ON DELETE CASCADE
);
CREATE INDEX "idx_class_folders_parent" ON "class_folders" ("parent_id");

CREATE TABLE "class_members" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "classroom_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "joined_at" TEXT,
  UNIQUE ("classroom_id", "user_id"),
  FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id"),
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE "class_post_comment_likes" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "comment_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "created_at" TEXT,
  FOREIGN KEY ("comment_id") REFERENCES "class_post_comments"("id"),
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE "class_post_comments" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "post_id" TEXT NOT NULL,
  "author_id" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "created_at" TEXT,
  "parent_id" TEXT,
  FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE,
  FOREIGN KEY ("parent_id") REFERENCES "class_post_comments"("id"),
  FOREIGN KEY ("post_id") REFERENCES "class_posts"("id")
);
CREATE INDEX "idx_class_post_comments_post" ON "class_post_comments" ("post_id");

CREATE TABLE "class_post_likes" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "post_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "created_at" TEXT,
  FOREIGN KEY ("post_id") REFERENCES "class_posts"("id"),
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE "class_posts" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "classroom_id" TEXT NOT NULL,
  "author_id" TEXT NOT NULL,
  "type" TEXT,
  "content" TEXT NOT NULL,
  "created_at" TEXT,
  "attachments" TEXT,
  FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE,
  FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id")
);

CREATE TABLE "class_resources" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "classroom_id" TEXT NOT NULL,
  "folder_id" TEXT,
  "resource_type" TEXT NOT NULL,
  "resource_id" TEXT NOT NULL,
  "created_at" TEXT,
  FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id")
);

CREATE TABLE "classroom_courses" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "classroom_id" TEXT NOT NULL,
  "course_id" TEXT NOT NULL,
  "linked_at" TEXT,
  FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id"),
  FOREIGN KEY ("course_id") REFERENCES "courses"("id")
);
CREATE INDEX "idx_classroom_courses_classroom" ON "classroom_courses" ("classroom_id");

CREATE TABLE "classrooms" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "name" TEXT NOT NULL,
  "section" TEXT,
  "subject" TEXT,
  "invite_code" TEXT NOT NULL,
  "teacher_id" TEXT,
  "is_admin_group" INTEGER NOT NULL,
  "status" TEXT,
  "leaderboard_enabled" INTEGER,
  "meeting_link" TEXT,
  "thumbnail" TEXT,
  "created_at" TEXT,
  UNIQUE ("invite_code"),
  FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE "content_folders" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "color" TEXT,
  "owner_id" TEXT NOT NULL,
  "created_at" TEXT,
  FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE "content_resources" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "resource_type" TEXT NOT NULL,
  "grade" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "curriculum_book" TEXT,
  "author_name" TEXT,
  "uploader_id" TEXT NOT NULL,
  "folder_id" TEXT,
  "file_url" TEXT,
  "external_url" TEXT,
  "file_name" TEXT,
  "file_size" INTEGER,
  "file_format" TEXT,
  "attached_exam_id" TEXT,
  "audio_transcript" TEXT,
  "learning_outcomes" TEXT,
  "writing_prompt" TEXT,
  "tags" TEXT,
  "is_public" INTEGER,
  "view_count" INTEGER,
  "like_count" INTEGER,
  "bookmark_count" INTEGER,
  "created_at" TEXT,
  "updated_at" TEXT,
  FOREIGN KEY ("attached_exam_id") REFERENCES "exams"("id"),
  FOREIGN KEY ("folder_id") REFERENCES "content_folders"("id"),
  FOREIGN KEY ("uploader_id") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX "idx_content_resources_public" ON "content_resources" ("is_public");
CREATE INDEX "idx_content_resources_type_grade" ON "content_resources" ("resource_type", "grade", "subject");
CREATE INDEX "idx_content_resources_uploader" ON "content_resources" ("uploader_id");

CREATE TABLE "content_shares" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "resource_type" TEXT NOT NULL,
  "resource_id" TEXT NOT NULL,
  "share_token" TEXT NOT NULL,
  "created_by" TEXT NOT NULL,
  "expires_at" TEXT,
  "created_at" TEXT,
  UNIQUE ("share_token"),
  FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE "courses" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "thumbnail_url" TEXT,
  "teacher_id" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "created_at" TEXT,
  "updated_at" TEXT,
  FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE "deck_ratings" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "deck_id" TEXT NOT NULL,
  "student_id" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "created_at" TEXT,
  "updated_at" TEXT,
  UNIQUE ("deck_id", "student_id"),
  FOREIGN KEY ("deck_id") REFERENCES "flashcard_decks"("id") ON DELETE CASCADE,
  FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX "idx_deck_ratings_deck" ON "deck_ratings" ("deck_id");
CREATE INDEX "idx_deck_ratings_student" ON "deck_ratings" ("student_id");

CREATE TABLE "discussion_replies" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "discussion_id" TEXT NOT NULL,
  "author_id" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "is_accepted_answer" INTEGER NOT NULL,
  "created_at" TEXT,
  "updated_at" TEXT,
  FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE,
  FOREIGN KEY ("discussion_id") REFERENCES "discussions"("id")
);
CREATE INDEX "idx_reply_discussion" ON "discussion_replies" ("discussion_id");

CREATE TABLE "discussions" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "course_id" TEXT NOT NULL,
  "author_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "is_pinned" INTEGER NOT NULL,
  "is_resolved" INTEGER NOT NULL,
  "created_at" TEXT,
  "updated_at" TEXT,
  FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE,
  FOREIGN KEY ("course_id") REFERENCES "courses"("id")
);
CREATE INDEX "idx_discussion_course" ON "discussions" ("course_id");

CREATE TABLE "draft_answers" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "result_id" TEXT NOT NULL,
  "question_id" TEXT NOT NULL,
  "selected_option_id" TEXT,
  "text_response" TEXT,
  "saved_at" TEXT,
  UNIQUE ("result_id", "question_id"),
  FOREIGN KEY ("selected_option_id") REFERENCES "question_options"("id") ON DELETE CASCADE,
  FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE,
  FOREIGN KEY ("result_id") REFERENCES "student_exam_results"("id") ON DELETE CASCADE
);

CREATE TABLE "enrollments" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "student_id" TEXT NOT NULL,
  "course_id" TEXT NOT NULL,
  "enrolled_at" TEXT,
  UNIQUE ("student_id", "course_id"),
  FOREIGN KEY ("course_id") REFERENCES "courses"("id"),
  FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE "exams" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "subject" TEXT,
  "grade" TEXT,
  "exam_code" TEXT,
  "exam_type" TEXT,
  "pdf_url" TEXT,
  "audio_url" TEXT,
  "audio_tracks" TEXT,
  "access_code" TEXT,
  "duration_minutes" INTEGER NOT NULL,
  "start_time" TEXT,
  "end_time" TEXT,
  "passing_score" REAL,
  "is_published" INTEGER,
  "visibility" TEXT,
  "shuffle_questions" INTEGER,
  "review_policy" TEXT,
  "max_attempts" INTEGER,
  "teacher_id" TEXT NOT NULL,
  "folder_id" TEXT,
  "created_at" TEXT,
  "access_password" TEXT,
  "is_public" INTEGER DEFAULT 1,
  UNIQUE ("exam_code"),
  FOREIGN KEY ("folder_id") REFERENCES "content_folders"("id") ON DELETE SET NULL,
  FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE "flashcard_decks" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "visibility" TEXT,
  "access_code" TEXT,
  "owner_id" TEXT NOT NULL,
  "folder_id" TEXT,
  "created_at" TEXT,
  "tags" TEXT,
  "deck_type" TEXT,
  "subject" TEXT,
  "views_count" INTEGER,
  "saves_count" INTEGER,
  "shares_count" INTEGER,
  "image_url" TEXT,
  "average_rating" REAL,
  "rating_count" INTEGER,
  FOREIGN KEY ("folder_id") REFERENCES "content_folders"("id") ON DELETE SET NULL,
  FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE "flashcards" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "front_content" TEXT NOT NULL,
  "back_content" TEXT NOT NULL,
  "image_url" TEXT,
  "audio_url" TEXT,
  "word_type" TEXT,
  "definition_en" TEXT,
  "definition_vi" TEXT,
  "example" TEXT,
  "phonetic" TEXT,
  "example_translation" TEXT,
  "created_at" TEXT,
  "deck_id" TEXT NOT NULL,
  FOREIGN KEY ("deck_id") REFERENCES "flashcard_decks"("id") ON DELETE CASCADE
);

CREATE TABLE "lesson_comments" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "content" TEXT NOT NULL,
  "lesson_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "parent_id" TEXT,
  "created_at" TEXT,
  FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id"),
  FOREIGN KEY ("parent_id") REFERENCES "lesson_comments"("id"),
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE "lesson_progress" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "student_id" TEXT NOT NULL,
  "lesson_id" TEXT NOT NULL,
  "is_completed" INTEGER NOT NULL,
  "completed_at" TEXT,
  UNIQUE ("student_id", "lesson_id"),
  FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id"),
  FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE "lessons" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT,
  "resource_url" TEXT,
  "content_type" TEXT,
  "duration_minutes" INTEGER,
  "order_index" INTEGER NOT NULL,
  "is_free" INTEGER NOT NULL,
  "section_id" TEXT NOT NULL,
  FOREIGN KEY ("section_id") REFERENCES "sections"("id")
);

CREATE TABLE "messages_archived" (
  "id" TEXT,
  "sender_id" TEXT,
  "receiver_id" TEXT,
  "content" TEXT,
  "is_read" INTEGER,
  "is_deleted_by_sender" INTEGER,
  "is_deleted_by_receiver" INTEGER,
  "sent_at" TEXT
);

CREATE TABLE "mistake_vault_items" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "student_id" TEXT NOT NULL,
  "item_type" TEXT NOT NULL,
  "question_id" TEXT,
  "flashcard_id" TEXT,
  "content" TEXT NOT NULL,
  "correct_answer" TEXT NOT NULL,
  "wrong_answer" TEXT,
  "skill_tag" TEXT,
  "source_title" TEXT,
  "wrong_count" INTEGER NOT NULL,
  "repetitions" INTEGER NOT NULL,
  "interval_days" INTEGER NOT NULL,
  "ease_factor" REAL NOT NULL,
  "next_review_date" TEXT NOT NULL,
  "last_reviewed_at" TEXT,
  "created_at" TEXT,
  "updated_at" TEXT,
  FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX "idx_mistake_vault_student_review" ON "mistake_vault_items" ("student_id", "next_review_date");
CREATE UNIQUE INDEX "uk_mistake_vault_exam_question" ON "mistake_vault_items" ("student_id", "question_id") WHERE (question_id IS NOT NULL);
CREATE UNIQUE INDEX "uk_mistake_vault_vocab" ON "mistake_vault_items" ("student_id", "flashcard_id") WHERE (flashcard_id IS NOT NULL);

CREATE TABLE "notifications" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "user_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "is_read" INTEGER NOT NULL,
  "link" TEXT,
  "type" TEXT,
  "actor_id" TEXT,
  "actor_name" TEXT,
  "actor_avatar" TEXT,
  "entity_type" TEXT,
  "entity_id" TEXT,
  "created_at" TEXT,
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX "idx_notifications_dedup" ON "notifications" ("user_id", "entity_type", "entity_id", "type");
CREATE INDEX "idx_notifications_user_created" ON "notifications" ("user_id", "created_at" DESC);
CREATE INDEX "idx_notifications_user_unread" ON "notifications" ("user_id", "is_read", "created_at" DESC);

CREATE TABLE "password_reset_tokens" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "token" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "expiry_date" TEXT NOT NULL,
  "created_at" TEXT,
  UNIQUE ("token"),
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE "placement_results" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "user_id" TEXT NOT NULL,
  "skill_scores" TEXT NOT NULL,
  "recommended_level" TEXT,
  "completed_at" TEXT,
  UNIQUE ("user_id"),
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE "question_groups" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "exam_id" TEXT NOT NULL,
  "group_title" TEXT,
  "passage_text" TEXT,
  "audio_url" TEXT,
  "order_index" INTEGER NOT NULL,
  "created_at" TEXT,
  FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE
);

CREATE TABLE "question_options" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "content" TEXT NOT NULL,
  "is_correct" INTEGER NOT NULL,
  "question_id" TEXT NOT NULL,
  FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE
);

CREATE TABLE "questions" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "content" TEXT NOT NULL,
  "image_url" TEXT,
  "question_type" TEXT,
  "group_id" TEXT,
  "explanation" TEXT,
  "sheet_answer_type" TEXT,
  "order_index" INTEGER NOT NULL,
  "points" REAL NOT NULL,
  "skill_tag" TEXT,
  "scoring_config" TEXT,
  "exam_id" TEXT NOT NULL,
  FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE
);

CREATE TABLE "resource_bookmarks" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "user_id" TEXT NOT NULL,
  "resource_id" TEXT NOT NULL,
  "folder_id" TEXT,
  "saved_at" TEXT,
  UNIQUE ("user_id", "resource_id"),
  FOREIGN KEY ("folder_id") REFERENCES "content_folders"("id"),
  FOREIGN KEY ("resource_id") REFERENCES "content_resources"("id"),
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE "resource_likes" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "user_id" TEXT NOT NULL,
  "resource_id" TEXT NOT NULL,
  "created_at" TEXT,
  UNIQUE ("user_id", "resource_id"),
  FOREIGN KEY ("resource_id") REFERENCES "content_resources"("id"),
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE "resource_submissions" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "resource_id" TEXT NOT NULL,
  "student_id" TEXT NOT NULL,
  "content" TEXT,
  "score" REAL,
  "feedback" TEXT,
  "status" TEXT,
  "submitted_at" TEXT,
  "graded_at" TEXT,
  "graded_by" TEXT,
  UNIQUE ("resource_id", "student_id"),
  FOREIGN KEY ("graded_by") REFERENCES "users"("id") ON DELETE SET NULL,
  FOREIGN KEY ("resource_id") REFERENCES "content_resources"("id") ON DELETE CASCADE,
  FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX "idx_resource_submissions_resource" ON "resource_submissions" ("resource_id");
CREATE INDEX "idx_resource_submissions_student" ON "resource_submissions" ("student_id");

CREATE TABLE "sections" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "title" TEXT NOT NULL,
  "order_index" INTEGER NOT NULL,
  "course_id" TEXT NOT NULL,
  FOREIGN KEY ("course_id") REFERENCES "courses"("id")
);

CREATE TABLE "student_answers" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "result_id" TEXT NOT NULL,
  "question_id" TEXT,
  "selected_option_id" TEXT,
  "is_correct" INTEGER,
  "points_earned" REAL,
  "text_response" TEXT,
  "ai_feedback" TEXT,
  "ai_suggested_score" REAL,
  "reviewed" INTEGER,
  FOREIGN KEY ("selected_option_id") REFERENCES "question_options"("id") ON DELETE SET NULL,
  FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE SET NULL,
  FOREIGN KEY ("result_id") REFERENCES "student_exam_results"("id") ON DELETE CASCADE
);

CREATE TABLE "student_card_progress" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "student_id" TEXT NOT NULL,
  "card_id" TEXT NOT NULL,
  "box_level" INTEGER NOT NULL,
  "next_review_date" TEXT,
  "times_reviewed" INTEGER,
  "is_mastered" INTEGER,
  FOREIGN KEY ("card_id") REFERENCES "flashcards"("id"),
  FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE "student_class_enrollments" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "student_profile_id" TEXT NOT NULL,
  "classroom_id" TEXT NOT NULL,
  "created_at" TEXT,
  UNIQUE ("student_profile_id", "classroom_id"),
  FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id"),
  FOREIGN KEY ("student_profile_id") REFERENCES "student_profiles"("id")
);
CREATE INDEX "idx_student_class_enrollments_classroom" ON "student_class_enrollments" ("classroom_id");
CREATE INDEX "idx_student_class_enrollments_profile" ON "student_class_enrollments" ("student_profile_id");

CREATE TABLE "student_exam_results" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "version" INTEGER,
  "student_id" TEXT NOT NULL,
  "exam_id" TEXT NOT NULL,
  "started_at" TEXT,
  "submitted_at" TEXT,
  "total_score" REAL,
  "is_passed" INTEGER,
  "cheat_warning_count" INTEGER,
  "cheat_details" TEXT,
  "notify_email" TEXT,
  "exam_snapshot" TEXT,
  "created_at" TEXT,
  FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE,
  FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE "student_favorite_decks" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "student_id" TEXT NOT NULL,
  "deck_id" TEXT NOT NULL,
  "created_at" TEXT,
  UNIQUE ("student_id", "deck_id"),
  FOREIGN KEY ("deck_id") REFERENCES "flashcard_decks"("id") ON DELETE CASCADE,
  FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE "student_profiles" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "student_code" TEXT NOT NULL,
  "full_name" TEXT NOT NULL,
  "date_of_birth" TEXT,
  "phone" TEXT,
  "facility" TEXT,
  "user_id" TEXT,
  "status" TEXT NOT NULL,
  "created_at" TEXT,
  "updated_at" TEXT,
  UNIQUE ("student_code"),
  UNIQUE ("user_id"),
  UNIQUE ("user_id"),
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX "idx_student_profiles_code" ON "student_profiles" ("student_code");
CREATE INDEX "idx_student_profiles_user" ON "student_profiles" ("user_id");

CREATE TABLE "support_conversations" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "requester_id" TEXT,
  "guest_token" TEXT,
  "guest_name" TEXT,
  "guest_contact" TEXT,
  "assignee_id" TEXT,
  "status" TEXT NOT NULL,
  "subject" TEXT,
  "created_at" TEXT NOT NULL,
  "last_message_at" TEXT,
  "closed_at" TEXT,
  UNIQUE ("guest_token"),
  FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE CASCADE,
  FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX "idx_support_conv_assignee" ON "support_conversations" ("assignee_id");
CREATE INDEX "idx_support_conv_requester" ON "support_conversations" ("requester_id");
CREATE INDEX "idx_support_conv_status" ON "support_conversations" ("status", "last_message_at" DESC);

CREATE TABLE "support_messages" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "conversation_id" TEXT NOT NULL,
  "sender_id" TEXT,
  "sender_role" TEXT NOT NULL,
  "content" TEXT,
  "image_url" TEXT,
  "sent_at" TEXT NOT NULL,
  "read_at" TEXT,
  FOREIGN KEY ("conversation_id") REFERENCES "support_conversations"("id"),
  FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX "idx_support_msg_conversation" ON "support_messages" ("conversation_id", "sent_at");

CREATE TABLE "user_activity_log" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "user_id" TEXT NOT NULL,
  "activity_type" TEXT NOT NULL,
  "activity_date" TEXT NOT NULL,
  "xp_earned" INTEGER,
  "created_at" TEXT,
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX "idx_user_activity_user_date" ON "user_activity_log" ("user_id", "activity_date");

CREATE TABLE "user_favorite_exams" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "user_id" TEXT NOT NULL,
  "exam_id" TEXT NOT NULL,
  "created_at" TEXT,
  UNIQUE ("user_id", "exam_id"),
  FOREIGN KEY ("exam_id") REFERENCES "exams"("id"),
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE "user_gamification" (
  "user_id" TEXT PRIMARY KEY NOT NULL,
  "total_xp" INTEGER,
  "current_streak" INTEGER,
  "longest_streak" INTEGER,
  "last_activity_date" TEXT,
  "badges" TEXT,
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE "users" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "email" TEXT NOT NULL,
  "password" TEXT,
  "full_name" TEXT NOT NULL,
  "phone" TEXT,
  "avatar_url" TEXT,
  "role" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "auth_provider" TEXT NOT NULL,
  "created_at" TEXT,
  "updated_at" TEXT,
  "last_active_at" TEXT,
  "pending_student_code" TEXT,
  UNIQUE ("email"),
  CHECK (role IN ('ADMIN', 'TEACHER', 'STUDENT', 'OFFICE', 'TEACHING_ASSISTANT'))
);

CREATE TABLE "verification_tokens" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "token" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "expiry_date" TEXT NOT NULL,
  "created_at" TEXT,
  UNIQUE ("token"),
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE "writing_assessment_versions" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "assessment_id" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "source" TEXT NOT NULL,
  "result_json" TEXT NOT NULL,
  "overall_score" REAL,
  "created_at" TEXT,
  "created_by" TEXT,
  "note" TEXT,
  FOREIGN KEY ("assessment_id") REFERENCES "writing_assessments"("id"),
  FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX "idx_writing_versions_assessment" ON "writing_assessment_versions" ("assessment_id", "version");

CREATE TABLE "writing_assessments" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "submission_id" TEXT NOT NULL,
  "assignment_id" TEXT NOT NULL,
  "student_id" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "overall_score" REAL,
  "max_score" REAL,
  "word_count" INTEGER,
  "expected_level" TEXT,
  "estimated_level" TEXT,
  "original_ai_result_json" TEXT,
  "current_result_json" TEXT,
  "version" INTEGER NOT NULL,
  "ai_model" TEXT,
  "prompt_version" TEXT,
  "schema_version" TEXT,
  "error_message" TEXT,
  "created_at" TEXT,
  "completed_at" TEXT,
  "last_edited_at" TEXT,
  "last_edited_by" TEXT,
  UNIQUE ("submission_id"),
  FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id"),
  FOREIGN KEY ("last_edited_by") REFERENCES "users"("id") ON DELETE CASCADE,
  FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE,
  FOREIGN KEY ("submission_id") REFERENCES "assignment_submissions"("id")
);
CREATE INDEX "idx_writing_assessments_assignment" ON "writing_assessments" ("assignment_id");
CREATE INDEX "idx_writing_assessments_status" ON "writing_assessments" ("status");
CREATE INDEX "idx_writing_assessments_student" ON "writing_assessments" ("student_id");
