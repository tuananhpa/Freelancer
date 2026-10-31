import api from './api';

export interface ClassExamResponse {
  id: string;
  classroomId: string;
  examId: string;
  examTitle: string;
  durationMinutes: number;
  openTime: string;
  closeTime: string;
  folderId?: string;
  createdAt: string;
  questionCount?: number;
  examType?: string;
  /** Thời gian kết thúc được đặt từ chính đề thi (Exam.endTime) */
  examEndTime?: string;
  /** Thời gian bắt đầu được đặt từ chính đề thi (Exam.startTime) */
  examStartTime?: string;
}

export interface ClassExamRequest {
  examId: string;
  openTime?: string;
  closeTime?: string;
  folderId?: string;
}

export interface UpdateClassExamRequest {
  openTime?: string;
  closeTime?: string;
  folderId?: string;
}

export const classExamApi = {
  getClassExams: async (classroomId: string) => {
    const response = await api.get<ClassExamResponse[]>(`/v1/class-exams/classroom/${classroomId}`);
    return response.data;
  },

  linkExamToClassroom: async (classroomId: string, data: ClassExamRequest) => {
    const response = await api.post<ClassExamResponse>(`/v1/class-exams/classroom/${classroomId}`, data);
    return response.data;
  },

  unlinkExamFromClassroom: async (id: string) => {
    const response = await api.delete(`/v1/class-exams/${id}`);
    return response.data;
  },

  updateClassExam: async (id: string, data: UpdateClassExamRequest) => {
    const response = await api.put<ClassExamResponse>(`/v1/class-exams/${id}`, data);
    return response.data;
  },

  getClassExamsByExamId: async (examId: string) => {
    const response = await api.get<ClassExamResponse[]>(`/v1/class-exams/exam/${examId}`);
    return response.data;
  },

  batchSyncClassExams: async (examId: string, assignments: { classroomId: string, folderId?: string, openTime?: string, closeTime?: string }[]) => {
    const response = await api.post(`/v1/class-exams/exam/${examId}/batch-sync`, { assignments });
    return response.data;
  }
};
