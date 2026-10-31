package com.uranus.lms.modules.activity;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

/**
 * Dùng derived query thay vì JPQL có ":param IS NULL" — truyền enum null vào
 * JPQL khiến PostgreSQL không suy ra được kiểu tham số.
 * Việc lọc tuỳ chọn được xử lý bằng nhánh trong ActivityService.
 */
public interface ActivityRepository extends JpaRepository<Activity, UUID> {

    Optional<Activity> findBySlug(String slug);

    boolean existsBySlug(String slug);

    // --- Danh sách công khai: ưu tiên bài ghim, rồi mới nhất trước ---

    Page<Activity> findByStatusOrderByPinnedDescPublishedAtDesc(
            ActivityStatus status, Pageable pageable);

    Page<Activity> findByStatusAndCategoryOrderByPinnedDescPublishedAtDesc(
            ActivityStatus status, ActivityCategory category, Pageable pageable);

    // --- Danh sách quản trị: sắp theo ngày tạo để thấy bản nháp mới nhất ---

    Page<Activity> findAllByOrderByPinnedDescCreatedAtDesc(Pageable pageable);

    Page<Activity> findByStatusOrderByPinnedDescCreatedAtDesc(
            ActivityStatus status, Pageable pageable);

    Page<Activity> findByCategoryOrderByPinnedDescCreatedAtDesc(
            ActivityCategory category, Pageable pageable);

    Page<Activity> findByStatusAndCategoryOrderByPinnedDescCreatedAtDesc(
            ActivityStatus status, ActivityCategory category, Pageable pageable);

    long countByStatus(ActivityStatus status);
}
