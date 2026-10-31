/**
 * Comprehensive Date & Timezone utilities for Điểm Sáng.
 * Handles robust parsing, timezone safety, and deadline calculations.
 */

/**
 * Safely formats a YYYY-MM-DD date string to DD/MM/YYYY without timezone shifting.
 */
export const formatShortDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '-';

  const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const parts = datePart.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }

  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('vi-VN');
  } catch {
    return dateStr;
  }
};

/**
 * Converts any backend date representation into `YYYY-MM-DDTHH:mm` for `<input type="datetime-local">`
 * without corrupting local hour/minute.
 */
export const toLocalDatetimeInput = (dateStr?: string | null): string => {
  if (!dateStr) return '';

  try {
    // If it's an ISO string with 'Z' (explicit UTC)
    if (dateStr.endsWith('Z')) {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    // If it's already a local ISO string (e.g. "2026-08-25T23:59" or "2026-08-25T23:59:00")
    if (dateStr.includes('T')) {
      return dateStr.slice(0, 16);
    }

    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
};

/**
 * Formats a local datetime-local value (YYYY-MM-DDTHH:mm) to ISO local string (YYYY-MM-DDTHH:mm:ss)
 * to be safely sent to backend LocalDateTime endpoints without timezone stripping skew.
 */
export const toApiDatetimeString = (localInputVal: string): string | undefined => {
  if (!localInputVal || !localInputVal.trim()) return undefined;
  const trimmed = localInputVal.trim();
  // Ensure valid YYYY-MM-DDTHH:mm or YYYY-MM-DDTHH:mm:ss format with 4-digit year
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return undefined;
  const year = parseInt(match[1], 10);
  if (year < 1900 || year > 2100) return undefined;
  if (trimmed.length === 16) {
    return `${trimmed}:00`;
  }
  return trimmed;
};

export interface DeadlineInfo {
  label: string;
  formatted: string;
  isUrgent: boolean;
  isOverdue: boolean;
  relative: string;
  diffDays: number;
}

/**
 * Generates an accurate, localized deadline label & status.
 */
export const parseDeadlineInfo = (dueDateStr?: string | null): DeadlineInfo => {
  if (!dueDateStr) {
    return {
      label: 'Không có hạn nộp',
      formatted: 'Không giới hạn thời gian',
      isUrgent: false,
      isOverdue: false,
      relative: 'Không có hạn',
      diffDays: 999,
    };
  }

  try {
    const dl = new Date(dueDateStr);
    if (isNaN(dl.getTime())) {
      return {
        label: 'Không có hạn nộp',
        formatted: 'Không có hạn',
        isUrgent: false,
        isOverdue: false,
        relative: 'Không có hạn',
        diffDays: 999,
      };
    }

    const now = new Date();
    const diffMs = dl.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffHours / 24);

    const pad = (n: number) => n.toString().padStart(2, '0');
    const timePart = `${pad(dl.getHours())}:${pad(dl.getMinutes())}`;
    const datePart = `${pad(dl.getDate())}/${pad(dl.getMonth() + 1)}/${dl.getFullYear()}`;
    const formatted = `${timePart} ${datePart}`;

    const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayOfWeekStr = daysOfWeek[dl.getDay()];
    const detailedFormatted = `${timePart} ${dayOfWeekStr}, ngày ${pad(dl.getDate())}/${pad(dl.getMonth() + 1)}`;

    if (diffMs < 0) {
      return {
        label: `Quá hạn (${formatted})`,
        formatted: detailedFormatted,
        isUrgent: false,
        isOverdue: true,
        relative: 'Đã quá hạn',
        diffDays,
      };
    }

    if (diffDays === 0) {
      return {
        label: `Hôm nay ${timePart}`,
        formatted: detailedFormatted,
        isUrgent: true,
        isOverdue: false,
        relative: diffHours <= 1 ? 'Sắp hết hạn trong 1 giờ' : `Còn ${diffHours} giờ`,
        diffDays,
      };
    }

    if (diffDays === 1) {
      return {
        label: `Ngày mai ${timePart}`,
        formatted: detailedFormatted,
        isUrgent: true,
        isOverdue: false,
        relative: 'Hạn chót ngày mai',
        diffDays,
      };
    }

    return {
      label: `Hạn: ${timePart} ${pad(dl.getDate())}/${pad(dl.getMonth() + 1)}`,
      formatted: detailedFormatted,
      isUrgent: diffDays <= 2,
      isOverdue: false,
      relative: `Còn ${diffDays} ngày`,
      diffDays,
    };
  } catch {
    return {
      label: 'Hạn nộp không hợp lệ',
      formatted: 'Không rõ',
      isUrgent: false,
      isOverdue: false,
      relative: '',
      diffDays: 0,
    };
  }
};

/**
 * Calculates quick deadline presets based on local time.
 */
export const getQuickPresetDeadline = (
  preset: 'TODAY_EOD' | 'TOMORROW_EOD' | 'THIS_WEEKEND' | 'NEXT_WEEK' | 'CLEAR'
): string => {
  if (preset === 'CLEAR') return '';

  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');

  const target = new Date(now);

  if (preset === 'TODAY_EOD') {
    target.setHours(23, 59, 0, 0);
  } else if (preset === 'TOMORROW_EOD') {
    target.setDate(target.getDate() + 1);
    target.setHours(23, 59, 0, 0);
  } else if (preset === 'THIS_WEEKEND') {
    // Target next Sunday
    const currentDay = target.getDay(); // 0 is Sunday, 1 is Monday...
    const daysUntilSunday = currentDay === 0 ? 0 : 7 - currentDay;
    target.setDate(target.getDate() + daysUntilSunday);
    target.setHours(23, 59, 0, 0);
  } else if (preset === 'NEXT_WEEK') {
    target.setDate(target.getDate() + 7);
    target.setHours(23, 59, 0, 0);
  }

  return `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}T${pad(target.getHours())}:${pad(target.getMinutes())}`;
};

export interface LastActiveStatus {
  status: 'ONLINE' | 'RECENT' | 'DAYS_AGO' | 'AT_RISK' | 'INACTIVE';
  label: string;
  badgeClass: string;
  dotClass: string;
  isOnline: boolean;
  isAtRisk: boolean;
  daysAgo: number;
}

/**
 * Evaluates last active timestamp to LMS activity status.
 */
export const formatLastActiveStatus = (lastActiveAt?: string | null): LastActiveStatus => {
  if (!lastActiveAt) {
    return {
      status: 'INACTIVE',
      label: 'Chưa có hoạt động',
      badgeClass: 'bg-gray-100 dark:bg-night-elevated text-gray-500 dark:text-night-muted',
      dotClass: 'bg-gray-300 dark:bg-gray-600',
      isOnline: false,
      isAtRisk: false,
      daysAgo: 999,
    };
  }

  try {
    const activeDate = new Date(lastActiveAt);
    if (isNaN(activeDate.getTime())) {
      return {
        status: 'INACTIVE',
        label: 'Không xác định',
        badgeClass: 'bg-gray-100 text-gray-500',
        dotClass: 'bg-gray-400',
        isOnline: false,
        isAtRisk: false,
        daysAgo: 999,
      };
    }

    const now = new Date();
    const diffMs = now.getTime() - activeDate.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    // Online if active within last 10 minutes
    if (diffMins < 10) {
      return {
        status: 'ONLINE',
        label: 'Vừa mới hoạt động',
        badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80',
        dotClass: 'bg-emerald-500 animate-pulse',
        isOnline: true,
        isAtRisk: false,
        daysAgo: 0,
      };
    }

    // Active today (within 24 hours)
    if (diffHours < 24) {
      const label = diffHours === 0 ? `${diffMins} phút trước` : `${diffHours} giờ trước`;
      return {
        status: 'RECENT',
        label: `Hoạt động ${label}`,
        badgeClass: 'bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400',
        dotClass: 'bg-emerald-400',
        isOnline: false,
        isAtRisk: false,
        daysAgo: 0,
      };
    }

    // Active 1 - 6 days ago
    if (diffDays < 7) {
      return {
        status: 'DAYS_AGO',
        label: `Hoạt động ${diffDays} ngày trước`,
        badgeClass: 'bg-gray-100 dark:bg-night-elevated text-gray-600 dark:text-night-muted',
        dotClass: 'bg-amber-400',
        isOnline: false,
        isAtRisk: false,
        daysAgo: diffDays,
      };
    }

    // Inactive for 7+ days (At risk)
    return {
      status: 'AT_RISK',
      label: `Không hoạt động ${diffDays} ngày`,
      badgeClass: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/80',
      dotClass: 'bg-rose-500',
      isOnline: false,
      isAtRisk: true,
      daysAgo: diffDays,
    };
  } catch {
    return {
      status: 'INACTIVE',
      label: 'Chưa có hoạt động',
      badgeClass: 'bg-gray-100 text-gray-500',
      dotClass: 'bg-gray-300',
      isOnline: false,
      isAtRisk: false,
      daysAgo: 999,
    };
  }
};

export interface DetailedDeadlineInfo {
  label: string;
  relative: string;
  formattedDate: string;
  formattedTime: string;
  fullDateTime: string;
  isUrgent: boolean;
  isOverdue: boolean;
  isToday: boolean;
  isTomorrow: boolean;
  diffHours: number;
  diffDays: number;
  statusColor: 'rose' | 'amber' | 'blue' | 'emerald' | 'gray';
  badgeClass: string;
}

/**
 * Detailed & consistent deadline formatter for all UI badges, cards, and list views.
 */
export function formatDeadlineDetailed(deadlineStr?: string | null): DetailedDeadlineInfo {
  if (!deadlineStr) {
    return {
      label: 'Không có hạn',
      relative: 'Không có hạn',
      formattedDate: '',
      formattedTime: '',
      fullDateTime: 'Không giới hạn thời gian',
      isUrgent: false,
      isOverdue: false,
      isToday: false,
      isTomorrow: false,
      diffHours: 9999,
      diffDays: 999,
      statusColor: 'gray',
      badgeClass: 'bg-gray-100 text-gray-600 dark:bg-night-elevated dark:text-night-muted border border-gray-200/60 dark:border-night-border',
    };
  }

  try {
    const dl = new Date(deadlineStr);
    if (isNaN(dl.getTime())) {
      return {
        label: 'Không rõ hạn',
        relative: 'Không rõ',
        formattedDate: '',
        formattedTime: '',
        fullDateTime: 'Không rõ',
        isUrgent: false,
        isOverdue: false,
        isToday: false,
        isTomorrow: false,
        diffHours: 0,
        diffDays: 0,
        statusColor: 'gray',
        badgeClass: 'bg-gray-100 text-gray-500',
      };
    }

    const now = new Date();
    const diffMs = dl.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffHours / 24);

    const pad = (n: number) => n.toString().padStart(2, '0');
    const timeStr = `${pad(dl.getHours())}:${pad(dl.getMinutes())}`;
    const dateStr = `${pad(dl.getDate())}/${pad(dl.getMonth() + 1)}`;
    const fullDateStr = `${pad(dl.getDate())}/${pad(dl.getMonth() + 1)}/${dl.getFullYear()}`;
    const fullDateTime = `${timeStr} - ${fullDateStr}`;

    const isToday =
      dl.getDate() === now.getDate() &&
      dl.getMonth() === now.getMonth() &&
      dl.getFullYear() === now.getFullYear();

    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const isTomorrow =
      dl.getDate() === tomorrow.getDate() &&
      dl.getMonth() === tomorrow.getMonth() &&
      dl.getFullYear() === tomorrow.getFullYear();

    // 1. Overdue
    if (diffMs < 0) {
      return {
        label: `Quá hạn: ${timeStr} (${dateStr})`,
        relative: 'Đã quá hạn',
        formattedDate: dateStr,
        formattedTime: timeStr,
        fullDateTime,
        isUrgent: true,
        isOverdue: true,
        isToday,
        isTomorrow: false,
        diffHours,
        diffDays,
        statusColor: 'rose',
        badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80',
      };
    }

    // 2. Today
    if (isToday) {
      const remainHint = diffHours <= 1 ? 'Sắp hết hạn' : `Còn ${diffHours}h`;
      return {
        label: `Hôm nay ${timeStr} (${remainHint})`,
        relative: `Hôm nay (${remainHint})`,
        formattedDate: dateStr,
        formattedTime: timeStr,
        fullDateTime,
        isUrgent: true,
        isOverdue: false,
        isToday: true,
        isTomorrow: false,
        diffHours,
        diffDays,
        statusColor: 'amber',
        badgeClass: 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200 border border-amber-300 dark:border-amber-700 shadow-2xs animate-pulse',
      };
    }

    // 3. Tomorrow
    if (isTomorrow) {
      return {
        label: `Hạn: ${timeStr} Ngày mai (${dateStr})`,
        relative: 'Hạn chót ngày mai',
        formattedDate: dateStr,
        formattedTime: timeStr,
        fullDateTime,
        isUrgent: true,
        isOverdue: false,
        isToday: false,
        isTomorrow: true,
        diffHours,
        diffDays,
        statusColor: 'amber',
        badgeClass: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
      };
    }

    // 4. Upcoming within 2-7 days
    if (diffDays <= 7) {
      return {
        label: `Hạn: ${timeStr} ${dateStr} (Còn ${diffDays} ngày)`,
        relative: `Còn ${diffDays} ngày`,
        formattedDate: dateStr,
        formattedTime: timeStr,
        fullDateTime,
        isUrgent: diffDays <= 2,
        isOverdue: false,
        isToday: false,
        isTomorrow: false,
        diffHours,
        diffDays,
        statusColor: diffDays <= 2 ? 'amber' : 'blue',
        badgeClass: diffDays <= 2
          ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
          : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
      };
    }

    // 5. Normal Upcoming (> 7 days)
    return {
      label: `Hạn: ${timeStr} ${dateStr}`,
      relative: `Còn ${diffDays} ngày`,
      formattedDate: dateStr,
      formattedTime: timeStr,
      fullDateTime,
      isUrgent: false,
      isOverdue: false,
      isToday: false,
      isTomorrow: false,
      diffHours,
      diffDays,
      statusColor: 'blue',
      badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60',
    };
  } catch {
    return {
      label: 'Hạn không hợp lệ',
      relative: 'Không rõ',
      formattedDate: '',
      formattedTime: '',
      fullDateTime: 'Không rõ',
      isUrgent: false,
      isOverdue: false,
      isToday: false,
      isTomorrow: false,
      diffHours: 0,
      diffDays: 0,
      statusColor: 'gray',
      badgeClass: 'bg-gray-100 text-gray-500',
    };
  }
}

/**
 * Format deadline with label and urgency status
 */
export function formatDeadline(deadlineStr?: string | null): { label: string; isUrgent: boolean; isOverdue: boolean } {
  const info = formatDeadlineDetailed(deadlineStr);
  return {
    label: info.label,
    isUrgent: info.isUrgent,
    isOverdue: info.isOverdue,
  };
}
