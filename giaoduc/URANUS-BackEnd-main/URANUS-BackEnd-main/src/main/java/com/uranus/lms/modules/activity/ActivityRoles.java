package com.uranus.lms.modules.activity;

/**
 * Tập trung quy tắc phân quyền cho module hoạt động vào một chỗ.
 *
 * Hiện tại chỉ ADMIN được đăng bài. Khi cần mở cho giáo viên, đổi
 * {@link #CAN_AUTHOR} thành "hasAnyRole('ADMIN','TEACHER')" — luồng duyệt
 * DRAFT -> PENDING -> PUBLISHED đã sẵn sàng, không phải sửa gì thêm.
 */
public final class ActivityRoles {

    public static final String CAN_AUTHOR = "hasRole('ADMIN')";

    public static final String CAN_REVIEW = "hasRole('ADMIN')";

    private ActivityRoles() {
    }
}
