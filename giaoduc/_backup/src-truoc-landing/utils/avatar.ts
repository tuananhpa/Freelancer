const AVATAR_COLORS = [
  'from-blue-500 to-blue-700',
  'from-emerald-500 to-emerald-700',
  'from-violet-500 to-violet-700',
  'from-rose-500 to-rose-700',
  'from-amber-500 to-amber-700',
  'from-cyan-500 to-cyan-700',
  'from-fuchsia-500 to-fuchsia-700',
  'from-teal-500 to-teal-700',
];

export function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

  const relevant = parts.slice(-2);
  return relevant.map((part) => part.charAt(0).toUpperCase()).join('');
}

export function getAvatarColor(fullName: string): string {
  let hash = 0;
  for (let i = 0; i < fullName.length; i++) {
    hash = fullName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export const GOOGLE_BG_COLORS = [
  'bg-[#5c6bc0]', 'bg-[#ef5350]', 'bg-[#ab47bc]', 'bg-[#26a69a]',
  'bg-[#ffca28]', 'bg-[#42a5f5]', 'bg-[#ff7043]', 'bg-[#7e57c2]',
  'bg-[#66bb6a]', 'bg-[#ec407a]', 'bg-[#29b6f6]', 'bg-[#d4e157]',
  'bg-[#8d6e63]', 'bg-[#78909c]', 'bg-[#ffa726]', 'bg-[#8c9eff]'
];

export function getGoogleAvatarBg(url: string | null | undefined): string {
  if (!url || !url.includes('ssl.gstatic.com/docs/common/profile')) return '';
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash += url.charCodeAt(i);
  }
  return GOOGLE_BG_COLORS[hash % GOOGLE_BG_COLORS.length];
}

export function isValidAvatarUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:image/')
  );
}
