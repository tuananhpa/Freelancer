import api, { PageResponse } from './api';

export interface Assignment {
  id: string;
  title: string;
  description: string;
  attachmentUrl: string;
  dueDate: string;
  maxScore: number;
  courseId: string;
  courseName: string;
  classroomId?: string;
  classroomName?: string;
  folderId?: string;
  teacherName: string;
  assignmentType?: string;
  instructions?: string;
  minWordCount?: number;
  maxWordCount?: number;
  expectedAnswer?: string;
  languageLevel?: string;
  rubricConfig?: string;
  createdAt: string;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  content: string;
  fileUrl: string;
  score: number;
  feedback: string;
  status: string;
  submittedAt: string;
  gradedAt: string;
}

// axios tra ve ca response; interceptor chi go lop ApiResponse ben trong response.data,
// nen phai lay .data o day - truoc day tra nguyen response, man cham bai bi crash
// (subData.content undefined) va tab "Bai tap tren lop" khong hien bai tap nao.
export const assignmentApi = {
  getAssignmentsByCourse: (courseId: string, page = 0, size = 10) =>
    api.get<PageResponse<Assignment>>(`/v1/assignments/course/${courseId}?page=${page}&size=${size}`).then((r) => r.data),

  getAssignmentsByClassroom: (classroomId: string, page = 0, size = 10) =>
    api.get<PageResponse<Assignment>>(`/v1/assignments/classroom/${classroomId}?page=${page}&size=${size}`).then((r) => r.data),

  getAssignmentById: (id: string) =>
    api.get<Assignment>(`/v1/assignments/${id}`).then((r) => r.data),

  createAssignment: (data: Partial<Assignment>) =>
    api.post<Assignment>('/v1/assignments', data).then((r) => r.data),

  updateAssignment: (id: string, data: Partial<Assignment>) =>
    api.put<Assignment>(`/v1/assignments/${id}`, data).then((r) => r.data),

  deleteAssignment: (id: string) =>
    api.delete(`/v1/assignments/${id}`).then((r) => r.data),

  submitAssignment: (id: string, data: { content: string, fileUrl?: string }) =>
    api.post<AssignmentSubmission>(`/v1/assignments/${id}/submit`, data).then((r) => r.data),

  getMySubmission: (id: string) =>
    api.get<AssignmentSubmission>(`/v1/assignments/${id}/submissions/my`).then((r) => r.data),

  getSubmissions: (id: string, page = 0, size = 10) =>
    api.get<PageResponse<AssignmentSubmission>>(`/v1/assignments/${id}/submissions?page=${page}&size=${size}`).then((r) => r.data),

  gradeSubmission: (submissionId: string, data: { score: number, feedback: string }) =>
    api.post<AssignmentSubmission>(`/v1/assignments/submissions/${submissionId}/grade`, data).then((r) => r.data)
};
