import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarDays, Pin } from 'lucide-react';
import {
  CATEGORY_LABELS,
  publicActivityApi,
  type PublicActivity,
} from '../../services/activityApi';

const formatDate = (value: string | null) => {
  if (!value) return '';
  return new Date(value).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

type ActivitiesSectionProps = {
  /** Báo cho landing page biết có bài nào để hiển thị không, để ẩn/hiện mục menu. */
  onLoaded?: (hasActivities: boolean) => void;
};

/**
 * Section "Hoạt động" trên landing page. Gọi endpoint công khai nên hiển thị
 * được cho cả khách chưa đăng nhập. Nếu chưa có bài nào đã duyệt thì tự ẩn.
 */
const ActivitiesSection = ({ onLoaded }: ActivitiesSectionProps) => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<PublicActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    publicActivityApi
      .list({ size: 6 })
      .then((res) => {
        if (cancelled) return;
        const items = res.data.content ?? [];
        setActivities(items);
        onLoaded?.(items.length > 0);
      })
      .catch(() => {
        if (cancelled) return;
        setFailed(true);
        onLoaded?.(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // onLoaded là setState của parent nên ổn định; chỉ fetch một lần khi mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Không có bài nào (hoặc API lỗi) thì ẩn hẳn section thay vì show khung rỗng.
  if (!loading && (failed || activities.length === 0)) return null;

  return (
    <section id="hoat-dong" className="landing-block activity-section scroll-mt-20">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
        <div className="landing-section-head">
          <p className="landing-kicker">Hoạt động</p>
          <h2 className="landing-heading mt-3 landing-heading--full">
            TIN TỨC VÀ SỰ KIỆN TẠI ĐIỂM SÁNG
          </h2>
          <p className="landing-body mt-5 landing-body--full">
            Cập nhật các hoạt động, sự kiện và thành tích mới nhất của trung tâm.
          </p>
        </div>

        {loading ? (
          <div className="activity-grid mt-12 sm:mt-14">
            {[0, 1, 2].map((i) => (
              <div key={i} className="activity-card activity-card--skeleton" aria-hidden="true">
                <div className="activity-card-media activity-skeleton-block" />
                <div className="activity-card-body">
                  <div className="activity-skeleton-line" style={{ width: '35%' }} />
                  <div className="activity-skeleton-line" style={{ width: '85%', height: '1.1rem' }} />
                  <div className="activity-skeleton-line" style={{ width: '65%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ul className="activity-grid mt-12 sm:mt-14">
            {activities.map((activity) => (
              <li key={activity.id}>
                <article
                  className="activity-card"
                  role="link"
                  tabIndex={0}
                  onClick={() => navigate(`/hoat-dong/${activity.slug}`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      navigate(`/hoat-dong/${activity.slug}`);
                    }
                  }}
                >
                  <div className="activity-card-media">
                    {activity.coverImageUrl ? (
                      <img
                        src={activity.coverImageUrl}
                        alt={activity.title}
                        loading="lazy"
                      />
                    ) : (
                      <div className="activity-card-media-fallback" aria-hidden="true">
                        ĐIỂM SÁNG
                      </div>
                    )}
                    {activity.pinned && (
                      <span className="activity-pin" title="Bài ghim">
                        <Pin className="w-3.5 h-3.5" strokeWidth={2.5} />
                      </span>
                    )}
                  </div>

                  <div className="activity-card-body">
                    <div className="activity-card-meta">
                      <span className="activity-chip">{CATEGORY_LABELS[activity.category]}</span>
                      {activity.publishedAt && (
                        <span className="activity-date">
                          <CalendarDays className="w-3.5 h-3.5" strokeWidth={2} />
                          {formatDate(activity.publishedAt)}
                        </span>
                      )}
                    </div>

                    <h3 className="landing-subhead activity-card-title">{activity.title}</h3>

                    {activity.summary && (
                      <p className="landing-body mt-2 activity-card-summary">{activity.summary}</p>
                    )}

                    <span className="activity-card-more">
                      Xem chi tiết
                      <ArrowRight className="w-4 h-4" strokeWidth={2.25} />
                    </span>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default ActivitiesSection;
