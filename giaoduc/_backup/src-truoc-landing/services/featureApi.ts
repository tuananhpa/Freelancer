import api from './api';

export const gamificationApi = {
  getStats: () => api.get<{
    totalXp: number;
    diamonds?: number;
    currentStreak: number;
    longestStreak: number;
    badges: string[];
    uranianLevel?: number;
    uranianHealth?: number;
    uranianMood?: string;
    uranianTitle?: string;
    lastActivityDate?: string;
    recentActivities?: { activityType: string; xpEarned: number; activityDate: string }[];
  }>('/gamification'),
  getLeaderboard: (timeframe = 'WEEK', metric = 'TIME') =>
    api.get<
      {
        rank: number;
        userId: string;
        fullName: string;
        username: string;
        avatarUrl?: string | null;
        level: number;
        totalXp: number;
        studyMinutes: number;
        currentStreak: number;
      }[]
    >(`/gamification/leaderboard?timeframe=${timeframe}&metric=${metric}`),
  recordActivity: (activityType: string) => api.post('/gamification/activity', { activityType }),
};

export const learningPathApi = {
  getStatus: () => api.get('/learning-path/status'),
  submitPlacement: (skillScores: Record<string, number>) => api.post('/learning-path/placement', skillScores),
  getPlacementTest: () => api.get('/learning-path/placement-test'),
  submitPlacementTest: (answers: Record<string, string>) => api.post('/learning-path/placement-test/submit', answers),
  getRecommendations: () => api.get('/learning-path/recommendations'),
};

export const searchApi = {
  search: (q: string) => api.get(`/search?q=${encodeURIComponent(q)}`),
};

export const calendarApi = {
  getEvents: (from: string, to: string) => api.get(`/calendar/events?from=${from}&to=${to}`),
};

export const shareApi = {
  createShare: (resourceType: string, resourceId: string) =>
    api.post('/share', { resourceType, resourceId }),
  resolveShare: (token: string) => api.get(`/share/${token}`),
  cloneDeck: (deckId: string) => api.post(`/share/clone/deck/${deckId}`),
};

export const analyticsApi = {
  getProgressReport: () => api.get('/analytics/progress-report'),
};
