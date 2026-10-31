package com.uranus.lms.modules.activity;

public enum ActivityStatus {
    /** Bản nháp, chỉ tác giả và admin nhìn thấy. */
    DRAFT,
    /** Đã gửi, chờ admin duyệt. */
    PENDING,
    /** Đã duyệt, hiển thị công khai trên landing page. */
    PUBLISHED,
    /** Đã gỡ khỏi trang công khai nhưng vẫn lưu lại. */
    ARCHIVED
}
