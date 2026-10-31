import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Eye } from 'lucide-react';
import {
  CATEGORY_LABELS,
  publicActivityApi,
  type PublicActivity,
} from '../../services/activityApi';

const formatDate = (value: string | null) => {
  if (!value) return '';
  return new Date(value).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

/** Trang chi tiết hoạt động — công khai, không yêu cầu đăng nhập. */
const ActivityDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [activity, setActivity] = useState<PublicActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    setLoading(true);
    setNotFound(false);

    publicActivityApi
      .getBySlug(slug)
      .then((res) => {
        if (!cancelled) setActivity(res.data);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox]);

  if (loading) {
    return (
      <div className="activity-detail-page">
        <div className="activity-detail-wrap">
          <div className="activity-skeleton-line" style={{ width: '40%' }} />
          <div className="activity-skeleton-line mt-6" style={{ width: '80%', height: '2rem' }} />
          <div className="activity-skeleton-block mt-8" style={{ height: '20rem' }} />
        </div>
      </div>
    );
  }

  if (notFound || !activity) {
    return (
      <div className="activity-detail-page">
        <div className="activity-detail-wrap text-center">
          <h1 className="landing-heading">Không tìm thấy hoạt động</h1>
          <p className="landing-body mt-4">
            Bài viết có thể đã được gỡ hoặc đường dẫn không đúng.
          </p>
          <button type="button" className="activity-back mt-8" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4" strokeWidth={2.25} />
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="activity-detail-page">
      <Helmet>
        <title>{activity.title} | ĐIỂM SÁNG</title>
        {activity.summary && <meta name="description" content={activity.summary} />}
        <meta property="og:title" content={activity.title} />
        {activity.summary && <meta property="og:description" content={activity.summary} />}
        {activity.coverImageUrl && <meta property="og:image" content={activity.coverImageUrl} />}
      </Helmet>

      <article className="activity-detail-wrap">
        <Link to="/" className="activity-back">
          <ArrowLeft className="w-4 h-4" strokeWidth={2.25} />
          Về trang chủ
        </Link>

        <div className="activity-card-meta mt-8">
          <span className="activity-chip">{CATEGORY_LABELS[activity.category]}</span>
          {activity.publishedAt && (
            <span className="activity-date">
              <CalendarDays className="w-3.5 h-3.5" strokeWidth={2} />
              {formatDate(activity.publishedAt)}
            </span>
          )}
          <span className="activity-date">
            <Eye className="w-3.5 h-3.5" strokeWidth={2} />
            {activity.viewCount} lượt xem
          </span>
        </div>

        <h1 className="landing-heading activity-detail-title mt-4">{activity.title}</h1>

        {activity.summary && <p className="landing-body mt-5">{activity.summary}</p>}

        {activity.authorName && (
          <p className="activity-detail-author mt-3">Đăng bởi {activity.authorName}</p>
        )}

        {activity.coverImageUrl && (
          <img
            src={activity.coverImageUrl}
            alt={activity.title}
            className="activity-detail-cover mt-8"
          />
        )}

        <div className="activity-detail-content mt-8">
          {activity.content
            .split(/\n{2,}/)
            .filter((para) => para.trim().length > 0)
            .map((para, index) => (
              <p key={index}>{para}</p>
            ))}
        </div>

        {activity.images.length > 0 && (
          <>
            <h2 className="landing-subhead mt-12">Hình ảnh hoạt động</h2>
            <ul className="activity-album mt-5">
              {activity.images.map((url) => (
                <li key={url}>
                  <button
                    type="button"
                    className="activity-album-item"
                    onClick={() => setLightbox(url)}
                  >
                    <img src={url} alt="" loading="lazy" />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </article>

      {lightbox && (
        <div
          className="activity-lightbox"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
};

export default ActivityDetailPage;
