import { useState } from 'react';
import Icon from '@/components/common/Icon';
import { engagementService } from '@/services/api';

const BENEFITS = [
  'Tập huấn “cầm tay chỉ việc” quay dựng bằng smartphone',
  'Thống kê lượt quét theo thời gian và khu vực',
  'Tem vỡ chống bóc, mã xác thực chống giả',
];
const EMPTY = { name: '', organization: '', phone: '', message: '' };

export default function PartnerSection() {
  const [form, setForm] = useState(EMPTY);
  const [state, setState] = useState({ sending: false, error: '', done: false });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setState({ sending: true, error: '', done: false });
    try {
      await engagementService.createLead({ ...form, source: 'home-b2b' });
      setState({ sending: false, error: '', done: true });
      setForm(EMPTY);
    } catch (err) {
      setState({ sending: false, error: err.message, done: false });
    }
  };

  return (
    <section className="section section--sand" id="htx">
      <div className="container">
        <div className="b2b">
          <div style={{ display: 'grid', gap: 18, alignContent: 'center' }}>
            <span className="eyebrow">Dành cho HTX &amp; chủ thể OCOP</span>
            <h2 className="section__title">Nâng giá trị nông sản di sản thêm 20–40%</h2>
            <p className="section__lead">Một gói trọn: phim, web-app đa ngôn ngữ, CMS và mã QR động. Không in lại tem khi đổi mùa vụ, không cần đội ngũ công nghệ.</p>
            <ul className="b2b__list">{BENEFITS.map((b) => <li key={b}><Icon name="check" size={22} strokeWidth={2.2} />{b}</li>)}</ul>
          </div>
          <div className="price-card">
            <span className="eyebrow eyebrow--gold">Gói Nông sản Di sản</span>
            <div><span className="price-card__price">15.000.000đ</span> <span style={{ color: 'var(--muted-dark)' }}>/ sản phẩm</span></div>
            <hr />
            <ul>
              <li>01 Video Hero 9:16 Cinematic (BTV + nông dân đồng sáng tạo)</li>
              <li>Web-app di sản song ngữ Việt – Anh + CMS QR động</li>
              <li>5.000 tem Smart QR chống nước đầu tiên</li>
              <li>Miễn phí duy trì CMS năm đầu (sau đó 3.000.000đ/năm)</li>
            </ul>
            <a href="#dang-ky-htx" className="btn btn--gold btn--lg">Đăng ký tư vấn cho HTX</a>
          </div>
        </div>

        <form id="dang-ky-htx" className="lead-form" onSubmit={submit}>
          <h3 style={{ fontSize: 20, color: 'var(--lacquer)' }}>Để lại thông tin, HYTale sẽ liên hệ trong 24h</h3>
          <div className="lead-form__row">
            <label className="field"><span>Họ tên *</span><input className="input" required value={form.name} onChange={set('name')} autoComplete="name" /></label>
            <label className="field"><span>HTX / Doanh nghiệp</span><input className="input" value={form.organization} onChange={set('organization')} autoComplete="organization" /></label>
            <label className="field"><span>Số điện thoại *</span><input className="input" required inputMode="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" /></label>
          </div>
          <label className="field"><span>Sản phẩm muốn số hóa</span><textarea className="textarea" rows={2} value={form.message} onChange={set('message')} /></label>
          {state.error && <p className="form-error" role="alert">{state.error}</p>}
          {state.done && <p className="form-success" role="status">Cảm ơn! Chúng tôi đã nhận thông tin của bạn.</p>}
          <button type="submit" className="btn btn--primary btn--lg" style={{ justifySelf: 'start' }} disabled={state.sending}>{state.sending ? 'Đang gửi…' : 'Gửi đăng ký'}</button>
        </form>
      </div>
    </section>
  );
}
