package com.uranus.lms.modules.activity;

import com.uranus.lms.exception.BadRequestException;
import com.uranus.lms.exception.ResourceNotFoundException;
import com.uranus.lms.modules.activity.dto.ActivityRequest;
import com.uranus.lms.modules.activity.dto.ActivityResponse;
import com.uranus.lms.modules.activity.dto.PublicActivityResponse;
import com.uranus.lms.modules.user.User;
import com.uranus.lms.modules.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class ActivityService {

    private static final Pattern NON_LATIN = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s]+");
    private static final Pattern EDGE_DASHES = Pattern.compile("(^-+|-+$)");

    private final ActivityRepository activityRepository;
    private final UserRepository userRepository;

    // ---------- Công khai ----------

    public Page<PublicActivityResponse> getPublicActivities(ActivityCategory category, Pageable pageable) {
        Page<Activity> page = category == null
                ? activityRepository.findByStatusOrderByPinnedDescPublishedAtDesc(
                        ActivityStatus.PUBLISHED, pageable)
                : activityRepository.findByStatusAndCategoryOrderByPinnedDescPublishedAtDesc(
                        ActivityStatus.PUBLISHED, category, pageable);

        return page.map(this::toPublicResponse);
    }

    @Transactional
    public PublicActivityResponse getPublicActivityBySlug(String slug) {
        Activity activity = activityRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hoạt động"));

        if (activity.getStatus() != ActivityStatus.PUBLISHED) {
            throw new ResourceNotFoundException("Không tìm thấy hoạt động");
        }

        activity.setViewCount(activity.getViewCount() + 1);
        return toPublicResponse(activity);
    }

    // ---------- Quản trị ----------

    public Page<ActivityResponse> getForManagement(ActivityStatus status, ActivityCategory category, Pageable pageable) {
        Page<Activity> page;
        if (status != null && category != null) {
            page = activityRepository.findByStatusAndCategoryOrderByPinnedDescCreatedAtDesc(status, category, pageable);
        } else if (status != null) {
            page = activityRepository.findByStatusOrderByPinnedDescCreatedAtDesc(status, pageable);
        } else if (category != null) {
            page = activityRepository.findByCategoryOrderByPinnedDescCreatedAtDesc(category, pageable);
        } else {
            page = activityRepository.findAllByOrderByPinnedDescCreatedAtDesc(pageable);
        }

        return page.map(this::toResponse);
    }

    public ActivityResponse getById(UUID id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional
    public ActivityResponse create(ActivityRequest request, String email) {
        User author = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        Activity activity = Activity.builder()
                .title(request.getTitle().trim())
                .slug(generateUniqueSlug(request.getTitle()))
                .summary(request.getSummary())
                .content(request.getContent())
                .coverImageUrl(request.getCoverImageUrl())
                .images(request.getImages() != null ? request.getImages() : new ArrayList<>())
                .category(request.getCategory() != null ? request.getCategory() : ActivityCategory.NEWS)
                .status(ActivityStatus.DRAFT)
                .pinned(Boolean.TRUE.equals(request.getPinned()))
                .author(author)
                .build();

        return toResponse(activityRepository.save(activity));
    }

    @Transactional
    public ActivityResponse update(UUID id, ActivityRequest request) {
        Activity activity = findOrThrow(id);

        if (!activity.getTitle().equalsIgnoreCase(request.getTitle().trim())) {
            activity.setSlug(generateUniqueSlug(request.getTitle()));
        }
        activity.setTitle(request.getTitle().trim());
        activity.setSummary(request.getSummary());
        activity.setContent(request.getContent());
        activity.setCoverImageUrl(request.getCoverImageUrl());
        activity.setImages(request.getImages() != null ? request.getImages() : new ArrayList<>());
        if (request.getCategory() != null) {
            activity.setCategory(request.getCategory());
        }
        if (request.getPinned() != null) {
            activity.setPinned(request.getPinned());
        }

        return toResponse(activityRepository.save(activity));
    }

    /** Gửi bài chờ duyệt. */
    @Transactional
    public ActivityResponse submitForReview(UUID id) {
        Activity activity = findOrThrow(id);

        if (activity.getStatus() == ActivityStatus.PUBLISHED) {
            throw new BadRequestException("Bài đã được đăng công khai.");
        }

        activity.setStatus(ActivityStatus.PENDING);
        activity.setReviewNote(null);
        return toResponse(activityRepository.save(activity));
    }

    /** Duyệt và đăng công khai. */
    @Transactional
    public ActivityResponse approve(UUID id, String note, String reviewerEmail) {
        Activity activity = findOrThrow(id);

        if (activity.getStatus() == ActivityStatus.PUBLISHED) {
            throw new BadRequestException("Bài đã được đăng công khai.");
        }

        User reviewer = userRepository.findByEmail(reviewerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        activity.setStatus(ActivityStatus.PUBLISHED);
        activity.setReviewedBy(reviewer);
        activity.setReviewNote(note);
        if (activity.getPublishedAt() == null) {
            activity.setPublishedAt(LocalDateTime.now());
        }

        return toResponse(activityRepository.save(activity));
    }

    /** Trả bài về nháp kèm lý do. */
    @Transactional
    public ActivityResponse reject(UUID id, String note, String reviewerEmail) {
        Activity activity = findOrThrow(id);

        if (activity.getStatus() != ActivityStatus.PENDING) {
            throw new BadRequestException("Chỉ có thể trả lại bài đang chờ duyệt.");
        }

        User reviewer = userRepository.findByEmail(reviewerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        activity.setStatus(ActivityStatus.DRAFT);
        activity.setReviewedBy(reviewer);
        activity.setReviewNote(note);
        return toResponse(activityRepository.save(activity));
    }

    /** Gỡ bài khỏi trang công khai. */
    @Transactional
    public ActivityResponse archive(UUID id) {
        Activity activity = findOrThrow(id);
        activity.setStatus(ActivityStatus.ARCHIVED);
        return toResponse(activityRepository.save(activity));
    }

    @Transactional
    public ActivityResponse setPinned(UUID id, boolean pinned) {
        Activity activity = findOrThrow(id);
        activity.setPinned(pinned);
        return toResponse(activityRepository.save(activity));
    }

    @Transactional
    public void delete(UUID id) {
        activityRepository.delete(findOrThrow(id));
    }

    public long countPendingReview() {
        return activityRepository.countByStatus(ActivityStatus.PENDING);
    }

    // ---------- Helpers ----------

    private Activity findOrThrow(UUID id) {
        return activityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hoạt động"));
    }

    /**
     * Sinh slug từ tiêu đề tiếng Việt: "Lễ khai giảng 2026" -> "le-khai-giang-2026".
     * Nếu trùng thì nối thêm hậu tố ngắn để đảm bảo duy nhất.
     */
    private String generateUniqueSlug(String title) {
        String base = slugify(title);
        if (base.isEmpty()) {
            base = "hoat-dong";
        }

        String slug = base;
        while (activityRepository.existsBySlug(slug)) {
            slug = base + "-" + UUID.randomUUID().toString().substring(0, 6);
        }
        return slug;
    }

    private String slugify(String input) {
        String withoutD = input.replace('đ', 'd').replace('Đ', 'D');
        String normalized = Normalizer.normalize(withoutD, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        String slug = WHITESPACE.matcher(normalized.trim()).replaceAll("-");
        slug = NON_LATIN.matcher(slug).replaceAll("");
        slug = EDGE_DASHES.matcher(slug).replaceAll("");
        slug = slug.toLowerCase(Locale.ROOT);
        return slug.length() > 200 ? slug.substring(0, 200) : slug;
    }

    private ActivityResponse toResponse(Activity a) {
        return ActivityResponse.builder()
                .id(a.getId())
                .title(a.getTitle())
                .slug(a.getSlug())
                .summary(a.getSummary())
                .content(a.getContent())
                .coverImageUrl(a.getCoverImageUrl())
                .images(safeImages(a))
                .category(a.getCategory())
                .status(a.getStatus())
                .pinned(a.isPinned())
                .authorName(a.getAuthor() != null ? a.getAuthor().getFullName() : null)
                .reviewNote(a.getReviewNote())
                .publishedAt(a.getPublishedAt())
                .viewCount(a.getViewCount())
                .createdAt(a.getCreatedAt())
                .updatedAt(a.getUpdatedAt())
                .build();
    }

    private PublicActivityResponse toPublicResponse(Activity a) {
        return PublicActivityResponse.builder()
                .id(a.getId())
                .title(a.getTitle())
                .slug(a.getSlug())
                .summary(a.getSummary())
                .content(a.getContent())
                .coverImageUrl(a.getCoverImageUrl())
                .images(safeImages(a))
                .category(a.getCategory())
                .pinned(a.isPinned())
                .authorName(a.getAuthor() != null ? a.getAuthor().getFullName() : null)
                .publishedAt(a.getPublishedAt())
                .viewCount(a.getViewCount())
                .build();
    }

    private List<String> safeImages(Activity a) {
        return a.getImages() != null ? a.getImages() : new ArrayList<>();
    }
}
