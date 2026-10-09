import { adminService } from '@/services/api';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Loading, ErrorState } from '@/components/common/StateView';
import { ORDER_STATUS } from '@/config/constants';
import { formatDateTime } from '@/utils/format';

export default function OrdersPage() {
  useDocumentTitle('Đơn đặt mua');
  const { data, loading, error, reload, setData } = useAsync(() => adminService.listOrders(), []);
  const change = async (o, status) => {
    await adminService.updateOrder(o.id, { status });
    setData(data.map((x) => (x.id === o.id ? { ...x, status } : x)));
  };
  return (
    <>
      <div className="page-head"><div><p>Từ nút Mua tặng / Đặt mua thêm</p><h1>Đơn đặt mua</h1></div></div>
      {loading && <Loading />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Mã</th><th>Khách</th><th>Sản phẩm</th><th>Loại</th><th>SL</th><th>Địa chỉ / ghi chú</th><th>Thời gian</th><th>Trạng thái</th></tr></thead>
            <tbody>
              {data.map((o) => (
                <tr key={o.id}>
                  <td><strong>{o.code}</strong></td>
                  <td>{o.name}<br /><a href={`tel:${o.phone}`}>{o.phone}</a></td>
                  <td>{o.productName}<br /><small>{o.batchCode}</small></td>
                  <td>{o.isGift ? `Tặng: ${o.recipientName}` : 'Mua cho mình'}</td>
                  <td>{o.quantity}</td>
                  <td style={{ maxWidth: 240 }}>{o.address}<br /><small style={{ color: 'var(--muted)' }}>{o.note}</small></td>
                  <td>{formatDateTime(o.createdAt)}</td>
                  <td>
                    <select className="select" value={o.status} onChange={(e) => change(o, e.target.value)} aria-label="Trạng thái đơn">
                      {Object.entries(ORDER_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.length === 0 && <p className="empty">Chưa có đơn đặt mua.</p>}
        </div>
      )}
    </>
  );
}
