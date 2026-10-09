import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminService } from '@/services/api';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Loading, ErrorState } from '@/components/common/StateView';
import QrDesigner from '@/components/admin/QrDesigner';

/** Trình tạo & quản lý mã QR động: màu, logo, xuất file in, đổi link đích. */
export default function QrStudioPage() {
  useDocumentTitle('Mã QR động');
  const { id } = useParams();
  const navigate = useNavigate();
  const list = useAsync(() => adminService.listProducts(), []);
  const [product, setProduct] = useState(null);
  const [msg, setMsg] = useState('');
  const currentId = id || list.data?.[0]?.id;

  useEffect(() => {
    if (!currentId) return;
    setProduct(null);
    adminService.getProduct(currentId).then(setProduct).catch(() => setProduct(null));
  }, [currentId]);

  const update = async (qr) => {
    setProduct((p) => ({ ...p, qr }));
    const saved = await adminService.updateQr(product.id, qr);
    setProduct(saved);
    setMsg('Đã cập nhật mã QR — tem đã in vẫn dùng được.');
  };

  if (list.loading) return <Loading />;
  if (list.error) return <ErrorState error={list.error} onRetry={list.reload} />;

  return (
    <>
      <div className="page-head">
        <div><p>In-web Dynamic QR Generator</p><h1>Mã QR động</h1></div>
        <label className="field" style={{ minWidth: 260 }}>
          <span>Chọn sản phẩm / lô</span>
          <select className="select" value={currentId || ''} onChange={(e) => navigate(`/admin/qr/${e.target.value}`)}>
            {list.data.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.batchCode}</option>)}
          </select>
        </label>
      </div>
      {msg && <p className="form-success" role="status">{msg}</p>}
      {!product ? <Loading /> : (
        <div className="grid-2">
          <QrDesigner product={product} onChange={update} />
          <div className="panel">
            <div className="panel__title">Link động (Dynamic Link)</div>
            <p style={{ color: 'var(--muted)' }}>Mã QR luôn trỏ tới <code>/q/{product.qrCode}</code>. Bạn có thể đổi trang đích — ví dụ chuyển tem của lô cũ sang câu chuyện mùa vụ mới — mà không in lại bao bì.</p>
            <label className="field">
              <span>Trang đích hiện tại</span>
              <select className="select" value={product.qr?.targetSlug || product.slug} onChange={(e) => update({ ...product.qr, targetSlug: e.target.value === product.slug ? undefined : e.target.value })}>
                {list.data.map((p) => <option key={p.id} value={p.slug}>/p/{p.slug}{p.id === product.id ? ' (mặc định)' : ''}</option>)}
              </select>
            </label>
            <a className="btn btn--outline" href={`/q/${product.qrCode}`} target="_blank" rel="noreferrer">Thử quét (mở /q/{product.qrCode})</a>
          </div>
        </div>
      )}
    </>
  );
}
