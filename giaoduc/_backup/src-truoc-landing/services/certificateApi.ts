import api, { PageResponse } from './api';

export interface Certificate {
  id: string;
  userId: string;
  userName: string;
  courseId: string;
  courseName: string;
  issueDate: string;
  uniqueCode: string;
  pdfUrl?: string;
}

export const certificateApi = {
  issue: async (courseId: string, studentId: string): Promise<Certificate> => {
    const res = await api.post(`/certificates/issue/${courseId}/${studentId}`);
    return res.data;
  },
  verify: async (code: string): Promise<Certificate> => {
    const res = await api.get(`/certificates/verify/${code}`);
    return res.data;
  },
  getMyCertificates: async (page = 0): Promise<PageResponse<Certificate>> => {
    const res = await api.get(`/certificates/my`, { params: { page } });
    return res.data;
  }
};
