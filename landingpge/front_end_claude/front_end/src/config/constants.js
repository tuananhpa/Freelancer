export const STORAGE_KEYS = {
  token: 'hytale.admin.token',
  mockDb: 'hytale.mock.db.v1',
  chatSession: 'hytale.chat.session',
};

export const CERTIFICATIONS = {
  ocop4: { label: 'OCOP 4 sao', tone: 'red' },
  ocop5: { label: 'OCOP 5 sao', tone: 'red' },
  vietgap: { label: 'VietGAP', tone: 'green' },
  globalgap: { label: 'GlobalGAP', tone: 'green' },
  gi: { label: 'Chỉ dẫn địa lý Hưng Yên', tone: 'dark' },
  organic: { label: 'Hữu cơ', tone: 'green' },
};

export const ORDER_STATUS = {
  new: 'Mới',
  contacted: 'Đã liên hệ',
  done: 'Hoàn tất',
  cancelled: 'Đã hủy',
};

export const REVIEW_STATUS = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  hidden: 'Đã ẩn',
};
