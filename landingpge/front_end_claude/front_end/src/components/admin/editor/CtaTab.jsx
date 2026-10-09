import Repeater from './Repeater';
import { newId } from './emptyProduct';

/** Khối 5: CTA + kịch bản chatbot FAQ của sản phẩm. */
export default function CtaTab({ p, set }) {
  const cta = (patch) => set({ cta: { ...p.cta, ...patch } });
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="form-grid">
        <label className="field"><span>Link Zalo nhà vườn</span><input className="input" value={p.cta.zaloUrl} onChange={(e) => cta({ zaloUrl: e.target.value })} placeholder="https://zalo.me/..." /></label>
        <label className="field"><span>Hotline</span><input className="input" inputMode="tel" value={p.cta.hotline} onChange={(e) => cta({ hotline: e.target.value })} /></label>
        <div className="check-chips span-all"><label><input type="checkbox" checked={p.cta.orderEnabled !== false} onChange={(e) => cta({ orderEnabled: e.target.checked })} />Hiện nút Mua tặng bạn bè / Đặt mua thêm</label></div>
      </div>
      <div className="field"><span>Chatbot – câu hỏi thường gặp (giá bán, bảo quản, gửi hàng…)</span>
        <Repeater items={p.faqs} itemLabel="FAQ" addLabel="Thêm câu hỏi" onChange={(faqs) => set({ faqs })}
          makeItem={() => ({ id: newId('q'), question: '', answer: '' })}
          render={(f, up) => (
            <>
              <input className="input" value={f.question} onChange={(e) => up({ question: e.target.value })} placeholder="Câu hỏi" aria-label="Câu hỏi" />
              <textarea className="textarea" rows={2} value={f.answer} onChange={(e) => up({ answer: e.target.value })} placeholder="Câu trả lời tự động" aria-label="Câu trả lời" />
            </>
          )} />
      </div>
    </div>
  );
}
