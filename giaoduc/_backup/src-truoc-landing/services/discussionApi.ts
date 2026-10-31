import api from './api';

export interface Reply {
  id: string;
  discussionId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  isAcceptedAnswer: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Discussion {
  id: string;
  courseId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  title: string;
  content: string;
  isPinned: boolean;
  isResolved: boolean;
  createdAt: string;
  updatedAt: string;
  replyCount: number;
  replies?: Reply[];
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

export const discussionApi = {
  getCourseDiscussions: async (courseId: string, page = 0): Promise<PageResponse<Discussion>> => {
    const response = await api.get(`/v1/discussions/course/${courseId}`, { params: { page } });
    return response.data;
  },

  getDiscussionDetails: async (discussionId: string): Promise<Discussion> => {
    const response = await api.get(`/v1/discussions/${discussionId}`);
    return response.data;
  },

  createDiscussion: async (courseId: string, title: string, content: string): Promise<Discussion> => {
    const response = await api.post(`/v1/discussions/course/${courseId}`, { title, content });
    return response.data;
  },

  addReply: async (discussionId: string, content: string): Promise<Reply> => {
    const response = await api.post(`/v1/discussions/${discussionId}/replies`, { content });
    return response.data;
  }
};
