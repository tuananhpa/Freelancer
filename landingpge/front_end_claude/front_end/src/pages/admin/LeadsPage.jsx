import { adminService } from '@/services/api';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Loading, ErrorState } from '@/components/common/StateView';
import { formatDateTime } from '@/utils/format';

/** Danh sách HTX / doanh nghiệp đăng ký tư vấn từ trang chủ. */
export default function LeadsPage() {
  useDocumentTitle('Đăng ký HTX');
  const { data, loading, error, reload } = useAsync(() => adminService.listLeads(), []);
  return (
    <>
      <div className="page-head"><div><p>Khách hàng B2B</p><h1>Đăng ký tư vấn HTX</h1></div></div>
      {loading && <Loading />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Họ tên</th><th>HTX / Doanh nghiệp</th><th>Điện thoại</th><th>Nhu cầu</th><th>Thời gian</th></tr></thead>
            <tbody>{data.map((l) => <tr key={l.id}><td>{l.name}</td><td>{l.organization}</td><td><a href={`tel:${l.phone}`}>{l.phone}</a></td><td>{l.message}</td><td>{formatDateTime(l.createdAt)}</td></tr>)}</tbody>
          </table>
          {data.length === 0 && <p className="empty">Chưa có đăng ký nào.</p>}
        </div>
      )}
    </>
  );
}
