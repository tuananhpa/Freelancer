package com.uranus.lms.modules.access;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public class AccessPreviewRepositoryImpl implements AccessPreviewRepository {

    @PersistenceContext
    private EntityManager em;

    @Override
    @SuppressWarnings("unchecked")
    public List<UUID> findExamPreviewIds(String subjectKey, UUID teacherId, Pageable pageable) {
        boolean emptySubject = subjectKey == null || subjectKey.isBlank() || "khac".equals(subjectKey);
        String jpql = emptySubject
                ? """
                  SELECT e.id FROM Exam e
                  WHERE e.isPublished = true AND e.isPublic = true
                    AND e.teacher.id = :teacherId
                    AND (e.subject IS NULL OR TRIM(e.subject) = '')
                  ORDER BY e.createdAt DESC
                  """
                : """
                  SELECT e.id FROM Exam e
                  WHERE e.isPublished = true AND e.isPublic = true
                    AND e.teacher.id = :teacherId
                    AND LOWER(TRIM(e.subject)) = :subject
                  ORDER BY e.createdAt DESC
                  """;
        var query = em.createQuery(jpql);
        query.setParameter("teacherId", teacherId);
        if (!emptySubject) {
            query.setParameter("subject", subjectKey);
        }
        query.setMaxResults(pageable.getPageSize());
        return query.getResultList();
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<UUID> findDeckPreviewIds(String subjectKey, UUID teacherId, Pageable pageable) {
        boolean emptySubject = subjectKey == null || subjectKey.isBlank() || "khac".equals(subjectKey);
        String jpql = emptySubject
                ? """
                  SELECT d.id FROM FlashcardDeck d
                  WHERE d.isPublic = true
                    AND d.owner.id = :teacherId
                    AND (d.subject IS NULL OR TRIM(d.subject) = '')
                  ORDER BY d.createdAt DESC
                  """
                : """
                  SELECT d.id FROM FlashcardDeck d
                  WHERE d.isPublic = true
                    AND d.owner.id = :teacherId
                    AND LOWER(TRIM(d.subject)) = :subject
                  ORDER BY d.createdAt DESC
                  """;
        var query = em.createQuery(jpql);
        query.setParameter("teacherId", teacherId);
        if (!emptySubject) {
            query.setParameter("subject", subjectKey);
        }
        query.setMaxResults(pageable.getPageSize());
        return query.getResultList();
    }
}
