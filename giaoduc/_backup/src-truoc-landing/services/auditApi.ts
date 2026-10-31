import api from './api';

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entityName: string;
  entityId: string;
  previousState: any | null;
  newState: any | null;
  ipAddress: string;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

export const auditApi = {
  getLogs: async (page = 0, size = 20): Promise<PageResponse<AuditLog>> => {
    const response = await api.get('/audit-logs', { params: { page, size } });
    return response.data;
  }
};
