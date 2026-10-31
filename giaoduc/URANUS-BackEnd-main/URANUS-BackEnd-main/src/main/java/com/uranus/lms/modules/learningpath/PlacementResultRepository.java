package com.uranus.lms.modules.learningpath;

import com.uranus.lms.modules.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PlacementResultRepository extends JpaRepository<PlacementResult, UUID> {
    Optional<PlacementResult> findByUser(User user);
}
