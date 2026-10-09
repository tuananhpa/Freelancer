import { ORDER_STATUS, REVIEW_STATUS } from '@/config/constants';

const LABELS = { ...ORDER_STATUS, ...REVIEW_STATUS, published: 'Đang công bố', draft: 'Bản nháp' };

export default function StatusPill({ status }) {
  return <span className={`status status--${status}`}>{LABELS[status] || status}</span>;
}
