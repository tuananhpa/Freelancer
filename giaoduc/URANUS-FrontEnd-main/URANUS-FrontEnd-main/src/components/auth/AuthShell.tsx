import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Sparkles, FileSpreadsheet, Timer } from 'lucide-react';
import DarkModeToggle from '../common/DarkModeToggle';
import BrandLogo from '../common/BrandLogo';

type AuthShellProps = {
  children: ReactNode;
  title: string;
  subtitle?: string;
  maxWidth?: 'md' | 'lg';
  footer?: React.ReactNode;
};

const HIGHLIGHTS = [
  { icon: Timer, text: 'Bài kiểm tra 15 phút, 1 tiết làm ngay trên điện thoại' },
  { icon: CheckCircle2, text: 'Trắc nghiệm có điểm ngay khi học sinh nộp' },
  { icon: Sparkles, text: 'AI gợi ý điểm tự luận theo đáp án của thầy cô' },
  { icon: FileSpreadsheet, text: 'Tự tổng hợp điểm học kì, xuất Excel một chạm' },
];

const AuthShell = ({ children, title, subtitle, maxWidth = 'md', footer }: AuthShellProps) => {
  const widthClass = maxWidth === 'lg' ? 'max-w-lg' : 'max-w-md';

  return (
    <div className="auth-shell min-h-[100svh] relative flex">
      <div className="auth-shell-bg" aria-hidden="true" />

      {/* Cột thương hiệu (ẩn trên điện thoại) */}
      <aside className="auth-side relative z-10 hidden lg:flex w-[44%] max-w-[560px] flex-col justify-between p-10 xl:p-14">
        <Link to="/" className="flex items-center gap-3 w-fit">
          <BrandLogo size={42} inverted />
          <span className="font-heading text-2xl font-extrabold">Điểm Sáng</span>
        </Link>
        <div data-reveal>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">Lớp học & chấm điểm thông minh</p>
          <h2 className="mt-3 font-heading text-4xl xl:text-[44px] font-extrabold leading-[1.15]">Giao bài đầu giờ, có điểm trước giờ ra chơi.</h2>
          <ul className="mt-8 space-y-3">
            {HIGHLIGHTS.map(({ icon: Icon, text }, i) => (
              <li key={text} data-reveal style={{ '--d': `${120 + i * 90}ms` } as React.CSSProperties} className="flex items-center gap-3 rounded-2xl bg-white/12 border border-white/20 px-4 py-3 text-sm font-medium">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-camDam"><Icon size={18} /></span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-white/60">© 2026 Điểm Sáng</p>
      </aside>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-10 sm:py-14">
        <div className="absolute top-4 right-4 z-20">
          <DarkModeToggle className="auth-shell-toggle" />
        </div>

        <div className={`w-full ${widthClass}`}>
          <div className="auth-shell-card">
            <div className="text-center mb-6 sm:mb-8 flex flex-col items-center">
              <Link to="/" className="flex items-center gap-2.5 mb-5 sm:mb-6 lg:hidden focus-visible:ring-2 focus-visible:ring-cam rounded-lg outline-none">
                <BrandLogo size={40} />
                <span className="auth-shell-brand">Điểm Sáng</span>
              </Link>
              <h1 className="auth-shell-title mt-1 text-balance">{title}</h1>
              {subtitle && <p className="auth-shell-subtitle mt-1.5 text-pretty">{subtitle}</p>}
            </div>

            {children}

            {footer && <div className="mt-6 sm:mt-8 text-center text-sm font-medium">{footer}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthShell;
