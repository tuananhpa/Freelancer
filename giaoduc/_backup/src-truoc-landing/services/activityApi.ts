import api, { PageResponse } from './api';

export type ActivityCategory = 'NEWS' | 'EVENT' | 'ACHIEVEMENT';
export type ActivityStatus = 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'ARCHIVED';

/** Bài hoạt động ở góc nhìn khách ghé thăm (không có thông tin duyệt). */
export interface PublicActivity {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  coverImageUrl: string | null;
  images: string[];
  category: ActivityCategory;
  pinned: boolean;
  authorName: string | null;
  publishedAt: string | null;
  viewCount: number;
}

/** Bài hoạt động ở góc nhìn quản trị. */
export interface Activity extends Omit<PublicActivity, 'publishedAt'> {
  status: ActivityStatus;
  reviewNote: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityPayload {
  title: string;
  summary?: string;
  content: string;
  coverImageUrl?: string | null;
  images?: string[];
  category?: ActivityCategory;
  pinned?: boolean;
}

export const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  NEWS: 'Tin tức',
  EVENT: 'Sự kiện',
  ACHIEVEMENT: 'Thành tích',
};

export const STATUS_LABELS: Record<ActivityStatus, string> = {
  DRAFT: 'Bản nháp',
  PENDING: 'Chờ duyệt',
  PUBLISHED: 'Đang hiển thị',
  ARCHIVED: 'Đã gỡ',
};

/** Không cần token — dùng cho landing page và trang chi tiết công khai. */
export const publicActivityApi = {
  list: (params: { category?: ActivityCategory; page?: number; size?: number } = {}) => {
    const search = new URLSearchParams();
    if (params.category) search.set('category', params.category);
    search.set('page', String(params.page ?? 0));
    search.set('size', String(params.size ?? 6));
    return api.get<PageResponse<PublicActivity>>(`/public/activities?${search.toString()}`);
  },

  getBySlug: (slug: string) =>
    api.get<PublicActivity>(`/public/activities/${encodeURIComponent(slug)}`),
};

/** Yêu cầu quyền quản trị. */
export const activityApi = {
  list: (params: { status?: ActivityStatus; category?: ActivityCategory; page?: number; size?: number } = {}) => {
    const search = new URLSearchParams();
    if (params.status) search.set('status', params.status);
    if (params.category) search.set('category', params.category);
    search.set('page', String(params.page ?? 0));
    search.set('size', String(params.size ?? 10));
    return api.get<PageResponse<Activity>>(`/activities?${search.toString()}`);
  },

  getById: (id: string) => api.get<Activity>(`/activities/${id}`),

  create: (payload: ActivityPayload) => api.post<Activity>('/activities', payload),

  update: (id: string, payload: ActivityPayload) => api.put<Activity>(`/activities/${id}`, payload),

  submit: (id: string) => api.post<Activity>(`/activities/${id}/submit`),

  approve: (id: string, note?: string) => api.post<Activity>(`/activities/${id}/approve`, { note }),

  reject: (id: string, note?: string) => api.post<Activity>(`/activities/${id}/reject`, { note }),

  archive: (id: string) => api.post<Activity>(`/activities/${id}/archive`),

  setPinned: (id: string, pinned: boolean) =>
    api.patch<Activity>(`/activities/${id}/pin?pinned=${pinned}`),

  pendingCount: () => api.get<{ count: number }>('/activities/pending-count'),

  remove: (id: string) => api.delete<void>(`/activities/${id}`),
};
