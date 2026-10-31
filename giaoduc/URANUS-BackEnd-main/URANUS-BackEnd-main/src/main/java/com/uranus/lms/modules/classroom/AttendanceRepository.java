package com.uranus.lms.modules.classroom;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, UUID> {
    List<Attendance> findByClassroomAndWeekNumberAndSessionNumber(Classroom classroom, Integer weekNumber, Integer sessionNumber);
    Optional<Attendance> findByClassroomAndStudentIdAndWeekNumberAndSessionNumber(Classroom classroom, UUID studentId, Integer weekNumber, Integer sessionNumber);
}
