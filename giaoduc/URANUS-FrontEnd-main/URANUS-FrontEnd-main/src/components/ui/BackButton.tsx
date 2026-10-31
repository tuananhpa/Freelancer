import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export interface BackButtonProps {
  /** Đường dẫn đích đến cụ thể (ví dụ: '/exams', '/courses') */
  to?: string;
  /** Fallback URL nếu vào trực tiếp từ external link / refresh (mặc định: '/dashboard') */
  fallbackUrl?: string;
  /** Custom click handler (dùng khi cần logic riêng trước khi thoát) */
  onClick?: () => void;
  /** Hiển thị nhãn chữ kèm theo (ví dụ: 'Quay lại', 'Về khóa học') */
  label?: string;
  /** Kiểu dáng: 'icon' (nút vuông bo góc), 'pill' (viên thuốc bo tròn), 'ghost' (chữ phẳng) */
  variant?: 'icon' | 'pill' | 'ghost';
  className?: string;
  size?: number;
  /** Có cảnh báo xác nhận trước khi rời trang không */
  confirmMessage?: string;
}

const BackButton: React.FC<BackButtonProps> = ({
  to,
  fallbackUrl = '/dashboard',
  onClick,
  label,
  variant = 'icon',
  className = '',
  size = 18,
  confirmMessage,
}) => {
  const navigate = useNavigate();
  const toast = useToast();

  const handleClick = async (e: React.MouseEvent) => {
    if (confirmMessage) {
      const ok = await toast.confirm(confirmMessage);
      if (!ok) {
        e.preventDefault();
        return;
      }
    }

    if (onClick) {
      onClick();
      return;
    }

    if (to) {
      // If to is supplied and not intercepted by confirm, Link handles it naturally or navigate(to)
      return;
    }

    // Smart History Back: Nếu có lịch sử trong app thì lùi, ngược lại về fallbackUrl
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate(fallbackUrl);
    }
  };

  // Base styles: Hỗ trợ 100% Dark Mode, Focus Ring, Micro-interaction scale
  const variantStyles = {
    icon: 'p-2.5 bg-white dark:bg-night-surface hover:bg-gray-50 dark:hover:bg-night-elevated text-vutru dark:text-night-text border border-gray-200 dark:border-night-border rounded-xl shadow-2xs hover:border-cam/50 hover:text-cam dark:hover:text-cam active:scale-95',
    pill: 'px-3.5 py-2 bg-white dark:bg-night-surface hover:bg-gray-50 dark:hover:bg-night-elevated text-vutru dark:text-night-text border border-gray-200 dark:border-night-border rounded-full shadow-2xs hover:border-cam/50 hover:text-cam dark:hover:text-cam text-xs font-bold active:scale-95 gap-2',
    ghost: 'p-1.5 text-vutruNhat dark:text-night-muted hover:text-cam dark:hover:text-cam hover:bg-cam/10 rounded-lg active:scale-95 gap-1.5 text-xs font-semibold',
  };

  const content = (
    <>
      <ArrowLeft size={size} className="shrink-0 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
      {label && <span>{label}</span>}
    </>
  );

  const combinedClass = `group inline-flex items-center justify-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cam focus-visible:ring-offset-2 shrink-0 select-none ${variantStyles[variant]} ${className}`;

  if (to && !confirmMessage && !onClick) {
    return (
      <Link to={to} className={combinedClass} aria-label={label || 'Quay lại'} title={label || 'Quay lại'}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={combinedClass}
      aria-label={label || 'Quay lại'}
      title={label || 'Quay lại'}
    >
      {content}
    </button>
  );
};

export default BackButton;
