/* ==========================================================================
   BM Global Spirits — siteConfig.js
   Thông tin liên hệ & danh sách chai tiêu biểu: sửa MỘT chỗ duy nhất tại đây.
   ========================================================================== */

export const SITE = {
  name: 'BM Global Spirits',
  legalName: 'Công ty [[CẦN XÁC NHẬN]]',
  hotline: '0900 000 000',               // [[CẦN XÁC NHẬN]]
  hotlineHref: 'tel:+84900000000',       // [[CẦN XÁC NHẬN]]
  zalo: 'https://zalo.me/0900000000',    // [[CẦN XÁC NHẬN]]
  messenger: 'https://m.me/bmglobalspirits', // [[CẦN XÁC NHẬN]]
  facebook: 'https://facebook.com/bmglobalspirits', // [[CẦN XÁC NHẬN]]
  email: 'lienhe@bmglobalspirits.vn',    // [[CẦN XÁC NHẬN]]
  address: 'Số nhà, đường, phường, TP. Hồ Chí Minh', // [[CẦN XÁC NHẬN]]
  city: 'TP. Hồ Chí Minh',               // [[CẦN XÁC NHẬN]]
  hours: [
    ['Thứ Hai – Thứ Bảy', '9:00 – 21:00'],
    ['Chủ nhật', '10:00 – 18:00'],
  ], // [[CẦN XÁC NHẬN]]
  license: 'Giấy phép kinh doanh rượu số [[CẦN XÁC NHẬN]]',
  year: new Date().getFullYear(),
};

export const FEATURE_MEGA = '0427';

export const HERO_PICKS = [
  // [nhãn, bộ lọc, id chai]
  ['Single Malt', { type: 'single-malt' }, '0352'],
  ['Blended', { type: 'blended' }, '0437'],
  ['Cognac', { cat: 'cognac-brandy' }, '0266'],
  ['Bourbon', { type: 'american' }, '0372'],
  ['Gin', { type: 'gin' }, '0400'],
  ['Rum', { type: 'rum' }, '0616'],
  ['Tequila', { type: 'tequila-mezcal' }, '0153'],
  ['Sake', { type: 'sake' }, '0476'],
  ['Rượu Việt', { cat: 'vietnamese-spirits' }, '0207'],
];

export const CAT_COVER = {
  whisky: '0277',
  'cognac-brandy': '0347',
  spirits: '0060',
  'liqueurs-aperitifs': '0089',
  'japanese-spirits': '0467',
  'vietnamese-spirits': '0338',
};

export const CAT_ORDER = [
  'whisky',
  'cognac-brandy',
  'spirits',
  'japanese-spirits',
  'liqueurs-aperitifs',
  'vietnamese-spirits',
];

export const FEATURED = ['0370', '0347', '0133', '0427', '0614', '0429', '0205', '0243'];
export const STORY = ['0408', '0366', '0338'];
export const SHELF = ['0352', '0347', '0370', '0153', '0400'];
export const CONTACT_SHELF = ['0266', '0400', '0476', '0207'];
export const TONES = ['oak', 'claret', 'bottle', 'night'];
