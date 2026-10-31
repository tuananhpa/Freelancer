import React, { useEffect, useState } from 'react';
import { getInitials, isValidAvatarUrl } from '../../utils/avatar';

interface UserAvatarProps {
  fullName: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-9 h-9 text-sm',
  md: 'w-12 h-12 text-base',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-24 h-24 text-2xl',
};

const BG_COLORS = [
  'bg-[#5c6bc0]', 'bg-[#ef5350]', 'bg-[#ab47bc]', 'bg-[#26a69a]',
  'bg-[#ffca28]', 'bg-[#42a5f5]', 'bg-[#ff7043]', 'bg-[#7e57c2]',
  'bg-[#66bb6a]', 'bg-[#ec407a]', 'bg-[#29b6f6]', 'bg-[#d4e157]',
  'bg-[#8d6e63]', 'bg-[#78909c]', 'bg-[#ffa726]', 'bg-[#8c9eff]'
];

const getGoogleAvatarBg = (url: string | null | undefined) => {
  if (!url || !url.includes('ssl.gstatic.com/docs/common/profile')) return '';
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash += url.charCodeAt(i);
  }
  return BG_COLORS[hash % BG_COLORS.length];
};

const UserAvatar: React.FC<UserAvatarProps> = ({
  fullName,
  avatarUrl,
  size = 'sm',
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);
  const showImage = isValidAvatarUrl(avatarUrl) && !imgError;
  const initials = getInitials(fullName);
  const baseClass = `${sizeClasses[size]} rounded-full ring-2 ring-cam/30 shrink-0`;

  useEffect(() => {
    setImgError(false);
  }, [avatarUrl]);

  if (showImage) {
    const isGoogleAvatar = avatarUrl?.includes('ssl.gstatic.com/docs/common/profile');
    const googleBg = getGoogleAvatarBg(avatarUrl);

    return (
      <img
        src={avatarUrl}
        alt={fullName}
        className={`${baseClass} object-cover ${googleBg} ${isGoogleAvatar ? 'p-1 sm:p-[6px]' : ''} ${className}`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={`${baseClass} bg-cam flex items-center justify-center text-white font-bold ${className}`}
      title={fullName}
      aria-label={`Avatar của ${fullName}`}
    >
      {initials}
    </div>
  );
};

export default UserAvatar;
