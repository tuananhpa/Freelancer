import api from './api';

export interface Classroom {
  id: string;
  name: string;
  description?: string;
  section?: string;
  subject?: string;
  room?: string;
  inviteCode: string;
  teacherId: string;
  teacherName: string;
  teacherAvatar?: string;
  leaderboardEnabled?: boolean;
  meetingLink?: string;
  thumbnail?: string;
  memberCount: number;
  createdAt: string;
  /** Số bài chưa nộp (với học sinh) hoặc đang mở (với giáo viên) */
  pendingCount?: number;
  /** Deadline gần nhất của lớp */
  nearestDeadline?: string;
  /** Tên bài tập hoặc đề thi có hạn gần nhất */
  nearestTaskTitle?: string;
  /** Loại bài: ASSIGNMENT hoặc EXAM */
  nearestTaskType?: 'ASSIGNMENT' | 'EXAM';
}

export interface ClassFolder {
  id: string;
  name: string;
  classroomId: string;
  /** Null hoac khong co = chu de goc. Dung de dung lai cay chu de nhieu cap. */
  parentId?: string | null;
  createdAt: string;
}

export interface ClassResource {
  id: string;
  classroomId: string;
  folderId: string | null;
  resourceType: 'EXAM' | 'ASSIGNMENT' | 'FLASHCARD' | 'VOCAB' | 'LINK' | 'DOCUMENT';
  resourceId: string;
  createdAt: string;
}

export interface AssignResourceRequest {
  resourceId: string;
  resourceType: string;
  folderId?: string | null;
}

export interface ClassPost {
  id: string;
  content: string;
  attachments?: string[];
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: string;
  commentCount?: number;
  likeCount?: number;
  isLikedByCurrentUser?: boolean;
}

export interface ClassPostComment {
  id: string;
  postId: string;
  parentId?: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
  likeCount?: number;
  isLikedByCurrentUser?: boolean;
  replies?: ClassPostComment[];
}

export interface LinkedCourse {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  status: string;
  linkedAt: string;
}

export interface ClassMember {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  role: 'TEACHER' | 'STUDENT' | 'TA';
  avatarUrl: string | null;
  joinedAt: string;
  lastActiveAt?: string | null;
  studentCode?: string | null;
  phone?: string | null;
}

export interface SubmissionStatus {
  score: number | null;
  status: 'ASSIGNED' | 'MISSING' | 'TURNED_IN' | 'GRADED';
}

export interface ClassworkInfo {
  id: string;
  title: string;
  type: 'ASSIGNMENT' | 'EXAM';
  maxScore: number;
  dueDate: string | null;
}

export interface GradebookResponse {
  classworks: ClassworkInfo[];
  students: {
    studentId: string;
    studentName: string;
    avatarUrl: string | null;
    grades: Record<string, SubmissionStatus>;
  }[];
}

export interface CreateClassRequest {
  name: string;
  description?: string;
  section?: string;
  subject?: string;
  room?: string;
  thumbnail?: string;
  teacherId?: string;
}

export interface CreatePostRequest {
  content: string;
  attachments?: string[];
}

export interface AttendanceRecord {
  studentId: string;
  studentName: string;
  avatarUrl: string | null;
  status: 'PRESENT' | 'ABSENT_EXCUSED' | 'ABSENT_UNEXCUSED' | null;
}

export interface AttendanceResponse {
  weekNumber: number;
  sessionNumber: number;
  records: AttendanceRecord[];
}

export interface RecordAttendanceRequest {
  weekNumber: number;
  sessionNumber: number;
  records: {
    studentId: string;
    status: 'PRESENT' | 'ABSENT_EXCUSED' | 'ABSENT_UNEXCUSED';
  }[];
}

class ClassService {
  async getMyClasses(params?: { page?: number; size?: number }) {
    const page = params?.page ?? 0;
    const size = params?.size ?? 1000;
    const response = await api.get(`/classes?page=${page}&size=${size}`);
    return response.data;
  }

  async getClassById(id: string) {
    const response = await api.get(`/classes/${id}`);
    return response.data;
  }

  async createClass(data: CreateClassRequest) {
    const response = await api.post('/classes', data);
    return response.data;
  }

  async joinClass(inviteCode: string) {
    const response = await api.post('/classes/join', { inviteCode });
    return response.data;
  }

  async getClassPosts(classId: string, page = 0) {
    const response = await api.get(`/classes/${classId}/posts?page=${page}`);
    return response.data;
  }

  async createPost(classId: string, data: CreatePostRequest) {
    const response = await api.post(`/classes/${classId}/posts`, data);
    return response.data;
  }

  async updatePost(classId: string, postId: string, data: CreatePostRequest) {
    const response = await api.put(`/classes/${classId}/posts/${postId}`, data);
    return response.data;
  }

  async deletePost(classId: string, postId: string) {
    await api.delete(`/classes/${classId}/posts/${postId}`);
  }

  async toggleLikePost(classId: string, postId: string) {
    const response = await api.post(`/classes/${classId}/posts/${postId}/like`);
    return response.data;
  }

