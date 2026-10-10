import { http } from '@/services/http/client';

export const chatService = {
  startSession: (payload) => http.post('/chat/sessions', payload),
  getMessages: (sessionId) => http.get(`/chat/sessions/${sessionId}/messages`),
  sendMessage: (sessionId, text) => http.post(`/chat/sessions/${sessionId}/messages`, { text }),
};
