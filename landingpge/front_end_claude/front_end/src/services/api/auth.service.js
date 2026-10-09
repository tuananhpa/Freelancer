import { http } from '@/services/http/client';

export const authService = {
  login: (email, password) => http.post('/auth/login', { email, password }),
  me: () => http.get('/auth/me', { auth: true }),
  logout: () => http.post('/auth/logout', {}, { auth: true }),
};
