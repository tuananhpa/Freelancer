package com.uranus.lms.modules.exam;

import com.uranus.lms.modules.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StudentExamResultRepository extends JpaRepository<StudentExamResult, UUID> {

    Page<StudentExamResult> findByStudentOrderByCreatedAtDesc(User student, Pageable pageable);

    // ---------------------------------------------------------------------
    // Truy van gop cho dashboard hoc vien.
    //
    // Truoc day dashboard tai TOAN BO ket qua thi khong phan trang roi duyet
    // tung cai de doc exam.questions va answers (deu LAZY) - N+1 hang tram den
    // hang nghin query voi tai khoan co lich su that. Cac truy van duoi day tra
    // ve so lieu da tinh san, khong nap entity nao.
    // ---------------------------------------------------------------------

    /** Diem cua tung lan thi kem tong diem toi da cua de, de tinh diem trung binh. */
    interface ScoreRow {
        Double getScore();
        Double getMaxScore();
    }

    /** Tong diem dat duoc va diem toi da theo tung ky nang, cho bieu do radar. */
    interface SkillRow {
        String getSkill();
        Double getEarned();
        Double getMaxScore();
    }

    /** Mot dong trong lich su lam bai. resultId de mo lai bai da nop. */
    interface HistoryRow {
        UUID getResultId();
        String getExamTitle();
        Double getScore();
        Double getMaxScore();
        java.time.LocalDateTime getSubmittedAt();
    }

    long countByStudentAndSubmittedAtIsNotNull(User student);

    /** Loai tru ket qua con cau tu luan AI cham nhap chua duoc giao vien duyet - chua duoc tinh vao thong ke. */
    @org.springframework.data.jpa.repository.Query("""
            SELECT r.totalScore AS score,
                   (SELECT COALESCE(SUM(q.points), 0) FROM Question q WHERE q.exam = r.exam) AS maxScore
            FROM StudentExamResult r
            WHERE r.student = :student AND r.submittedAt IS NOT NULL
              AND NOT EXISTS (SELECT 1 FROM StudentAnswer pa WHERE pa.result = r
                              AND pa.question.questionType = 'ESSAY' AND pa.reviewed = false)
            """)
    List<ScoreRow> findScoreRows(@org.springframework.data.repository.query.Param("student") User student);

    @org.springframework.data.jpa.repository.Query("""
            SELECT COALESCE(q.skillTag, 'GENERAL') AS skill,
                   COALESCE(SUM(a.pointsEarned), 0) AS earned,
                   COALESCE(SUM(q.points), 0) AS maxScore
            FROM StudentAnswer a JOIN a.question q
            WHERE a.result.student = :student AND a.result.submittedAt IS NOT NULL
              AND NOT EXISTS (SELECT 1 FROM StudentAnswer pa WHERE pa.result = a.result
                              AND pa.question.questionType = 'ESSAY' AND pa.reviewed = false)
            GROUP BY q.skillTag
            """)
    List<SkillRow> findSkillTotals(@org.springframework.data.repository.query.Param("student") User student);

    /** Chi lay ngay nop de tinh chuoi ngay hoc lien tiep - khong can nap ca ban ghi. */
    @org.springframework.data.jpa.repository.Query("""
            SELECT r.submittedAt FROM StudentExamResult r
            WHERE r.student = :student AND r.submittedAt IS NOT NULL
            ORDER BY r.submittedAt DESC
            """)
    List<java.time.LocalDateTime> findSubmittedDates(@org.springframework.data.repository.query.Param("student") User student);

    @org.springframework.data.jpa.repository.Query("""
            SELECT r.id AS resultId,
                   e.title AS examTitle,
                   r.totalScore AS score,
                   (SELECT COALESCE(SUM(q.points), 0) FROM Question q WHERE q.exam = e) AS maxScore,
                   r.submittedAt AS submittedAt
            FROM StudentExamResult r LEFT JOIN r.exam e
            WHERE r.student = :student AND r.submittedAt IS NOT NULL
              AND NOT EXISTS (SELECT 1 FROM StudentAnswer pa WHERE pa.result = r
                              AND pa.question.questionType = 'ESSAY' AND pa.reviewed = false)
            ORDER BY r.submittedAt DESC
            """)
    List<HistoryRow> findRecentHistory(@org.springframework.data.repository.query.Param("student") User student,
                                       Pageable pageable);

    // Chi lay bai DA NOP: bai dang lam do (submittedAt null) khong phai lich su,
    // va truoc day chi mot ban ghi nhu vay la lam hong ca trang (NPE "temporal").
    @org.springframework.data.jpa.repository.Query("SELECT r FROM StudentExamResult r WHERE r.student = :student " +
           "AND r.submittedAt IS NOT NULL " +
           "AND (CAST(:search AS string) IS NULL OR LOWER(r.exam.title) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))) " +
           "AND (:isPassed IS NULL OR r.isPassed = :isPassed) " +
           "AND (CAST(:fromDate AS date) IS NULL OR r.submittedAt >= :fromDate) " +
           "AND (CAST(:toDate AS date) IS NULL OR r.submittedAt <= :toDate) " +
           "ORDER BY r.createdAt DESC")
    Page<StudentExamResult> findStudentHistoryWithFilters(
        @org.springframework.data.repository.query.Param("student") User student,
        @org.springframework.data.repository.query.Param("search") String search,
        @org.springframework.data.repository.query.Param("isPassed") Boolean isPassed,
        @org.springframework.data.repository.query.Param("fromDate") java.time.LocalDateTime fromDate,
        @org.springframework.data.repository.query.Param("toDate") java.time.LocalDateTime toDate,
        Pageable pageable
    );

    List<StudentExamResult> findByExam(Exam exam);

    List<StudentExamResult> findByExamIn(List<Exam> exams);

    List<StudentExamResult> findByExamOrderByTotalScoreDesc(Exam exam);

    Optional<StudentExamResult> findFirstByStudentAndExamAndSubmittedAtIsNull(User student, Exam exam);

    boolean existsByStudentAndExam(User student, Exam exam);

    Optional<StudentExamResult> findFirstByStudentAndExamAndSubmittedAtIsNotNullOrderBySubmittedAtDesc(User student, Exam exam);

    /** Số lần học sinh đã hoàn thành bài (đã nộp) → để kiểm tra maxAttempts */
    long countByStudentAndExamAndSubmittedAtIsNotNull(User student, Exam exam);

    boolean existsByExamAndSubmittedAtIsNull(Exam exam);

    List<StudentExamResult> findByExamAndSubmittedAtIsNull(Exam exam);

    /** Lấy tất cả bài đã nộp của một đề (cho Analytics) */
    List<StudentExamResult> findByExamAndSubmittedAtIsNotNull(Exam exam);

    Page<StudentExamResult> findByExamAndSubmittedAtIsNotNull(Exam exam, Pageable pageable);
}
