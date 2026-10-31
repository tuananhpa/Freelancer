package com.uranus.lms.modules.classroom;

import com.uranus.lms.common.response.ApiResponse;
import com.uranus.lms.modules.classroom.dto.AttendanceResponse;
import com.uranus.lms.modules.classroom.dto.RecordAttendanceRequest;
import org.springframework.security.core.userdetails.UserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/classes/{classId}/attendance")
@RequiredArgsConstructor
public class ClassroomAttendanceController {

    private final ClassroomAttendanceService attendanceService;

    @GetMapping
    public ResponseEntity<ApiResponse<AttendanceResponse>> getAttendance(
            @PathVariable UUID classId,
            @RequestParam Integer weekNumber,
            @RequestParam Integer sessionNumber,
            @AuthenticationPrincipal UserDetails userDetails) {
        AttendanceResponse response = attendanceService.getAttendance(classId, weekNumber, sessionNumber, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AttendanceResponse>> recordAttendance(
            @PathVariable UUID classId,
            @Valid @RequestBody RecordAttendanceRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        AttendanceResponse response = attendanceService.recordAttendance(classId, request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
