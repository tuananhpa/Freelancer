package com.uranus.lms.modules.assignment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WritingAssessmentVersionRepository extends JpaRepository<WritingAssessmentVersion, UUID> {

    List<WritingAssessmentVersion> findByAssessmentOrderByVersionDesc(WritingAssessment assessment);

    List<WritingAssessmentVersion> findByAssessmentIdOrderByVersionDesc(UUID assessmentId);
}
