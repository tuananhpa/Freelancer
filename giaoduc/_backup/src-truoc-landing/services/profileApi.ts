import api from './api';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  role: string;
  authProvider: 'LOCAL' | 'GOOGLE';
  createdAt?: string;
}

export const profileApi = {
  getProfile: () => api.get<UserProfile>('/users/me'),
  updateProfile: (data: { fullName: string; phone?: string; avatarUrl?: string }) =>
    api.put<UserProfile>('/users/me', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/users/me/password', data),
};
