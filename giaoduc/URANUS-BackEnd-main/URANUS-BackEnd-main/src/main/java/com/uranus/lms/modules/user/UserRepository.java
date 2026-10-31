package com.uranus.lms.modules.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID>, JpaSpecificationExecutor<User> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<User> findByPendingStudentCode(String pendingStudentCode);
    long countByRole(Role role);

    /**
     * So tai khoan moi dang ky theo tung thang, 12 thang gan nhat.
     * Dung cho bieu do "Thong ke nguoi dung moi theo thang" o dashboard admin.
     */
    @org.springframework.data.jpa.repository.Query(value =
            "SELECT TO_CHAR(created_at, 'YYYY-MM') as month, COUNT(*) as count " +
            "FROM users " +
            "WHERE created_at >= (CURRENT_DATE - INTERVAL '12 months') " +
            "GROUP BY TO_CHAR(created_at, 'YYYY-MM') " +
            "ORDER BY month", nativeQuery = true)
    java.util.List<Object[]> countNewUsersByMonth();

    /** Nhan su dang hoat dong theo nhom quyen - dung de bao tin cho bo phan ho tro. */
    java.util.List<User> findByRoleInAndStatus(java.util.Collection<Role> roles, UserStatus status);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE User u SET u.status = :status WHERE u.id = :id")
    void updateStatus(@org.springframework.data.repository.query.Param("id") UUID id, @org.springframework.data.repository.query.Param("status") UserStatus status);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE User u SET u.password = :password WHERE u.id = :id")
    void updatePassword(@org.springframework.data.repository.query.Param("id") UUID id, @org.springframework.data.repository.query.Param("password") String password);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Query("UPDATE User u SET u.lastActiveAt = :lastActiveAt WHERE u.email = :email")
    void updateLastActiveAt(@org.springframework.data.repository.query.Param("email") String email, @org.springframework.data.repository.query.Param("lastActiveAt") java.time.LocalDateTime lastActiveAt);
}
