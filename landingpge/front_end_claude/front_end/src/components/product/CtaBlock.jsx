import Icon from '@/components/common/Icon';
import { env } from '@/config/env';

/** Khối 5: Nút kêu gọi hành động lớn. */
export default function CtaBlock({ product, onOrder }) {
  const zalo = product.cta?.zaloUrl || env.defaultZalo;
  return (
    <section className="cta-stack" aria-label="Đặt mua và liên hệ">
      {product.cta?.orderEnabled !== false && (
        <button type="button" className="btn btn--primary btn--block cta-big" onClick={onOrder}>
          <Icon name="gift" /> Mua tặng bạn bè / Đặt mua thêm
        </button>
      )}
      <a className="btn btn--block cta-big cta-zalo" href={zalo} target="_blank" rel="noopener noreferrer">
        <Icon name="chat" /> Nhắn Zalo trực tiếp nhà vườn
      </a>
      {product.cta?.hotline && (
        <a className="btn btn--outline btn--block" href={`tel:${product.cta.hotline}`}>Gọi {product.cta.hotline}</a>
      )}
    </section>
  );
}
