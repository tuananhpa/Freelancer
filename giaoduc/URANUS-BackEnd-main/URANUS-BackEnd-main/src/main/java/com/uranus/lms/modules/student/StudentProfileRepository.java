package com.uranus.lms.modules.student;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StudentProfileRepository extends JpaRepository<StudentProfile, UUID>, JpaSpecificationExecutor<StudentProfile> {
    Optional<StudentProfile> findByStudentCode(String studentCode);

    @Query("SELECT sp FROM StudentProfile sp WHERE LOWER(TRIM(sp.studentCode)) = LOWER(TRIM(:studentCode))")
    Optional<StudentProfile> findByStudentCodeIgnoreCase(@Param("studentCode") String studentCode);

    @Query("SELECT sp FROM StudentProfile sp LEFT JOIN FETCH sp.user WHERE LOWER(TRIM(sp.studentCode)) = LOWER(TRIM(:studentCode))")
    Optional<StudentProfile> findByStudentCodeWithUser(@Param("studentCode") String studentCode);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT sp FROM StudentProfile sp WHERE LOWER(TRIM(sp.studentCode)) = LOWER(TRIM(:studentCode))")
    Optional<StudentProfile> findByStudentCodeForUpdate(@Param("studentCode") String studentCode);

    Optional<StudentProfile> findByUser_Id(UUID userId);
    boolean existsByStudentCode(String studentCode);

    @Query("SELECT COUNT(sp) > 0 FROM StudentProfile sp WHERE LOWER(TRIM(sp.studentCode)) = LOWER(TRIM(:studentCode))")
    boolean existsByStudentCodeIgnoreCase(@Param("studentCode") String studentCode);
    Page<StudentProfile> findAll(Pageable pageable);

    @Query("SELECT sp FROM StudentProfile sp WHERE " +
           "LOWER(sp.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "sp.studentCode LIKE CONCAT('%', :keyword, '%')")
    Page<StudentProfile> searchByKeyword(String keyword, Pageable pageable);
}
