import { useRef, useState } from 'react';
import Icon from '@/components/common/Icon';
import { engagementService } from '@/services/api';
import { useAsync } from '@/hooks/useAsync';
import { compressImage, formatDate } from '@/utils/format';

const MAX_PHOTOS = 3;

/** Bình luận + chấm sao + gửi ảnh cảm nhận. Đánh giá chờ admin duyệt trước khi hiển thị. */
export default function ReviewSection({ slug }) {
  const { data: reviews } = useAsync(() => engagementService.listReviews(slug), [slug]);
  const [rating, setRating] = useState(0);
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState([]);
  const [status, setStatus] = useState({ sending: false, error: '', done: false });
  const fileRef = useRef(null);

  const addPhotos = async (e) => {
    const files = [...e.target.files].slice(0, MAX_PHOTOS - photos.length);
    const urls = await Promise.all(files.map((f) => compressImage(f, 800, 0.75)));
    setPhotos((p) => [...p, ...urls].slice(0, MAX_PHOTOS));
    e.target.value = '';
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) { setStatus({ sending: false, error: 'Bạn hãy chấm sao trước nhé', done: false }); return; }
    setStatus({ sending: true, error: '', done: false });
    try {
      await engagementService.createReview(slug, { name, rating, comment, photos });
      setStatus({ sending: false, error: '', done: true });
      setRating(0); setComment(''); setPhotos([]);
    } catch (err) {
      setStatus({ sending: false, error: err.message, done: false });
    }
  };

  const avg = reviews?.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  return (
    <section className="pp-section" style={{ paddingBottom: 120 }} aria-labelledby="review-title">
      <div className="reel-head">
        <h2 id="review-title" className="pp-section__title" style={{ fontSize: 24 }}>Cảm nhận của khách</h2>
        {avg && <span style={{ color: 'var(--gold-ink)', fontWeight: 700 }}>★ {avg} · {reviews.length}</span>}
      </div>

      <form className="review-form" onSubmit={submit}>
        <span style={{ fontWeight: 600 }}>Chấm sao cho lô hàng này</span>
        <div className="stars" role="radiogroup" aria-label="Số sao">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} sao`}
              className={`star-btn ${n <= rating ? 'is-on' : ''}`} onClick={() => setRating(n)}>
              <Icon name="star" size={30} />
            </button>
          ))}
        </div>
        <label className="field"><span>Tên hiển thị *</span><input className="input" required value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label className="field"><span>Bình luận</span><textarea className="textarea" rows={3} placeholder="Chia sẻ cảm nhận của bạn…" value={comment} onChange={(e) => setComment(e.target.value)} /></label>
        {photos.length > 0 && (
          <div className="photo-previews">
            {photos.map((p, i) => (
              <button key={i} type="button" onClick={() => setPhotos((ps) => ps.filter((_, j) => j !== i))} aria-label="Bỏ ảnh này" style={{ border: 0, padding: 0, background: 'none' }}>
                <img src={p} alt="" />
              </button>
            ))}
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={addPhotos} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn btn--outline" style={{ flex: 1, borderRadius: 12, borderStyle: 'dashed' }} onClick={() => fileRef.current?.click()} disabled={photos.length >= MAX_PHOTOS}>
            <Icon name="camera" size={18} /> Thêm ảnh
          </button>
          <button type="submit" className="btn btn--dark" style={{ flex: 1, borderRadius: 12 }} disabled={status.sending}>{status.sending ? 'Đang gửi…' : 'Gửi đánh giá'}</button>
        </div>
        {status.error && <p className="form-error" role="alert">{status.error}</p>}
        {status.done && <p className="form-success" role="status">Cảm ơn bạn! Đánh giá sẽ hiển thị sau khi được duyệt.</p>}
      </form>

      {reviews?.map((r) => (
        <article key={r.id} className="review">
          <div className="review__head"><strong>{r.name}</strong><span className="review__stars" aria-label={`${r.rating} sao`}>{'★'.repeat(r.rating)}</span></div>
          {r.comment && <p style={{ color: 'var(--ink-2)' }}>{r.comment}</p>}
          {r.photos?.length > 0 && <div className="review__photos">{r.photos.map((p, i) => <img key={i} src={p} alt="Ảnh khách gửi" loading="lazy" />)}</div>}
          <small style={{ color: 'var(--muted)' }}>{formatDate(r.createdAt)}</small>
        </article>
      ))}
      {reviews && reviews.length === 0 && <p style={{ color: 'var(--muted)' }}>Chưa có đánh giá nào — hãy là người đầu tiên!</p>}
    </section>
  );
}
