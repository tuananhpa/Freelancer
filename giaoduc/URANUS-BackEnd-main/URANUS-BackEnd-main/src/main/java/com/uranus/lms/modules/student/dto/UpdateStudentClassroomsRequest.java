package com.uranus.lms.modules.student.dto;

import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class UpdateStudentClassroomsRequest {
    private List<UUID> classroomIds;
}
