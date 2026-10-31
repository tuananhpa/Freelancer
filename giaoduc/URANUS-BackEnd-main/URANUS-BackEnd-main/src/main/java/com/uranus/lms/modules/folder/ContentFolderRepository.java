package com.uranus.lms.modules.folder;

import com.uranus.lms.modules.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.UUID;

@Repository
public interface ContentFolderRepository extends JpaRepository<ContentFolder, UUID> {
    Page<ContentFolder> findByOwnerOrderByCreatedAtDesc(User owner, Pageable pageable);
}
