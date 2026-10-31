/**
 * Sua link cua thong bao ho tro truoc khi dieu huong.
 *
 * Thong bao "Tin nhan ho tro moi" duoc tao TRUOC khi backend biet kem
 * conversationId chi co link "/support/inbox", bam vao chi do ve danh sach roi
 * ho tro vien phai tu tim lai dong nao vua nhan. Nhung dong tom tat cua chung
 * luon co dang "Ten nguoi gui: noi dung", du de hop thu tra nguoc ra hoi thoai.
 *
 * Thong bao moi da co san "?c=<conversationId>" nen duoc giu nguyen - do la
 * duong chinh xac, tra theo ten chi la duong du phong.
 */
export const SUPPORT_INBOX_PATH = '/support/inbox';

export const resolveNotificationLink = (
  link: string | null | undefined,
  message: string | null | undefined
): string => {
  if (!link) return '';
  // Da co tham so (thuong la ?c=<id>) thi backend da chi dich chinh xac.
  if (link.includes('?')) return link;
  if (link !== SUPPORT_INBOX_PATH) return link;

  // Chi lay phan truoc dau hai cham DAU TIEN: noi dung tin nhan cung co the
  // chua dau hai cham ("Em hoi: bai nay lam sao ạ").
  const separator = (message ?? '').indexOf(':');
  if (separator <= 0) return link;

  const senderName = (message ?? '').slice(0, separator).trim();
  if (!senderName) return link;

  return `${SUPPORT_INBOX_PATH}?name=${encodeURIComponent(senderName)}`;
};
