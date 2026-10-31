package com.uranus.lms.modules.resource;

import com.uranus.lms.modules.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ResourceSubmissionRepository extends JpaRepository<ResourceSubmission, UUID> {

    Optional<ResourceSubmission> findByResourceAndStudent(ContentResource resource, User student);

    List<ResourceSubmission> findByResourceOrderBySubmittedAtDesc(ContentResource resource);

    long countByResourceAndStatus(ContentResource resource, String status);
}
