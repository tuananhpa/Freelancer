package com.uranus.lms.modules.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface VerificationTokenRepository extends JpaRepository<VerificationToken, UUID> {
    Optional<VerificationToken> findByToken(String token);
    Optional<VerificationToken> findByUser_Email(String email);
    Optional<VerificationToken> findByUser_EmailAndToken(String email, String token);
    void deleteByUser_Id(UUID userId);
}
