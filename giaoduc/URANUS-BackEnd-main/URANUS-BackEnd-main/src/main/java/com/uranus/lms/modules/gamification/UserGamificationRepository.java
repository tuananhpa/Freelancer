package com.uranus.lms.modules.gamification;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface UserGamificationRepository extends JpaRepository<UserGamification, UUID> {
}
