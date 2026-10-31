/** Logo Điểm Sáng: dấu tích chấm bài + ngôi sao bút đỏ, màu theo bảng màu đang chọn. */
export default function BrandLogo({ size = 32, inverted = false, className = '' }: { size?: number; inverted?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} className={`shrink-0 ${className}`} role="img" aria-label="Logo Điểm Sáng">
      <rect x="1" y="1" width="38" height="38" rx="11" fill={inverted ? '#fff' : 'rgb(var(--accent))'} />
      <path d="M9 21.5l6.5 6.5L31 12.5" fill="none" stroke={inverted ? 'rgb(var(--accent))' : '#fff'} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M30 25.5l1.3 2.9 2.9 1.3-2.9 1.3-1.3 2.9-1.3-2.9-2.9-1.3 2.9-1.3z" fill="rgb(var(--accent-secondary))" />
      <circle cx="12" cy="11" r="2" fill="rgb(var(--accent-secondary))" />
    </svg>
  );
}
