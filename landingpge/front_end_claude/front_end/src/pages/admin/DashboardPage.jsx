import { Link } from 'react-router-dom';
import { adminService } from '@/services/api';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Loading, ErrorState } from '@/components/common/StateView';
import { BarChart, HBarList } from '@/components/admin/BarChart';
import StatusPill from '@/components/admin/StatusPill';
import Icon from '@/components/common/Icon';
import { formatDateTime } from '@/utils/format';

export default function DashboardPage() {
  useDocumentTitle('Tổng quan');
  const { data, loading, error, reload } = useAsync(async () => {
    const [stats, orders, products] = await Promise.all([
      adminService.analytics({ days: 14 }), adminService.listOrders(), adminService.listProducts(),
    ]);
    return { stats, orders: orders.slice(0, 5), products };
  }, []);

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const { stats, orders, products } = data;

  return (
    <>
      <div className="page-head">
        <div><p>Xin chào!</p><h1>Tổng quan HYTale</h1></div>
        <div className="page-head__actions">
          <Link to="/admin/products/new" className="btn btn--primary"><Icon name="plus" size={18} /> Thêm sản phẩm / lô</Link>
        </div>
      </div>
      <div className="kpis">
        <div className="kpi"><span>Lượt xem 14 ngày</span><b>{stats.totalScans}</b></div>
        <div className="kpi"><span>Trong đó quét QR</span><b>{stats.qrScans}</b></div>
        <div className="kpi"><span>Đơn đặt mua mới</span><b>{stats.orders}</b></div>
        <div className="kpi"><span>Đánh giá chờ duyệt</span><b>{stats.pendingReviews}</b></div>
        <div className={`kpi ${stats.unreadMessages ? 'kpi--alert' : ''}`}><span>Tin nhắn chưa đọc</span><b>{stats.unreadMessages}</b></div>
      </div>
      <div className="grid-2">
        <div className="panel"><div className="panel__title">Lượt xem theo ngày</div><BarChart data={stats.byDay} label={(d) => d.date.slice(5)} /></div>
        <div className="panel"><div className="panel__title">Theo sản phẩm</div><HBarList rows={stats.byProduct.map((r) => ({ label: r.name, count: r.count }))} empty="Chưa có lượt quét nào" /></div>
      </div>
      <div className="grid-2">
        <div className="panel">
          <div className="panel__title">Đơn mới nhất <Link to="/admin/orders" style={{ fontSize: 13 }}>Xem tất cả</Link></div>
          {orders.length === 0 ? <p className="empty">Chưa có đơn nào</p> : orders.map((o) => (
            <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <span><strong>{o.name}</strong> · {o.productName}<br /><small style={{ color: 'var(--muted)' }}>{formatDateTime(o.createdAt)}</small></span>
              <StatusPill status={o.status} />
            </div>
          ))}
        </div>
        <div className="panel">
          <div className="panel__title">Sản phẩm <Link to="/admin/products" style={{ fontSize: 13 }}>Quản lý</Link></div>
          {products.map((p) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img src={p.coverUrl} alt="" className="table__thumb" />
              <span style={{ flex: 1 }}><strong>{p.name}</strong><br /><small style={{ color: 'var(--muted)' }}>{p.batchCode}</small></span>
              <Link to={`/admin/qr/${p.id}`} className="btn btn--outline btn--sm"><Icon name="qr" size={16} /> QR</Link>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