  async getPostComments(classId: string, postId: string) {
    const response = await api.get(`/classes/${classId}/posts/${postId}/comments`);
    return response.data;
  }

  async addPostComment(classId: string, postId: string, content: string, parentId?: string) {
    const response = await api.post(`/classes/${classId}/posts/${postId}/comments`, { content, parentId });
    return response.data;
  }

  async updatePostComment(classId: string, postId: string, commentId: string, content: string) {
    const response = await api.put(`/classes/${classId}/posts/${postId}/comments/${commentId}`, { content });
    return response.data;
  }

  async deletePostComment(classId: string, postId: string, commentId: string) {
    await api.delete(`/classes/${classId}/posts/${postId}/comments/${commentId}`);
  }

  async toggleLikeComment(classId: string, postId: string, commentId: string) {
    const response = await api.post(`/classes/${classId}/posts/${postId}/comments/${commentId}/like`);
    return response.data;
  }

  async getLinkedCourses(classId: string) {
    const response = await api.get(`/classes/${classId}/courses`);
    return response.data;
  }

  async linkCourse(classId: string, courseId: string) {
    const response = await api.post(`/classes/${classId}/courses/${courseId}`);
    return response.data;
  }

  async unlinkCourse(classId: string, courseId: string) {
    await api.delete(`/classes/${classId}/courses/${courseId}`);
  }

  async getMembers(classId: string) {
    const response = await api.get<ClassMember[]>(`/classes/${classId}/members`);
    return response.data; // Api interceptor only unwraps response.data
  }

  async removeMember(classId: string, studentId: string) {
    await api.delete(`/classes/${classId}/members/${studentId}`);
  }

  async addMember(classId: string, email: string, role: string) {
    const response = await api.post(`/classes/${classId}/members`, { email, role });
    return response.data;
  }

  async updateMemberRole(classId: string, studentId: string, role: string) {
    await api.put(`/classes/${classId}/members/${studentId}/role`, { role });
  }

  async updateMeetingLink(classId: string, meetingLink: string) {
    await api.put(`/classes/${classId}/settings/meeting-link`, { meetingLink });
  }

  async updateClassThumbnail(classId: string, thumbnail: string) {
    await api.put(`/classes/${classId}/settings/thumbnail`, { thumbnail });
  }

  async updateClassInfo(classId: string, info: { name?: string, description?: string, room?: string, subject?: string, section?: string }) {
    const response = await api.put(`/classes/${classId}/settings/info`, info);
    return response.data;
  }

  async getGradebook(classId: string) {
    const response = await api.get<GradebookResponse>(`/v1/classrooms/${classId}/gradebook`);
    return response.data;
  }

  async getAttendance(classId: string, weekNumber: number, sessionNumber: number) {
    const response = await api.get<AttendanceResponse>(`/classes/${classId}/attendance?weekNumber=${weekNumber}&sessionNumber=${sessionNumber}`);
    return response.data;
  }

  async recordAttendance(classId: string, data: RecordAttendanceRequest) {
    const response = await api.post<AttendanceResponse>(`/classes/${classId}/attendance`, data);
    return response.data;
  }

  // --- Class Folders ---
  async getClassFolders(classId: string) {
    const response = await api.get<ClassFolder[]>(`/classes/${classId}/folders`);
    return response.data;
  }

  async createClassFolder(classId: string, name: string, parentId?: string | null) {
    const response = await api.post<ClassFolder>(`/classes/${classId}/folders`, {
      name,
      parentId: parentId || null,
    });
    return response.data;
  }

  /**
   * Chi gui parentId khi that su muon chuyen chu de sang nhanh khac. Khong truyen
   * tham so nay thi backend giu nguyen vi tri hien tai cua chu de.
   */
  async updateClassFolder(
    classId: string,
    folderId: string,
    name: string,
    parentId?: string | null | undefined,
  ) {
    const body: Record<string, string | null> = { name };
    if (parentId !== undefined) body.parentId = parentId || null;
    const response = await api.put<ClassFolder>(`/classes/${classId}/folders/${folderId}`, body);
    return response.data;
  }

  async deleteClassFolder(classId: string, folderId: string) {
    await api.delete(`/classes/${classId}/folders/${folderId}`);
  }

  // --- Class Resources ---
  async getClassResources(classId: string) {
    const response = await api.get<ClassResource[]>(`/classes/${classId}/resources`);
    return response.data;
  }

  async assignResource(classId: string, data: AssignResourceRequest) {
    const response = await api.post<ClassResource>(`/classes/${classId}/resources`, data);
    return response.data;
  }

  async removeResource(classId: string, resourceId: string) {
    await api.delete(`/classes/${classId}/resources/${resourceId}`);
  }

  // --- Remind Deadline ---
  async remindDeadline(classId: string) {
    const response = await api.post<{ notifiedCount: number; message: string }>(`/classes/${classId}/remind-deadline`);
    return response.data;
  }
}

export default new ClassService();
