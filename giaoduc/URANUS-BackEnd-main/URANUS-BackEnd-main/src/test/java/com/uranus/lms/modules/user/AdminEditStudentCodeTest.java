package com.uranus.lms.modules.user;

import com.uranus.lms.exception.BadRequestException;
import com.uranus.lms.modules.student.StudentProfile;
import com.uranus.lms.modules.student.StudentProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AdminEditStudentCodeTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private StudentProfileRepository studentProfileRepository;

    @InjectMocks
    private UserService userService;

    private User activeStudent;
    private User pendingStudent;
    private User adminUser;
    private StudentProfile profile;

    @BeforeEach
    void setUp() {
        activeStudent = User.builder()
                .id(UUID.randomUUID())
                .role(Role.STUDENT)
                .status(UserStatus.ACTIVE)
                .build();

        pendingStudent = User.builder()
                .id(UUID.randomUUID())
                .role(Role.STUDENT)
                .status(UserStatus.INACTIVE)
                .pendingStudentCode("HS001")
                .build();

        adminUser = User.builder()
                .id(UUID.randomUUID())
                .role(Role.ADMIN)
                .status(UserStatus.ACTIVE)
                .build();

        profile = StudentProfile.builder()
                .id(UUID.randomUUID())
                .studentCode("HS001")
                .user(activeStudent)
                .build();
    }

    @Test
    void updateStudentCode_Success() {
        when(userRepository.findById(activeStudent.getId())).thenReturn(Optional.of(activeStudent));
        when(studentProfileRepository.findByUser_Id(activeStudent.getId())).thenReturn(Optional.of(profile));
        when(studentProfileRepository.existsByStudentCode("HS015")).thenReturn(false);

        User result = userService.updateStudentCode(activeStudent.getId(), "HS015");

        assertEquals("HS015", profile.getStudentCode());
        verify(studentProfileRepository).save(profile);
    }

    @Test
    void updateStudentCode_FailsForNonStudent() {
        when(userRepository.findById(adminUser.getId())).thenReturn(Optional.of(adminUser));

        com.uranus.lms.exception.BadRequestException ex = assertThrows(com.uranus.lms.exception.BadRequestException.class, () -> {
            userService.updateStudentCode(adminUser.getId(), "HS015");
        });
        assertTrue(ex.getMessage().contains("vai trò STUDENT"));
    }

    @Test
    void updateStudentCode_FailsIfPendingRegistration() {
        when(userRepository.findById(pendingStudent.getId())).thenReturn(Optional.of(pendingStudent));

        com.uranus.lms.exception.BadRequestException ex = assertThrows(com.uranus.lms.exception.BadRequestException.class, () -> {
            userService.updateStudentCode(pendingStudent.getId(), "HS015");
        });
        assertTrue(ex.getMessage().contains("chờ xác thực"));
    }

    @Test
    void updateStudentCode_FailsIfDuplicate() {
        when(userRepository.findById(activeStudent.getId())).thenReturn(Optional.of(activeStudent));
        when(studentProfileRepository.findByUser_Id(activeStudent.getId())).thenReturn(Optional.of(profile));
        when(studentProfileRepository.existsByStudentCode("HS015")).thenReturn(true);

        com.uranus.lms.exception.BadRequestException ex = assertThrows(com.uranus.lms.exception.BadRequestException.class, () -> {
            userService.updateStudentCode(activeStudent.getId(), "HS015");
        });
        assertTrue(ex.getMessage().contains("đã được sử dụng"));
    }
}
