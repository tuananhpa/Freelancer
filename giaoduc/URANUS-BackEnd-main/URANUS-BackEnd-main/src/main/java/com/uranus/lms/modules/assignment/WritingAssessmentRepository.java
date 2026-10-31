package com.uranus.lms.modules.assignment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WritingAssessmentRepository extends JpaRepository<WritingAssessment, UUID> {

    Optional<WritingAssessment> findBySubmissionId(UUID submissionId);

    Optional<WritingAssessment> findBySubmission(AssignmentSubmission submission);

    List<WritingAssessment> findByAssignmentId(UUID assignmentId);

    List<WritingAssessment> findByAssignmentIdAndStatus(UUID assignmentId, String status);

    List<WritingAssessment> findBySubmissionIdIn(List<UUID> submissionIds);
}
