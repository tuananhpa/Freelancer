import { useEffect, useState } from 'react';
import Icon from '@/components/common/Icon';
import { qrToPngDataUrl, downloadPng, downloadSvg, printPdf } from '@/utils/qr';
import { productUrl, qrUrl } from '@/utils/links';

export const QR_COLORS = [
  { value: '#17110D', label: 'Đen sơn mài' },
  { value: '#B23A22', label: 'Đỏ son' },
  { value: '#2F5D45', label: 'Xanh VietGAP' },
  { value: '#8A6418', label: 'Vàng đồng' },
];

/**
 * Xem trước + tùy biến + xuất file QR.
 * QR mã hóa URL ngắn /q/:code (không đổi), backend quyết định đích đến -> Dynamic QR.
 */
export default function QrDesigner({ product, onChange, saving }) {
  const [preview, setPreview] = useState('');
  const qr = product.qr || { color: '#17110D', withLogo: true };
  const encoded = product.qrCode ? qrUrl(product.qrCode) : null;
  const fileName = `QR-${product.slug || 'hytale'}`;

  useEffect(() => {
    if (!encoded) return;
    let alive = true;
    qrToPngDataUrl(encoded, { color: qr.color, withLogo: qr.withLogo, size: 512 }).then((u) => alive && setPreview(u));
    return () => { alive = false; };
  }, [encoded, qr.color, qr.withLogo]);

  if (!encoded) {
    return <div className="panel panel--dark"><div className="panel__title">Mã QR động</div><p style={{ color: 'var(--muted-dark)' }}>Bấm “Lưu sản phẩm” để hệ thống tự sinh mã QR cho lô hàng này.</p></div>;
  }

  const opts = { color: qr.color, withLogo: qr.withLogo };
  return (
    <div className="panel panel--dark">
      <div className="panel__title">Mã QR động <span className="badge badge--green">{product.status === 'published' ? 'Đang hoạt động' : 'Bản nháp'}</span></div>
      <div className="qr-preview">{preview && <img src={preview} alt={`Mã QR của ${product.name}`} />}</div>
      <p className="qr-url">{encoded}<br />→ {productUrl(qr.targetSlug || product.slug)}</p>
      <div style={{ display: 'grid', gap: 8 }}>
        <span style={{ fontSize: 13, color: 'var(--on-dark-2)' }}>Màu mã</span>
        <div className="swatches">
          {QR_COLORS.map((c) => (
            <button key={c.value} type="button" className={`swatch ${qr.color === c.value ? 'is-on' : ''}`} style={{ background: c.value }} aria-label={c.label} aria-pressed={qr.color === c.value} onClick={() => onChange({ ...qr, color: c.value })} />
          ))}
          <label className="btn btn--ghost-dark btn--sm" style={{ gap: 8 }}>
            <input type="checkbox" checked={!!qr.withLogo} onChange={(e) => onChange({ ...qr, withLogo: e.target.checked })} />
            Chèn logo
          </label>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 8 }}>
        <button type="button" className="btn btn--gold btn--sm" onClick={() => downloadPng(encoded, fileName, opts)}><Icon name="download" size={16} />PNG</button>
        <button type="button" className="btn btn--gold btn--sm" onClick={() => downloadSvg(encoded, fileName, opts)}><Icon name="download" size={16} />SVG</button>
        <button type="button" className="btn btn--gold btn--sm" onClick={() => printPdf(encoded, { ...opts, title: product.name, subtitle: product.batchCode || '' })}><Icon name="download" size={16} />PDF</button>
      </div>
      <p style={{ fontSize: 12.5, color: 'var(--muted-dark)' }}>
        Sửa nội dung hoặc đổi trang đích bất kỳ lúc nào — mã đã in trên bao bì không thay đổi.{saving ? ' Đang lưu…' : ''}
      </p>
    </div>
  );
}
