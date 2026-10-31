import api from './api';

export type ResourceType = 'DOCUMENT' | 'VIDEO' | 'EXAM' | 'SLIDE' | 'AUDIO';

export interface ContentResource {
  id: string;
  title: string;
  description?: string;
  resourceType: ResourceType;
  grade: string;
  subject: string;
  curriculumBook?: string;
  authorName: string;
  uploaderId: string;
  uploaderName: string;
  uploaderAvatar?: string;
  uploaderRole?: string;
  folderId?: string;
  folderName?: string;
  fileUrl?: string;
  externalUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileFormat?: string;
  attachedExamId?: string;
  attachedExamTitle?: string;
  audioTranscript?: string;
  learningOutcomes?: string;
  writingPrompt?: string;
  tags?: string;
  isPublic: boolean;
  viewCount: number;
  likeCount: number;
  bookmarkCount: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceRequest {
  title: string;
  description?: string;
  resourceType: ResourceType;
  grade: string;
  subject: string;
  curriculumBook?: string;
  authorName?: string;
  folderId?: string;
  fileUrl?: string;
  externalUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileFormat?: string;
  attachedExamId?: string;
  audioTranscript?: string;
  learningOutcomes?: string;
  writingPrompt?: string;
  tags?: string;
  isPublic?: boolean;
}

export interface ResourceSubmission {
  id: string;
  resourceId: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  content: string;
  score?: number;
  feedback?: string;
  status: 'PENDING' | 'GRADED';
  submittedAt: string;
  gradedAt?: string;
  gradedByName?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export const resourceApi = {
  getResources: (params: {
    resourceType?: string;
    grade?: string;
    subject?: string;
    search?: string;
    page?: number;
    size?: number;
  }) =>
    api.get<PageResponse<ContentResource>>('/resources', { params }),

  getResourceById: (id: string) =>
    api.get<ContentResource>(`/resources/${id}`),

  createResource: (data: ResourceRequest) =>
    api.post<ContentResource>('/resources', data),

  updateResource: (id: string, data: ResourceRequest) =>
    api.put<ContentResource>(`/resources/${id}`, data),

  deleteResource: (id: string) =>
    api.delete<void>(`/resources/${id}`),

  toggleLike: (id: string) =>
    api.post<{ liked: boolean }>(`/resources/${id}/like`),

  toggleBookmark: (id: string, folderId?: string) =>
    api.post<{ bookmarked: boolean }>(`/resources/${id}/bookmark`, null, {
      params: folderId ? { folderId } : undefined,
    }),

  getMyBookmarks: (page = 0, size = 15) =>
    api.get<PageResponse<ContentResource>>('/resources/my-bookmarks', {
      params: { page, size },
    }),

  getMyUploads: (page = 0, size = 15) =>
    api.get<PageResponse<ContentResource>>('/resources/my-uploads', {
      params: { page, size },
    }),

  submitWriting: (resourceId: string, content: string) =>
    api.post<ResourceSubmission>(`/resources/${resourceId}/submissions`, { content }),

  getMySubmission: (resourceId: string) =>
    api.get<ResourceSubmission | null>(`/resources/${resourceId}/submissions/me`),

  getSubmissions: (resourceId: string) =>
    api.get<ResourceSubmission[]>(`/resources/${resourceId}/submissions`),

  gradeSubmission: (submissionId: string, score: number, feedback?: string) =>
    api.post<ResourceSubmission>(`/resources/submissions/${submissionId}/grade`, { score, feedback }),
};
