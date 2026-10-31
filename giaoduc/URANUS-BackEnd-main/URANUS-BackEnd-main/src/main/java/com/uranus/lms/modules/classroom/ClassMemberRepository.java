package com.uranus.lms.modules.classroom;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ClassMemberRepository extends JpaRepository<ClassMember, UUID> {
    Optional<ClassMember> findByClassroomIdAndUserId(UUID classroomId, UUID userId);
    boolean existsByClassroomIdAndUserId(UUID classroomId, UUID userId);
    Page<ClassMember> findByUserId(UUID userId, Pageable pageable);
    @Query("SELECT m FROM ClassMember m WHERE m.user.id = :userId AND m.classroom.status = 'ACTIVE'")
    Page<ClassMember> findActiveByUserId(@Param("userId") UUID userId, Pageable pageable);
    List<ClassMember> findByClassroomId(UUID classroomId);

    @Query("SELECT m FROM ClassMember m JOIN FETCH m.classroom c LEFT JOIN FETCH c.teacher WHERE m.user.id = :userId")
    List<ClassMember> findByUserIdWithClassroom(@Param("userId") UUID userId);

    boolean existsByClassroomIdAndUserIdAndRole(UUID classroomId, UUID userId, ClassMemberRole role);
}
