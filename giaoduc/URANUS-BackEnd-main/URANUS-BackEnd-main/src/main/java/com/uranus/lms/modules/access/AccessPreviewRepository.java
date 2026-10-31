package com.uranus.lms.modules.access;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Native-ish JPQL helpers for preview unlock ranking.
 * Implemented as a Spring Data fragment via Exam + Flashcard deck repos would couple modules;
 * this facade uses EntityManager through dedicated query interfaces below.
 */
public interface AccessPreviewRepository {
    List<UUID> findExamPreviewIds(String subjectKey, UUID teacherId, Pageable pageable);
    List<UUID> findDeckPreviewIds(String subjectKey, UUID teacherId, Pageable pageable);
}
