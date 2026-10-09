import { useState } from 'react';
import { adminService } from '@/services/api';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Loading, ErrorState } from '@/components/common/StateView';
import { BarChart, HBarList } from '@/components/admin/BarChart';
import { formatDateTime } from '@/utils/format';

/** QR Analytics: số lượt quét, thời gian quét, vị trí. */
export default function AnalyticsPage() {
  useDocumentTitle('Thống kê lượt quét');
  const [days, setDays] = useState(30);
  const [productId, setProductId] = useState('');
  const products = useAsync(() => adminService.listProducts(), []);
  const { data, loading, error, reload } = useAsync(() => adminService.analytics({ days, productId }), [days, productId]);

  return (
    <>
      <div className="page-head">
        <div><p>QR Analytics</p><h1>Thống kê lượt quét</h1></div>
        <div className="page-head__actions">
          <select className="select" value={productId} onChange={(e) => setProductId(e.target.value)} aria-label="Lọc sản phẩm">
            <option value="">Tất cả sản phẩm</option>
            {products.data?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select className="select" value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="Khoảng thời gian">
            <option value={7}>7 ngày</option><option value={30}>30 ngày</option><option value={90}>90 ngày</option>
          </select>
        </div>
      </div>
      {loading && <Loading />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && (
        <>
          <div className="kpis">
            <div className="kpi"><span>Tổng lượt xem</span><b>{data.totalScans}</b></div>
            <div className="kpi"><span>Quét từ mã QR</span><b>{data.qrScans}</b></div>
            <div className="kpi"><span>Đơn phát sinh</span><b>{data.orders}</b></div>
          </div>
          <div className="panel"><div className="panel__title">Theo ngày</div><BarChart data={data.byDay} label={(d) => d.date.slice(5)} /></div>
          <div className="grid-2">
            <div className="panel"><div className="panel__title">Khung giờ quét</div><BarChart data={data.byHour.map((count, h) => ({ h, count }))} label={(d) => `${d.h}h`} height={120} /></div>
            <div className="panel"><div className="panel__title">Vị trí</div><HBarList rows={data.byLocation.map((r) => ({ label: r.location, count: r.count }))} /></div>
          </div>
          <div className="panel">
            <div className="panel__title">Lượt quét gần nhất</div>
            {data.recent.length === 0 ? <p className="empty">Chưa có lượt quét — thử mở một trang /q/:code để tạo dữ liệu.</p> : (
              <div className="table-wrap"><table className="table">
                <thead><tr><th>Thời gian</th><th>Sản phẩm</th><th>Nguồn</th><th>Vị trí</th><th>Thiết bị</th></tr></thead>
                <tbody>{data.recent.map((s) => <tr key={s.id}><td>{formatDateTime(s.at)}</td><td>{s.productName}</td><td>{s.source === 'qr' ? 'Quét QR' : 'Truy cập trực tiếp'}</td><td>{s.location}</td><td>{s.device}</td></tr>)}</tbody>
              </table></div>
            )}
          </div>
        </>
      )}
    </>
  );
}
