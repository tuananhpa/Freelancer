package com.uranus.lms.modules.exam;

import com.uranus.lms.modules.user.User;
import com.uranus.lms.modules.folder.ContentFolder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExamRepository extends JpaRepository<Exam, UUID>, JpaSpecificationExecutor<Exam> {
    Page<Exam> findByTeacherAndTitleContainingIgnoreCase(User teacher, String title, Pageable pageable);

    // Teacher: lấy toàn bộ đề của mình
    Page<Exam> findByTeacherOrderByCreatedAtDesc(User teacher, Pageable pageable);

    // Public: danh sách đề đã phát hành
    Page<Exam> findByIsPublishedTrueOrderByCreatedAtDesc(Pageable pageable);

    // Tìm theo mã đề (học sinh nhập mã để vào làm bài)
    Optional<Exam> findByExamCode(String examCode);
    Optional<Exam> findByExamCodeAndIsPublishedTrue(String examCode);

    // Tìm theo tiêu đề (search)
    List<Exam> findByTitleContainingIgnoreCaseAndIsPublishedTrue(String title);

    // Kiểm tra mã đề đã tồn tại chưa (để auto-generate unique code)
    boolean existsByExamCode(String examCode);

    long countByFolder(ContentFolder folder);

    @Modifying
    @Query("UPDATE Exam e SET e.folder = null WHERE e.folder = :folder")
    void clearFolder(@Param("folder") ContentFolder folder);

    // Tương thích ngược
    default Page<Exam> findByTeacher(User teacher, Pageable pageable) {
        return findByTeacherOrderByCreatedAtDesc(teacher, pageable);
    }

    default Page<Exam> findByIsPublishedTrue(Pageable pageable) {
        return findByIsPublishedTrueOrderByCreatedAtDesc(pageable);
    }

    Page<Exam> findByTeacherAndTitleContainingIgnoreCaseOrderByCreatedAtDesc(User teacher, String title, Pageable pageable);
    
    Page<Exam> findByIsPublishedTrueAndTitleContainingIgnoreCaseOrderByCreatedAtDesc(String title, Pageable pageable);

    @Query("SELECT DISTINCT e.subject FROM Exam e WHERE e.subject IS NOT NULL AND e.subject <> '' ORDER BY e.subject ASC")
    List<String> findDistinctSubjects();
}
