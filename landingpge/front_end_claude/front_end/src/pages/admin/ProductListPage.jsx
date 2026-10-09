import { Link } from 'react-router-dom';
import { adminService } from '@/services/api';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Loading, ErrorState } from '@/components/common/StateView';
import StatusPill from '@/components/admin/StatusPill';
import Icon from '@/components/common/Icon';
import { formatDateTime } from '@/utils/format';

export default function ProductListPage() {
  useDocumentTitle('Sản phẩm & lô hàng');
  const { data, loading, error, reload } = useAsync(() => adminService.listProducts(), []);

  const remove = async (p) => {
    if (!window.confirm(`Xóa "${p.name}"? Mã QR của lô này sẽ ngừng hoạt động.`)) return;
    await adminService.deleteProduct(p.id);
    reload();
  };

  return (
    <>
      <div className="page-head">
        <div><p>Dynamic CMS</p><h1>Sản phẩm &amp; lô hàng</h1></div>
        <Link to="/admin/products/new" className="btn btn--primary"><Icon name="plus" size={18} /> Thêm mới</Link>
      </div>
      {loading && <Loading />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Sản phẩm</th><th>Mã lô</th><th>URL</th><th>Trạng thái</th><th>Cập nhật</th><th /></tr></thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id}>
                  <td><div style={{ display: 'flex', gap: 12, alignItems: 'center' }}><img src={p.coverUrl} alt="" className="table__thumb" /><strong>{p.name}</strong></div></td>
                  <td>{p.batchCode}</td>
                  <td><a href={`/p/${p.slug}`} target="_blank" rel="noreferrer">/p/{p.slug}</a></td>
                  <td><StatusPill status={p.status} /></td>
                  <td>{formatDateTime(p.updatedAt)}</td>
                  <td>
                    <div className="table__actions">
                      <Link to={`/admin/products/${p.id}`} className="btn btn--outline btn--sm"><Icon name="edit" size={15} /> Sửa</Link>
                      <Link to={`/admin/qr/${p.id}`} className="btn btn--outline btn--sm"><Icon name="qr" size={15} /> QR</Link>
                      <button type="button" className="btn btn--outline btn--sm" onClick={() => remove(p)} aria-label={`Xóa ${p.name}`}><Icon name="trash" size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.length === 0 && <p className="empty">Chưa có sản phẩm nào.</p>}
        </div>
      )}
    </>
  );
}
