import api, { PageResponse } from './api';
import { User } from '../context/AuthContext';

export const adminApi = {
  getAllUsers: async (
    page: number = 0, 
    size: number = 10,
    search?: string,
    role?: string,
    status?: string,
    sort?: string
  ) => {
    let url = `/admin/users?page=${page}&size=${size}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (role) url += `&role=${role}`;
    if (status) url += `&status=${status}`;
    if (sort) url += `&sort=${sort}`;
    
    const response = await api.get<PageResponse<User>>(url);
    return response.data;
  },

  getUserById: async (id: string) => {
    const response = await api.get<User>(`/admin/users/${id}`);
    return response.data;
  },

  createUser: async (data: Partial<User> & { password?: string }) => {
    const response = await api.post<User>('/admin/users', data);
    return response.data;
  },

  updateUser: async (id: string, data: Partial<User> & { password?: string }) => {
    const response = await api.put<User>(`/admin/users/${id}`, data);
    return response.data;
  },

  getAllClassrooms: async () => {
    const response = await api.get<any>('/classes/admin/all');
    return response.data;
  },

  getUserClassrooms: async (userId: string) => {
    const response = await api.get<string[]>(`/admin/users/${userId}/classrooms`);
    return response.data;
  },

  updateUserClassrooms: async (userId: string, classroomIds: string[]) => {
    const response = await api.put(`/admin/users/${userId}/classrooms`, classroomIds);
    return response.data;
  },

  bulkUpdateStatus: async (userIds: string[], status: 'ACTIVE' | 'BANNED' | 'INACTIVE') => {
    const response = await api.put('/admin/users/bulk-status', { userIds, status });
    return response.data;
  },

  updateStudentCode: async (userId: string, studentCode: string) => {
    const response = await api.patch<User>(`/admin/users/${userId}/student-code`, { studentCode });
    return response.data;
  },

  deleteUser: async (id: string) => {
    await api.delete(`/admin/users/${id}`);
  },

  // ---- Admin Groups ----

  getAdminGroups: async () => {
    const response = await api.get<any>('/classes/admin/all');
    return response.data;
  },

  createAdminGroup: async (name: string, description?: string, subject?: string) => {
    const response = await api.post<any>('/classes/admin/groups', { name, description: description || '', subject: subject || '' });
    return response.data;
  },

  deleteAdminGroup: async (classroomId: string) => {
    await api.delete(`/classes/admin/groups/${classroomId}`);
  },

  getStudentsByClassroom: async (classroomId: string) => {
    const response = await api.get<any>(`/v1/students/by-classroom/${classroomId}`);
    return response.data;
  },

  importAdminStudents: async (file: File, classroomId?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (classroomId) formData.append('classroomId', classroomId);
    const response = await api.post<any>('/v1/students/import-admin', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
