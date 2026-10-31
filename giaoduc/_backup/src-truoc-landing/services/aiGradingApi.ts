import api from './api';

export interface ApiResponse<T> {
  data: T;
  status?: number;
  message?: string;
}

export interface CriterionDetail {
  score?: number;
  maxScore?: number;
  strengths?: string[];
  weaknesses?: string[];
  feedback?: string;
}

export interface GradingErrorItem {
  id?: string;
  category?: string; // grammar, vocabulary, spelling, punctuation, coherence, task, style, word_choice
  severity?: string; // minor, major
  original: string;
  correction: string;
  explanation: string;
  location?: { start?: number; end?: number };
}

export interface GradingStrengthItem {
  category?: string;
  description: string;
  evidence?: string;
}

export interface GradingImprovementItem {
  priority?: 'high' | 'medium' | 'low';
  category?: string;
  description: string;
  action?: string;
}

export interface TeacherSummary {
  overallComment?: string;
  mainStrength?: string;
  mainWeakness?: string;
  recommendedFocus?: string;
}

export interface StudentFeedback {
  positive?: string;
  nextStep?: string;
}

export interface WritingGradingResult {
  version?: string;
  gradingStatus?: string;
  overall?: {
    score?: number;
    maxScore?: number;
    percentage?: number;
  };
  levelAssessment?: {
    expectedLevel?: string;
    estimatedPerformanceLevel?: string;
    levelComment?: string;
  };
  criteria?: {
    taskAchievement?: CriterionDetail;
    coherenceAndCohesion?: CriterionDetail;
    lexicalResource?: CriterionDetail;
    grammaticalRangeAndAccuracy?: CriterionDetail;
  };
  errors?: GradingErrorItem[];
  strengths?: GradingStrengthItem[];
  improvements?: GradingImprovementItem[];
  teacherSummary?: TeacherSummary;
  studentFeedback?: StudentFeedback;
}

export interface AssessmentVersionSummary {
  id: string;
  version: number;
  source: 'AI' | 'TEACHER';
  overallScore?: number;
  createdAt: string;
  createdByName?: string;
  note?: string;
}

export interface WritingAssessmentResponse {
  id?: string;
  submissionId: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  studentEmail?: string;
  status: 'NOT_GRADED' | 'QUEUED' | 'GRADING' | 'COMPLETED' | 'FAILED' | 'TEACHER_EDITED';
  overallScore?: number;
  maxScore?: number;
  percentage?: number;
  wordCount?: number;
  requiredMinWords?: number;
  requiredMaxWords?: number;
  expectedLevel?: string;
  estimatedLevel?: string;
  result?: WritingGradingResult | null;
  originalAiResult?: WritingGradingResult | null;
  version?: number;
  aiModel?: string;
  errorMessage?: string;
  createdAt?: string;
  completedAt?: string;
  lastEditedAt?: string;
  lastEditedByName?: string;
  versions?: AssessmentVersionSummary[];
}

export interface BatchItemStatus {
  submissionId: string;
  studentName: string;
  status: string;
  score?: number;
  errorMessage?: string;
}

export interface BatchAiGradingStatusResponse {
  batchId: string;
  assignmentId: string;
  total: number;
  completed: number;
  successful: number;
  failed: number;
  inProgress: number;
  isDone: boolean;
  items: BatchItemStatus[];
}

export interface UpdateAssessmentRequest {
  result: WritingGradingResult;
  finalScore?: number;
  note?: string;
  publishToStudent?: boolean;
}

export const aiGradingApi = {
  // Lấy chi tiết đánh giá chấm bài cho một submission
  getAssessment: (submissionId: string) =>
    api.get<unknown, ApiResponse<WritingAssessmentResponse>>(`/v1/assignments/submissions/${submissionId}/ai-grading`),

  // Kích hoạt AI chấm 1 bài nộp
  gradeSubmission: (submissionId: string) =>
    api.post<unknown, ApiResponse<WritingAssessmentResponse>>(`/v1/assignments/submissions/${submissionId}/ai-grade`),

  // Yêu cầu AI chấm lại bài nộp (bảo toàn lịch sử cũ)
  regradeSubmission: (submissionId: string) =>
    api.post<unknown, ApiResponse<WritingAssessmentResponse>>(`/v1/assignments/submissions/${submissionId}/ai-grading/regrade`),

  // Giáo viên cập nhật/chỉnh sửa kết quả chấm và duyệt điểm
  updateAssessment: (submissionId: string, data: UpdateAssessmentRequest) =>
    api.patch<unknown, ApiResponse<WritingAssessmentResponse>>(`/v1/assignments/submissions/${submissionId}/ai-grading`, data),

  // Chấm toàn bộ bài nộp trong bài tập
  gradeAllInAssignment: (assignmentId: string) =>
    api.post<unknown, ApiResponse<BatchAiGradingStatusResponse>>(`/v1/assignments/${assignmentId}/ai-grade`),

  // Chấm các bài được chọn trong bài tập
  batchGradeSelected: (assignmentId: string, submissionIds: string[]) =>
    api.post<unknown, ApiResponse<BatchAiGradingStatusResponse>>(`/v1/assignments/ai-grading/batch?assignmentId=${assignmentId}`, { submissionIds }),

  // Kiểm tra trạng thái tiến trình batch
  getBatchStatus: (assignmentId: string, batchId: string) =>
    api.get<unknown, ApiResponse<BatchAiGradingStatusResponse>>(`/v1/assignments/${assignmentId}/ai-grading/batch-status/${batchId}`)
};
