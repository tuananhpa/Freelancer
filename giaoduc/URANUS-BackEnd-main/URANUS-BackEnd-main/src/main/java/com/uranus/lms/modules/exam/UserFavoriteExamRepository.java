package com.uranus.lms.modules.exam;

import com.uranus.lms.modules.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserFavoriteExamRepository extends JpaRepository<UserFavoriteExam, UUID> {

    Optional<UserFavoriteExam> findByUserAndExam(User user, Exam exam);

    boolean existsByUserAndExam(User user, Exam exam);

    void deleteByExam(Exam exam);

    @Query("SELECT f.exam FROM UserFavoriteExam f WHERE f.user = :user AND f.exam.isPublished = true " +
           "AND (CAST(:subject AS text) IS NULL OR f.exam.subject = CAST(:subject AS text)) " +
           "AND (CAST(:grade AS text) IS NULL OR f.exam.grade = CAST(:grade AS text)) " +
           "AND (CAST(:search AS text) IS NULL OR LOWER(f.exam.title) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%')))")
    Page<Exam> findFavoriteExamsByUser(@Param("user") User user, 
                                       @Param("search") String search, 
                                       @Param("subject") String subject, 
                                       @Param("grade") String grade, 
                                       Pageable pageable);
}
