import React from 'react';
import { Bookmark, Lock } from 'lucide-react';
import UserAvatar from './UserAvatar';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export interface ContentCardChip {
  icon: React.ReactNode;
  label: string;
  colorClass?: string;
}

export interface ContentCardOwner {
  name: string;
  avatar?: string;
}

export interface ContentCardProps {
  title: string;
  description?: string;
  imageUrl?: string;
  coverIcon?: React.ReactNode;
  coverGradient?: string;
  owner?: ContentCardOwner;
  tags?: string[];
  chips?: ContentCardChip[];
  topLeftBadge?: React.ReactNode;
  statusBadge?: React.ReactNode;
  isFavorited?: boolean;
  onToggleFavorite?: (e: React.MouseEvent) => void;
  actions: React.ReactNode;
  /** Enrollment access: locked preview resources are blurred */
  locked?: boolean;
  unlockHint?: string;
  onUnlockClick?: () => void;
}

// ─────────────────────────────────────────────
// Avatar helper
// ─────────────────────────────────────────────
const OwnerAvatar: React.FC<{ owner: ContentCardOwner }> = ({ owner }) => (
  <div className="flex items-center gap-2">
    <UserAvatar
      fullName={owner.name}
      avatarUrl={owner.avatar}
      size="sm"
      className="!w-6 !h-6 !text-[10px] !ring-1"
    />
    <span className="text-xs font-medium text-gray-500 dark:text-night-muted truncate">
      {owner.name}
    </span>
  </div>
);

// ─────────────────────────────────────────────
// ContentCard
// ─────────────────────────────────────────────
const ContentCard: React.FC<ContentCardProps> = ({
  title,
  description,
  imageUrl,
  coverIcon,
  coverGradient = 'from-cam/15 via-edu-yellow to-cam/10 dark:from-cam/20 dark:to-cam/5',
  owner,
  tags,
  chips,
  topLeftBadge,
  statusBadge,
  isFavorited = false,
  onToggleFavorite,
  actions,
  locked = false,
  unlockHint,
  onUnlockClick,
}) => {
  return (
    <article className={`group relative bg-white dark:bg-night-surface rounded-3xl overflow-hidden border-2 border-gray-100 dark:border-night-border shadow-soft hover:shadow-bouncy hover:-translate-y-1 transition-all duration-200 flex flex-col ${locked ? 'hover:translate-y-0 hover:shadow-soft' : ''}`}>
      
      {/* ── Cover area ── */}
      <div
        className={`relative bg-gradient-to-br ${coverGradient} h-40 flex items-center justify-center overflow-hidden shrink-0 ${locked ? 'blur-[2px] opacity-80' : ''}`}
      >
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20" />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-36 h-24">
              <div className="absolute left-0 top-2 w-32 h-20 bg-white/60 dark:bg-white/10 rounded-2xl rotate-[-6deg] shadow-md border border-cam/20" />
              <div className="absolute left-2 top-1 w-32 h-20 bg-white/75 dark:bg-white/15 rounded-2xl rotate-[-3deg] shadow-md border border-cam/20" />
              <div className="absolute left-4 top-0 w-32 h-20 bg-white dark:bg-night-elevated rounded-2xl shadow-lg flex flex-col items-center justify-center gap-2 px-3 border border-cam/10">
                {coverIcon && <span className="text-cam">{coverIcon}</span>}
                <span className="text-[11px] font-bold text-camDam text-center line-clamp-2 leading-tight">
                  {title}
                </span>
              </div>
            </div>
          </div>
        )}

        {topLeftBadge && (
          <div className="absolute top-3 left-3 z-10">{topLeftBadge}</div>
        )}

        {onToggleFavorite && (
          <button
            onClick={onToggleFavorite}
            aria-label={isFavorited ? 'Bỏ yêu thích' : 'Thêm yêu thích'}
            className={`absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur-sm transition-all ${
              isFavorited
                ? 'text-yellow-500 bg-yellow-50/90'
                : 'text-gray-400 hover:text-yellow-400 bg-white/80 opacity-0 group-hover:opacity-100'
            }`}
          >
            <Bookmark size={18} fill={isFavorited ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>

      {/* ── Body ── */}
      <div className={`px-5 pt-4 pb-5 flex-1 flex flex-col gap-3 ${locked ? 'blur-[1.5px] opacity-70 pointer-events-none select-none' : ''}`}>
        
        {/* Title + status badge */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-base leading-snug text-vutru dark:text-night-text line-clamp-2 flex-1">
            {title}
          </h3>
          {statusBadge && <div className="shrink-0 mt-0.5">{statusBadge}</div>}
        </div>

        {owner && <OwnerAvatar owner={owner} />}

        {description && (
          <p className="text-sm text-vutruNhat dark:text-night-muted line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}

        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-semibold bg-cam/10 text-camDam px-2.5 py-0.5 rounded-full border border-cam/20"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex-1" />

        {chips && chips.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {chips.map((chip, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-lg ${
                  chip.colorClass ?? 'bg-kem text-vutruNhat dark:bg-night-elevated dark:text-night-muted'
                }`}
              >
                {chip.icon}
                {chip.label}
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-night-border">
          {actions}
        </div>
      </div>

      {locked && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-white/55 dark:bg-night-page/65 backdrop-blur-[1px] px-5 text-center">
          <div className="w-12 h-12 rounded-full bg-cam/15 text-cam flex items-center justify-center">
            <Lock size={22} strokeWidth={2.25} />
          </div>
          <p className="text-sm font-bold text-vutru dark:text-night-text">
            {unlockHint || 'Đăng ký học để mở tài nguyên này'}
          </p>
          <button
            type="button"
            onClick={onUnlockClick}
            className="btn btn-chinh text-sm px-4 py-2"
          >
            Xem lớp / Đăng ký
          </button>
        </div>
      )}
    </article>
  );
};

export default ContentCard;
