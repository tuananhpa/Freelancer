package com.uranus.lms.modules.user.dto;

import com.uranus.lms.modules.user.UserStatus;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class BulkUserStatusUpdateRequest {
    private List<UUID> userIds;
    private UserStatus status;
}
