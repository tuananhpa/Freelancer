package com.uranus.lms.modules.classroom.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ClassroomResponse {
    private UUID id;
    private String name;
    private String section;
    private String subject;
    private String inviteCode;
    private UUID teacherId;
    private String teacherName;
    private String teacherAvatar;
    private Integer memberCount;
    private String status;
    private Boolean leaderboardEnabled;
    private String meetingLink;
    private String thumbnail;
    private Boolean isAdminGroup;
    private LocalDateTime createdAt;

    /** Số bài tập/đề thi cần nộp trong 30 ngày tới (với học sinh) hoặc đang mở (với giáo viên) */
    private Long pendingCount;

    /** Deadline gần nhất sắp đến của lớp */
    private LocalDateTime nearestDeadline;

    /** Tên của bài tập hoặc đề thi có deadline gần nhất */
    private String nearestTaskTitle;

    /** Loại bài gần nhất: ASSIGNMENT hoặc EXAM */
    private String nearestTaskType;
}

