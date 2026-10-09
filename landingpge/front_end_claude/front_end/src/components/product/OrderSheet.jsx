import { useState } from 'react';
import Sheet from '@/components/common/Sheet';
import { engagementService } from '@/services/api';

const EMPTY = { name: '', phone: '', address: '', quantity: 1, recipientName: '', recipientPhone: '', note: '' };

/** Form đăng ký mua nhanh — không cần tài khoản. */
export default function OrderSheet({ open, onClose, product }) {
  const [isGift, setIsGift] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [state, setState] = useState({ sending: false, error: '', done: null });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const close = () => { onClose(); setTimeout(() => { setState({ sending: false, error: '', done: null }); setForm(EMPTY); }, 300); };

  const submit = async (e) => {
    e.preventDefault();
    if (!/^0\d{9,10}$/.test(form.phone.replace(/\s/g, ''))) {
      setState((s) => ({ ...s, error: 'Số điện thoại chưa đúng (VD: 0912345678)' }));
      return;
    }
    setState({ sending: true, error: '', done: null });
    try {
      const res = await engagementService.createOrder({ ...form, quantity: Number(form.quantity), isGift, productSlug: product.slug, batchCode: product.batchCode });
      setState({ sending: false, error: '', done: res });
    } catch (err) {
      setState({ sending: false, error: err.message, done: null });
    }
  };

  return (
    <Sheet open={open} onClose={close} title={isGift ? 'Mua tặng bạn bè' : 'Đặt mua thêm'}>
      {state.done ? (
        <div style={{ display: 'grid', gap: 12, textAlign: 'center', padding: '12px 0 8px' }}>
          <p className="form-success">Đã gửi yêu cầu! Mã đơn: {state.done.code}</p>
          <p style={{ color: 'var(--muted)' }}>Nhà vườn sẽ gọi lại để xác nhận giá và thời gian giao hàng.</p>
          <button type="button" className="btn btn--dark btn--block" onClick={close}>Đóng</button>
        </div>
      ) : (
        <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
          <div className="toggle" role="group" aria-label="Loại đơn">
            <button type="button" className={!isGift ? 'is-on' : ''} onClick={() => setIsGift(false)} aria-pressed={!isGift}>Mua cho mình</button>
            <button type="button" className={isGift ? 'is-on' : ''} onClick={() => setIsGift(true)} aria-pressed={isGift}>Gửi tặng</button>
          </div>
          <p style={{ fontSize: 14, color: 'var(--muted)' }}>{product.name} · {product.batchCode}</p>
          <label className="field"><span>Họ tên của bạn *</span><input className="input" required value={form.name} onChange={set('name')} autoComplete="name" /></label>
          <label className="field"><span>Số điện thoại *</span><input className="input" required inputMode="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" /></label>
          {isGift && (
            <>
              <label className="field"><span>Tên người nhận *</span><input className="input" required value={form.recipientName} onChange={set('recipientName')} /></label>
              <label className="field"><span>SĐT người nhận</span><input className="input" inputMode="tel" value={form.recipientPhone} onChange={set('recipientPhone')} /></label>
            </>
          )}
          <label className="field"><span>Địa chỉ nhận hàng</span><input className="input" value={form.address} onChange={set('address')} autoComplete="street-address" /></label>
          <label className="field"><span>Số lượng (hộp / kg)</span><input className="input" type="number" min="1" value={form.quantity} onChange={set('quantity')} /></label>
          <label className="field"><span>Ghi chú{isGift ? ' / lời chúc' : ''}</span><textarea className="textarea" rows={3} value={form.note} onChange={set('note')} /></label>
          {state.error && <p className="form-error" role="alert">{state.error}</p>}
          <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={state.sending}>{state.sending ? 'Đang gửi…' : 'Gửi yêu cầu đặt mua'}</button>
        </form>
      )}
    </Sheet>
  );
}
