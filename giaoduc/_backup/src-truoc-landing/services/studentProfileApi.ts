import api from './api';

export interface StudentProfileInfo {
  id: string;
  studentCode: string;
  fullName: string;
  dateOfBirth: string; // ISO date
  phone: string;
  facility: string;
  status: 'PENDING' | 'ACTIVE';
  userId?: string;
  userStatus?: string;
  enrollments: { classroomId: string; classroomName: string }[];
  createdAt: string;
}

export const studentProfileApi = {
  /**
   * Admin: Import students from Excel file, mapped to a specific classroom.
   */
  importStudents: async (file: File, classroomId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('classroomId', classroomId);
    const res = await api.post<any>('/v1/students/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data.data || res.data;
  },

  /**
   * Admin: Import students from Excel file globally (no classroom).
   */
  importGlobalStudents: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<any>('/v1/students/import-global', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data.data || res.data;
  },

  /**
   * Admin: Get paginated list of all imported student profiles.
   */
  getStudents: async (
    keyword?: string, 
    page = 0, 
    size = 20,
    filters?: {
      className?: string;
      facility?: string;
      status?: string;
      teacherName?: string;
      fromDate?: string;
      toDate?: string;
    }
  ) => {
    const params: Record<string, string | number> = { page, size };
    if (keyword) params.keyword = keyword;
    if (filters?.className) params.className = filters.className;
    if (filters?.facility) params.facility = filters.facility;
    if (filters?.status) params.status = filters.status;
    if (filters?.teacherName) params.teacherName = filters.teacherName;
    if (filters?.fromDate) params.fromDate = filters.fromDate;
    if (filters?.toDate) params.toDate = filters.toDate;

    const res = await api.get('/v1/students', { params });
    return res.data.data || res.data;
  },

  /**
   * Public: Verify a student code and return masked info (to confirm before registering).
   */
  verifyStudentCode: async (code: string, fullName: string): Promise<StudentProfileInfo> => {
    const res = await api.get(`/v1/students/verify-code?code=${encodeURIComponent(code)}&fullName=${encodeURIComponent(fullName)}`);
    return res.data.data || res.data;
  },

  getProfileByUserId: async (userId: string): Promise<StudentProfileInfo> => {
    const res = await api.get(`/v1/students/user/${userId}`);
    return res.data.data || res.data;
  },

  /**
   * Public: Register a new account linked to a student code.
   */
  registerWithStudentCode: async (data: {
    studentCode: string;
    dateOfBirth: string; // DD/MM/YYYY
    email: string;
    password: string;
  }) => {
    const res = await api.post('/v1/students/register', data);
    return res.data;
  },

  /**
   * Admin: Update editable fields of a student profile.
   */
  updateProfile: async (id: string, data: {
    studentCode?: string;
    fullName?: string;
    dateOfBirth?: string;
    phone?: string;
    facility?: string;
  }) => {
    const res = await api.put(`/v1/students/${id}`, data);
    return res.data.data || res.data;
  },

  /**
   * Admin: Delete a student profile.
   */
  deleteProfile: async (id: string) => {
    const res = await api.delete(`/v1/students/${id}`);
    return res.data;
  },

  /**
   * Admin: Bulk delete student profiles.
   */
  bulkDeleteProfiles: async (ids: string[]) => {
    const res = await api.delete('/v1/students/bulk', { data: ids });
    return res.data;
  },

  /**
   * Admin: Create a new student profile manually or link if exists
   */
  createOrLinkProfile: async (data: {
    studentCode: string;
    fullName: string;
    dateOfBirth?: string;
    phone?: string;
    facility?: string;
    classroomId?: string;
  }) => {
    const res = await api.post('/v1/students', data);
    return res.data.data || res.data;
  },

  /**
   * Admin: Add existing student to a classroom
   */
  addStudentToClassroom: async (studentId: string, classroomId: string) => {
    const res = await api.post(`/v1/students/${studentId}/classrooms/${classroomId}`);
    return res.data;
  },

  /**
   * Admin: Remove student from a classroom
   */
  removeStudentFromClassroom: async (studentId: string, classroomId: string) => {
    const res = await api.delete(`/v1/students/${studentId}/classrooms/${classroomId}`);
    return res.data;
  },

  /**
   * Admin: Update all classrooms for a student
   */
  updateStudentClassrooms: async (studentId: string, classroomIds: string[]) => {
    const res = await api.put(`/v1/students/${studentId}/classrooms`, { classroomIds });
    return res.data.data || res.data;
  }
};
