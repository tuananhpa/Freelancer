package com.uranus.lms.modules.assignment;

import com.uranus.lms.modules.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AssignmentSubmissionRepository extends JpaRepository<AssignmentSubmission, UUID> {
    Page<AssignmentSubmission> findByAssignment(Assignment assignment, Pageable pageable);
    List<AssignmentSubmission> findByAssignmentOrderBySubmittedAtDesc(Assignment assignment);
    List<AssignmentSubmission> findByAssignmentIn(List<Assignment> assignments);
    Optional<AssignmentSubmission> findByAssignmentAndStudent(Assignment assignment, User student);
    Page<AssignmentSubmission> findByStudent(User student, Pageable pageable);
}
