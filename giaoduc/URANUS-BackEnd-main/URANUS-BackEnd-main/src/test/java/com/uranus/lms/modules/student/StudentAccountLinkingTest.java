package com.uranus.lms.modules.student;

import com.uranus.lms.exception.BadRequestException;
import com.uranus.lms.modules.auth.VerificationTokenRepository;
import com.uranus.lms.modules.classroom.ClassMemberRepository;
import com.uranus.lms.modules.classroom.ClassroomRepository;
import com.uranus.lms.modules.student.dto.RegisterWithStudentCodeRequest;
import com.uranus.lms.modules.user.Role;
import com.uranus.lms.modules.user.User;
import com.uranus.lms.modules.user.UserRepository;
import com.uranus.lms.modules.user.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class StudentAccountLinkingTest {

    @Mock
    private StudentProfileRepository studentProfileRepository;
    @Mock
    private StudentClassEnrollmentRepository studentClassEnrollmentRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private VerificationTokenRepository verificationTokenRepository;
    @Mock
    private com.uranus.lms.modules.auth.EmailService emailService;

    @InjectMocks
    private StudentProfileService studentProfileService;

    private StudentProfile studentProfile;
    private User pendingUser;

    @BeforeEach
    void setUp() {
        studentProfile = StudentProfile.builder()
                .id(UUID.randomUUID())
                .studentCode("HS001")
                .fullName("Nguyen Van A")
                .dateOfBirth(LocalDate.of(2010, 1, 1))
                .build();

        pendingUser = User.builder()
                .id(UUID.randomUUID())
                .email("test@example.com")
                .role(Role.STUDENT)
                .status(UserStatus.INACTIVE)
                .pendingStudentCode("HS001")
                .build();
    }

    @Test
    void registerWithStudentCode_SetsPendingStudentCode_DoesNotLinkProfile() {
        RegisterWithStudentCodeRequest request = new RegisterWithStudentCodeRequest();
        request.setStudentCode("HS001");
        request.setDateOfBirth("01/01/2010");
        request.setEmail("test@example.com");
        request.setPassword("password");

        when(studentProfileRepository.findByStudentCodeIgnoreCase("HS001")).thenReturn(Optional.of(studentProfile));
        when(userRepository.existsByEmail(any())).thenReturn(false);
        when(passwordEncoder.encode(any())).thenReturn("encoded");

        studentProfileService.registerWithStudentCode(request);

        assertNull(studentProfile.getUser(), "StudentProfile user_id must remain NULL during registration");
        verify(userRepository).save(argThat(u -> "HS001".equals(u.getPendingStudentCode())));
    }

    @Test
    void linkPendingAccount_LinksSuccessfully_WhenProfileUnclaimed() {
        when(studentProfileRepository.findByStudentCodeForUpdate("HS001")).thenReturn(Optional.of(studentProfile));
        when(studentClassEnrollmentRepository.findByStudentProfile(studentProfile)).thenReturn(Collections.emptyList());

        studentProfileService.linkPendingAccount(pendingUser);

        assertEquals(pendingUser, studentProfile.getUser(), "StudentProfile must be linked to User");
        assertNull(pendingUser.getPendingStudentCode(), "pendingStudentCode must be cleared");
        verify(studentProfileRepository).save(studentProfile);
    }

    @Test
    void linkPendingAccount_ThrowsException_WhenProfileAlreadyClaimed() {
        User otherUser = User.builder().id(UUID.randomUUID()).build();
        studentProfile.setUser(otherUser);

        when(studentProfileRepository.findByStudentCodeForUpdate("HS001")).thenReturn(Optional.of(studentProfile));

        BadRequestException ex = assertThrows(BadRequestException.class, () -> {
            studentProfileService.linkPendingAccount(pendingUser);
        });
        assertTrue(ex.getMessage().contains("đã được xác thực bởi một tài khoản khác"));
    }
}
