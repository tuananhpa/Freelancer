package com.uranus.lms.modules.resource;

import com.uranus.lms.modules.folder.ContentFolder;
import com.uranus.lms.modules.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ResourceBookmarkRepository extends JpaRepository<ResourceBookmark, UUID> {

    Optional<ResourceBookmark> findByUserAndResource(User user, ContentResource resource);

    boolean existsByUserAndResource(User user, ContentResource resource);

    void deleteByUserAndResource(User user, ContentResource resource);

    Page<ResourceBookmark> findByUserOrderBySavedAtDesc(User user, Pageable pageable);

    List<ResourceBookmark> findByUserAndFolder(User user, ContentFolder folder);

    long countByFolder(ContentFolder folder);
}
