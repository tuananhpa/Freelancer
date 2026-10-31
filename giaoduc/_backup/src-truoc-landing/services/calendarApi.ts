import api from './api';

export enum EventType {
  DEADLINE = 'DEADLINE',
  LIVE_SESSION = 'LIVE_SESSION',
  EXAM = 'EXAM',
  OTHER = 'OTHER'
}

export interface CalendarEvent {
  id: string;
  courseId: string | null;
  courseName: string | null;
  title: string;
  description: string;
  eventType: EventType;
  startTime: string;
  endTime: string;
  meetingLink: string | null;
}

export const calendarApi = {
  getEvents: async (start: string, end: string): Promise<CalendarEvent[]> => {
    const response = await api.get('/calendar', { params: { start, end } });
    return response.data;
  },

  createEvent: async (eventData: Omit<CalendarEvent, 'id' | 'courseName'>): Promise<CalendarEvent> => {
    const response = await api.post('/calendar', eventData);
    return response.data;
  }
};
