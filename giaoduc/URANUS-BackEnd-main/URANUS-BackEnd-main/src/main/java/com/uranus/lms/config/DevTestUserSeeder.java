package com.uranus.lms.config;

import com.uranus.lms.modules.user.AuthProvider;
import com.uranus.lms.modules.user.Role;
import com.uranus.lms.modules.user.User;
import com.uranus.lms.modules.user.UserRepository;
import com.uranus.lms.modules.user.UserStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Profile("!prod")
@Order(1)
@RequiredArgsConstructor
@Slf4j
public class DevTestUserSeeder implements CommandLineRunner {

    private static final String DEFAULT_PASSWORD = "123456";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        ensureUser("admin@uranus.com", "Admin System", Role.ADMIN);
        ensureUser("teacher1@uranus.com", "Bùi Đức Hoàng", Role.TEACHER);
        ensureUser("teacher2@uranus.com", "Nguyễn Bi Anh", Role.TEACHER);
        ensureUser("teacher3@uranus.com", "Hoàng Anh", Role.TEACHER);
        ensureUser("student1@uranus.com", "Học sinh 1", Role.STUDENT);
        ensureUser("student2@uranus.com", "Học sinh 2", Role.STUDENT);
        ensureUser("student3@uranus.com", "Học sinh 3", Role.STUDENT);
    }

    private void ensureUser(String email, String fullName, Role role) {
        if (userRepository.findByEmail(email).isPresent()) {
            return;
        }

        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(DEFAULT_PASSWORD))
                .fullName(fullName)
                .role(role)
                .status(UserStatus.ACTIVE)
                .authProvider(AuthProvider.LOCAL)
                .build();
        userRepository.save(user);
        log.info("Created dev test user {} ({}) with password {}", email, role, DEFAULT_PASSWORD);
    }
}
