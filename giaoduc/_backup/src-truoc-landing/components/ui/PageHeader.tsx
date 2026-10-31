import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  icon: LucideIcon;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Hien ngay sau tieu de, VD huy hieu "3 can tra loi". */
  badge?: React.ReactNode;
  /** Nut hanh dong ben phai. */
  actions?: React.ReactNode;
  className?: string;
}

/** Tieu de dung chung cho cac trang cap menu: icon 2D trong o nen mau thuong hieu + tieu de + mo ta. */
const PageHeader: React.FC<PageHeaderProps> = ({ icon: Icon, title, subtitle, badge, actions, className = '' }) => (
  <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${className}`}>
    <div className="flex items-center gap-2.5 min-w-0">
      <div className="w-10 h-10 rounded-2xl bg-cam/10 dark:bg-cam/20 flex items-center justify-center text-cam shrink-0">
        <Icon size={22} strokeWidth={2} aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-vutru dark:text-night-text leading-tight">
            {title}
          </h1>
          {badge}
        </div>
        {subtitle && (
          <p className="text-xs sm:text-sm text-vutruNhat dark:text-night-muted mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
    {actions && <div className="flex items-center gap-3 shrink-0 flex-wrap">{actions}</div>}
  </div>
);

export default PageHeader;
