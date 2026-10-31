// DB lưu ISO UTC (…Z). Java/Jackson trả LocalDateTime theo giờ Asia/Ho_Chi_Minh không múi giờ — frontend đọc kiểu đó.
const VN_OFFSET_MS = 7 * 3600_000;

export const nowISO = () => new Date().toISOString();

/** ISO UTC -> "2026-10-29T15:15:00.123" (giờ VN, không Z). Giữ nguyên nếu đã không có múi giờ. */
export function javaTime(v: string | null | undefined): string | null {
  if (!v) return null;
  if (!/[zZ]|[+-]\d\d:?\d\d$/.test(v)) return v;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return new Date(d.getTime() + VN_OFFSET_MS).toISOString().replace('Z', '');
}
export const javaNow = () => javaTime(nowISO())!;

/** Chuỗi client gửi lên -> ISO UTC. Không có múi giờ thì hiểu là giờ VN (như Java LocalDateTime). */
export function utcTime(v: unknown): string | null {
  if (v == null || v === '') return null;
  const s = String(v);
  const withZone = /[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : `${s.length === 16 ? `${s}:00` : s}+07:00`;
  const d = new Date(withZone);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/** Ngày hôm nay theo giờ VN, YYYY-MM-DD */
export const todayVN = (at = Date.now()) => new Date(at + VN_OFFSET_MS).toISOString().slice(0, 10);
