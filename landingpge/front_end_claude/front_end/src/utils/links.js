import { env } from '@/config/env';

/** URL công khai của trang sản phẩm. */
export const productUrl = (slug) => `${env.publicSiteUrl}/p/${slug}`;
/** URL ngắn được mã hóa vào QR — không đổi dù slug/nội dung thay đổi (Dynamic QR). */
export const qrUrl = (code) => `${env.publicSiteUrl}/q/${code}`;
