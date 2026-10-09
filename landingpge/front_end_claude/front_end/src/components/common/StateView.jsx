export function Loading({ label = 'Đang tải…' }) {
  return <div className="state" role="status"><span className="spinner" />{label}</div>;
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="state" role="alert">
      <p>{error?.message || 'Đã có lỗi xảy ra.'}</p>
      {onRetry && <button type="button" className="btn btn--outline btn--sm" onClick={onRetry}>Thử lại</button>}
    </div>
  );
}
