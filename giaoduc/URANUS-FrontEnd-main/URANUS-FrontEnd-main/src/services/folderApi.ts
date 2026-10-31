import api, { PageResponse } from './api';

export interface ContentFolder {
  id: string;
  name: string;
  description?: string;
  color?: string;
  createdAt?: string;
  examCount?: number;
  deckCount?: number;
}

export const folderApi = {
  getMyFolders: (page: number = 0, size: number = 20) => api.get<PageResponse<ContentFolder>>(`/folders?page=${page}&size=${size}`),
  createFolder: (data: { name: string; description?: string; color?: string }) =>
    api.post<ContentFolder>('/folders', data),
  deleteFolder: (id: string) => api.delete(`/folders/${id}`),
};
