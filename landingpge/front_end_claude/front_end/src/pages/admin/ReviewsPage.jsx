import { adminService } from '@/services/api';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Loading, ErrorState } from '@/components/common/StateView';
import StatusPill from '@/components/admin/StatusPill';
import { formatDateTime } from '@/utils/format';

/** Duyệt đánh giá khách gửi trước khi hiển thị công khai. */
export default function ReviewsPage() {
  useDocumentTitle('Đánh giá');
  const { data, loading, error, reload, setData } = useAsync(() => adminService.listReviews(), []);
  const change = async (r, status) => {
    await adminService.updateReview(r.id, { status });
    setData(data.map((x) => (x.id === r.id ? { ...x, status } : x)));
  };
  return (
    <>
      <div className="page-head"><div><p>Bình luận, chấm sao &amp; ảnh cảm nhận</p><h1>Đánh giá khách hàng</h1></div></div>
      {loading && <Loading />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data?.length === 0 && <div className="panel"><p className="empty">Chưa có đánh giá nào.</p></div>}
      <div className="grid-2">
        {data?.map((r) => (
          <article key={r.id} className="panel">
            <div className="panel__title"><span>{r.name} · <span style={{ color: '#b8860b' }}>{'★'.repeat(r.rating)}</span></span><StatusPill status={r.status} /></div>
            <small style={{ color: 'var(--muted)' }}>{r.productName} · {formatDateTime(r.createdAt)}</small>
            {r.comment && <p>{r.comment}</p>}
            {r.photos?.length > 0 && <div className="review__photos">{r.photos.map((p, i) => <img key={i} src={p} alt="Ảnh khách gửi" />)}</div>}
            <div className="table__actions">
              <button type="button" className="btn btn--primary btn--sm" onClick={() => change(r, 'approved')} disabled={r.status === 'approved'}>Duyệt</button>
              <button type="button" className="btn btn--outline btn--sm" onClick={() => change(r, 'hidden')} disabled={r.status === 'hidden'}>Ẩn</button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
