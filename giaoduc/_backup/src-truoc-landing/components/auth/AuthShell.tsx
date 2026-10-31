import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import DarkModeToggle from '../common/DarkModeToggle';

type AuthShellProps = {
  children: ReactNode;
  title: string;
  subtitle?: string;
  maxWidth?: 'md' | 'lg';
  footer?: React.ReactNode;
};

const AuthShell = ({ children, title, subtitle, maxWidth = 'md', footer }: AuthShellProps) => {
  const widthClass = maxWidth === 'lg' ? 'max-w-lg' : 'max-w-md';

  return (
    <div className="auth-shell min-h-[100svh] relative flex flex-col items-center justify-center px-4 py-10 sm:py-14">
      <div className="auth-shell-bg" aria-hidden="true" />

      <div className="absolute top-4 right-4 z-20">
        <DarkModeToggle className="auth-shell-toggle" />
      </div>

      <div className={`relative z-10 w-full ${widthClass}`}>
        <div className="auth-shell-card">
          <div className="text-center mb-6 sm:mb-8 flex flex-col items-center">
            <Link to="/" className="flex items-center gap-2.5 mb-5 sm:mb-6 group focus-visible:ring-2 focus-visible:ring-cam rounded-lg outline-none">
              <img src="/logo.svg" alt="Logo Điểm Sáng" width={40} height={40} className="w-10 h-10 rounded-lg object-contain" />
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
  );
};

export default AuthShell;
