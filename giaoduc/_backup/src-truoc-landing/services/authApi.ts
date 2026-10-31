import api from './api';

export const authApi = {
  verifyEmail: async (data: { email: string; code: string }) => {
    const res = await api.post('/auth/verify', data);
    return res.data;
  },

  resendVerification: async (data: { email: string }) => {
    const res = await api.post('/auth/resend-verification', data);
    return res.data;
  }
};
