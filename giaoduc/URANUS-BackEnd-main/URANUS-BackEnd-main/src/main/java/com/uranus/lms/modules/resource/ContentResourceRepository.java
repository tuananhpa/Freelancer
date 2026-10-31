package com.uranus.lms.modules.resource;

import com.uranus.lms.modules.folder.ContentFolder;
import com.uranus.lms.modules.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ContentResourceRepository extends JpaRepository<ContentResource, UUID>, JpaSpecificationExecutor<ContentResource> {

    Page<ContentResource> findByUploaderOrderByCreatedAtDesc(User uploader, Pageable pageable);

    Page<ContentResource> findByFolderOrderByCreatedAtDesc(ContentFolder folder, Pageable pageable);

    long countByFolder(ContentFolder folder);

    boolean existsByIdAndAttachedExamId(UUID id, UUID attachedExamId);

    @Modifying
    @Query("UPDATE ContentResource r SET r.folder = null WHERE r.folder = :folder")
    void clearFolder(@Param("folder") ContentFolder folder);

    @Modifying
    @Query("UPDATE ContentResource r SET r.viewCount = r.viewCount + 1 WHERE r.id = :id")
    void incrementViewCount(@Param("id") UUID id);

    @Modifying
    @Query("UPDATE ContentResource r SET r.likeCount = r.likeCount + :delta WHERE r.id = :id")
    void updateLikeCount(@Param("id") UUID id, @Param("delta") long delta);

    @Modifying
    @Query("UPDATE ContentResource r SET r.bookmarkCount = r.bookmarkCount + :delta WHERE r.id = :id")
    void updateBookmarkCount(@Param("id") UUID id, @Param("delta") long delta);
}
