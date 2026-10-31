import api, { PageResponse } from './api';

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  status: 'DRAFT' | 'PUBLISHED';
  sections: Section[];
}

export interface Section {
  id: string;
  title: string;
  orderIndex: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  content: string;
  resourceUrl: string;
  orderIndex: number;
}

export interface Enrollment {
  id: string;
  course: Course;
  enrolledAt: string;
}

export interface LessonProgress {
  id: string;
  lesson: Lesson;
  isCompleted: boolean;
}

export const courseApi = {
  getAllPublished: async (page: number = 0, size: number = 10) => {
    const response = await api.get<PageResponse<Course>>(`/courses?page=${page}&size=${size}`);
    return response.data;
  },
  getTeacherCourses: async (page: number = 0, size: number = 10) => {
    const response = await api.get<PageResponse<Course>>(`/courses/teacher?page=${page}&size=${size}`);
    return response.data;
  },
  getCourseById: async (id: string) => {
    const response = await api.get(`/courses/${id}`);
    return response.data;
  },
  createCourse: async (data: Partial<Course>) => {
    const response = await api.post('/courses', data);
    return response.data;
  },
  updateCourse: async (id: string, data: Partial<Course>) => {
    const response = await api.put(`/courses/${id}`, data);
    return response.data;
  },
  enrollInCourse: async (id: string) => {
    const response = await api.post(`/courses/${id}/enroll`);
    return response.data;
  },
  getMyEnrollments: async (page: number = 0, size: number = 10) => {
    const response = await api.get<PageResponse<Enrollment>>(`/courses/my-enrollments?page=${page}&size=${size}`);
    return response.data;
  },
  markLessonComplete: async (lessonId: string) => {
    const res = await api.post<LessonProgress>(`/courses/lessons/${lessonId}/complete`);
    return res.data;
  },
  getCourseProgress: async (courseId: string) => {
    const res = await api.get<LessonProgress[]>(`/courses/${courseId}/progress`);
    return res.data;
  },

  // --- Curriculum Endpoints ---
  addSection: async (courseId: string, title: string) => {
    const res = await api.post<Section>(`/courses/${courseId}/sections`, { title });
    return res.data;
  },

  updateSection: async (sectionId: string, title: string, orderIndex?: number) => {
    const res = await api.put<Section>(`/courses/sections/${sectionId}`, { title, orderIndex });
    return res.data;
  },

  deleteSection: async (sectionId: string) => {
    await api.delete(`/courses/sections/${sectionId}`);
  },

  addLesson: async (sectionId: string, title: string) => {
    const res = await api.post<Lesson>(`/courses/sections/${sectionId}/lessons`, { title });
    return res.data;
  },

  updateLesson: async (lessonId: string, data: Partial<Lesson>) => {
    const res = await api.put<Lesson>(`/courses/lessons/${lessonId}`, data);
    return res.data;
  },

  deleteLesson: async (lessonId: string) => {
    await api.delete(`/courses/lessons/${lessonId}`);
  }
};
