package com.uranus.lms.modules.certification;

import com.uranus.lms.modules.course.Course;
import com.uranus.lms.modules.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CertificateRepository extends JpaRepository<Certificate, UUID> {
    Optional<Certificate> findByUniqueCode(String uniqueCode);
    boolean existsByUserAndCourse(User user, Course course);
    Page<Certificate> findByUser(User user, Pageable pageable);
}
