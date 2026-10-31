package com.uranus.lms.config;

import com.uranus.lms.modules.assignment.Assignment;
import com.uranus.lms.modules.assignment.AssignmentRepository;
import com.uranus.lms.modules.assignment.AssignmentSubmission;
import com.uranus.lms.modules.assignment.AssignmentSubmissionRepository;
import com.uranus.lms.modules.classroom.ClassMember;
import com.uranus.lms.modules.classroom.ClassMemberRepository;
import com.uranus.lms.modules.classroom.ClassMemberRole;
import com.uranus.lms.modules.classroom.Classroom;
import com.uranus.lms.modules.classroom.ClassroomRepository;
import com.uranus.lms.modules.classroom.ClassroomCourse;
import com.uranus.lms.modules.classroom.ClassroomCourseRepository;
import com.uranus.lms.modules.course.Course;
import com.uranus.lms.modules.course.CourseRepository;
import com.uranus.lms.modules.course.Section;
import com.uranus.lms.modules.course.SectionRepository;
import com.uranus.lms.modules.course.Lesson;
import com.uranus.lms.modules.course.LessonRepository;
import com.uranus.lms.modules.exam.Exam;
import com.uranus.lms.modules.exam.ExamRepository;
import com.uranus.lms.modules.flashcard.Flashcard;
import com.uranus.lms.modules.flashcard.FlashcardRepository;
import com.uranus.lms.modules.flashcard.FlashcardDeck;
import com.uranus.lms.modules.flashcard.FlashcardDeckRepository;
import com.uranus.lms.modules.user.Role;
import com.uranus.lms.modules.user.User;
import com.uranus.lms.modules.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final SectionRepository sectionRepository;
    private final LessonRepository lessonRepository;
    private final ClassroomRepository classroomRepository;
    private final ClassMemberRepository classMemberRepository;
    private final ClassroomCourseRepository classroomCourseRepository;
    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository assignmentSubmissionRepository;
    private final ExamRepository examRepository;
    private final FlashcardDeckRepository flashcardDeckRepository;
    private final FlashcardRepository flashcardRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() > 0) {
            log.info("Database is not empty. Skipping seeding.");
            return;
        }

        log.info("Starting database seeding...");

        String defaultPassword = passwordEncoder.encode("123456");

        // 1. Seed Users
        User admin = User.builder().email("admin@uranus.com").password(defaultPassword).fullName("Admin System").role(Role.ADMIN).status(com.uranus.lms.modules.user.UserStatus.ACTIVE).build();
        userRepository.save(admin);

        User office = User.builder().email("office@test.com").password(defaultPassword).fullName("Nhân viên Văn phòng").role(Role.OFFICE).status(com.uranus.lms.modules.user.UserStatus.ACTIVE).build();
        userRepository.save(office);

        User teacher1 = userRepository.save(User.builder().email("teacher1@uranus.com").password(defaultPassword).fullName("Bùi Đức Hoàng").role(Role.TEACHER).status(com.uranus.lms.modules.user.UserStatus.ACTIVE).build());
        User teacher2 = userRepository.save(User.builder().email("teacher2@uranus.com").password(defaultPassword).fullName("Nguyễn Bi Anh").role(Role.TEACHER).status(com.uranus.lms.modules.user.UserStatus.ACTIVE).build());
        User teacher3 = userRepository.save(User.builder().email("teacher3@uranus.com").password(defaultPassword).fullName("Hoàng Anh").role(Role.TEACHER).status(com.uranus.lms.modules.user.UserStatus.ACTIVE).build());
        List<User> teachers = List.of(teacher1, teacher2, teacher3);

        List<User> students = new ArrayList<>();
        for (int i = 1; i <= 3; i++) {
            User student = User.builder().email("student" + i + "@uranus.com").password(defaultPassword).fullName("Học sinh " + i).role(Role.STUDENT).status(com.uranus.lms.modules.user.UserStatus.ACTIVE).build();
            students.add(userRepository.save(student));
        }
        
        log.info("Created {} users", 1 + teachers.size() + students.size());

        // 2. Seed Courses (landing subjects only — no Lập trình)
        Course c1 = Course.builder().title("Tiếng Anh").description("Lớp Tiếng Anh").thumbnailUrl("https://placehold.co/600x400/blue/white?text=English").teacher(teacher1).status(com.uranus.lms.modules.course.CourseStatus.PUBLISHED).build();
        Course c2 = Course.builder().title("Toán").description("Lớp Toán").thumbnailUrl("https://placehold.co/600x400/green/white?text=Math").teacher(teacher1).status(com.uranus.lms.modules.course.CourseStatus.PUBLISHED).build();
        Course c3 = Course.builder().title("Vật Lý").description("Lớp Vật Lý").thumbnailUrl("https://placehold.co/600x400/orange/white?text=Physics").teacher(teacher2).status(com.uranus.lms.modules.course.CourseStatus.PUBLISHED).build();

        List<Course> courses = List.of(courseRepository.save(c1), courseRepository.save(c2), courseRepository.save(c3));

        for (Course course : courses) {
            for (int i = 1; i <= 2; i++) {
                Section section = Section.builder().course(course).title("Chương " + i).orderIndex(i).build();
                section = sectionRepository.save(section);
                for (int j = 1; j <= 2; j++) {
                    Lesson lesson = Lesson.builder().section(section).title("Bài " + j).content("Nội dung bài học " + j).orderIndex(j).contentType(com.uranus.lms.modules.course.ContentType.TEXT).build();
                    lessonRepository.save(lesson);
                }
            }
        }
        
        log.info("Created 3 courses with sections and lessons");

        // 3. Seed Classrooms — labels match ProfileEdit: `${subject} thầy ${teacherName}`
        Classroom english = Classroom.builder().name("Tiếng Anh thầy Bùi Đức Hoàng").section("Uranus").subject("Tiếng Anh").inviteCode("ENG001").teacher(teacher1).status("ACTIVE").build();
        Classroom math = Classroom.builder().name("Toán thầy Bùi Đức Hoàng").section("Uranus").subject("Toán").inviteCode("MATH01").teacher(teacher1).status("ACTIVE").build();
        Classroom physics = Classroom.builder().name("Vật Lý thầy Nguyễn Bi Anh").section("Uranus").subject("Vật Lý").inviteCode("PHY001").teacher(teacher2).status("ACTIVE").build();

        english = classroomRepository.save(english);
        math = classroomRepository.save(math);
        physics = classroomRepository.save(physics);

        classMemberRepository.save(ClassMember.builder().classroom(english).user(teacher1).role(ClassMemberRole.TEACHER).build());
        classMemberRepository.save(ClassMember.builder().classroom(math).user(teacher1).role(ClassMemberRole.TEACHER).build());
        classMemberRepository.save(ClassMember.builder().classroom(physics).user(teacher2).role(ClassMemberRole.TEACHER).build());

        // student1: all three; student2: Tiếng Anh + Toán; student3: Vật Lý
        classMemberRepository.save(ClassMember.builder().classroom(english).user(students.get(0)).role(ClassMemberRole.STUDENT).build());
        classMemberRepository.save(ClassMember.builder().classroom(math).user(students.get(0)).role(ClassMemberRole.STUDENT).build());
        classMemberRepository.save(ClassMember.builder().classroom(physics).user(students.get(0)).role(ClassMemberRole.STUDENT).build());
        classMemberRepository.save(ClassMember.builder().classroom(english).user(students.get(1)).role(ClassMemberRole.STUDENT).build());
        classMemberRepository.save(ClassMember.builder().classroom(math).user(students.get(1)).role(ClassMemberRole.STUDENT).build());
        classMemberRepository.save(ClassMember.builder().classroom(physics).user(students.get(2)).role(ClassMemberRole.STUDENT).build());

        classroomCourseRepository.save(ClassroomCourse.builder().classroom(english).course(courses.get(0)).build());
        classroomCourseRepository.save(ClassroomCourse.builder().classroom(math).course(courses.get(1)).build());
        classroomCourseRepository.save(ClassroomCourse.builder().classroom(physics).course(courses.get(2)).build());
        
        log.info("Created 3 classrooms with preferred enrollments");

        // 4. Seed Assignments & Exams
        Assignment assignment = Assignment.builder()
                .title("Bài tập: Unit 1")
                .description("Bài tập Tiếng Anh Unit 1")
                .dueDate(LocalDateTime.now().plusDays(7))
                .maxScore(100.0)
                .course(courses.get(0))
                .classroom(english)
                .teacher(teacher1)
                .build();
        assignment = assignmentRepository.save(assignment);

        Exam exam = Exam.builder()
                .title("Thi giữa kỳ Toán")
                .description("Kiểm tra kiến thức Toán")
                .teacher(teacher1)
                .durationMinutes(60)
                .passingScore(50.0)
                .visibility(com.uranus.lms.modules.access.Visibility.PUBLIC)
                .startTime(LocalDateTime.now())
                .endTime(LocalDateTime.now().plusDays(7))
                .build();
        examRepository.save(exam);

        for (int i = 0; i < students.size(); i++) {
            AssignmentSubmission submission = AssignmentSubmission.builder()
                    .assignment(assignment)
                    .student(students.get(i))
                    .content("Bài làm của học sinh " + (i + 1))
                    .status("GRADED")
                    .score(80.0 + i)
                    .feedback("Làm bài tốt")
                    .submittedAt(LocalDateTime.now())
                    .gradedAt(LocalDateTime.now())
                    .build();
            assignmentSubmissionRepository.save(submission);
        }
        
        log.info("Created assignments, exams and submissions");

        // 5. Seed Decks and Flashcards
        FlashcardDeck deck1 = FlashcardDeck.builder()
                .title("3000 Từ Vựng Tiếng Anh")
                .description("Các từ vựng thông dụng")
                .visibility(com.uranus.lms.modules.access.Visibility.PUBLIC)
                .owner(teacher1)
                .build();
        deck1 = flashcardDeckRepository.save(deck1);

        String[][] words = {{"Hello", "Xin chào"}, {"World", "Thế giới"}, {"Apple", "Quả táo"}, {"Dog", "Con chó"}, {"Cat", "Con mèo"}};
        for (String[] word : words) {
            flashcardRepository.save(Flashcard.builder().deck(deck1).frontContent(word[0]).backContent(word[1]).build());
        }
        
        log.info("Created vocabulary decks and flashcards");

        log.info("Database seeding completed successfully!");
    }
}
