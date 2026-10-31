package com.uranus.lms.modules.share;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ContentShareRepository extends JpaRepository<ContentShare, UUID> {
    Optional<ContentShare> findByShareToken(String shareToken);
}
