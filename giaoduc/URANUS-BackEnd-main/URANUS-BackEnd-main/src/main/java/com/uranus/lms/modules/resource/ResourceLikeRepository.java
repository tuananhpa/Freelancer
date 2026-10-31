package com.uranus.lms.modules.resource;

import com.uranus.lms.modules.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ResourceLikeRepository extends JpaRepository<ResourceLike, UUID> {

    Optional<ResourceLike> findByUserAndResource(User user, ContentResource resource);

    boolean existsByUserAndResource(User user, ContentResource resource);

    void deleteByUserAndResource(User user, ContentResource resource);
}
