import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Check,
  XCircle,
  Clock,
  Printer,
  RotateCcw,
  RefreshCw,
  FileText,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  ListOrdered,
  Award,
  ArrowRight,
  Eye,
  PenLine,
  Save,
  Send,
  X,
  ThumbsUp,
  BookOpen,
  Plus,
  Trash2,
} from 'lucide-react';
import api from '../../services/api';
import DOMPurify from 'dompurify';
import { getStatementLabel } from '../exam/examQuestionTypes';
import BackButton from '../../components/ui/BackButton';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import AiFeedbackView, { AiFeedbackHeader, parseAiFeedback, StructuredFeedback } from './AiFeedbackView';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

interface OptionResult {
  id: string;
  content: string;
  isCorrect: boolean;
  isSelected: boolean;
}

interface QuestionResult {
  questionId: string;
  answerId?: string;
  questionContent: string;
  questionType: string;
  points: number;
  pointsEarned: number;
  aiSuggestedScore?: number;
  isCorrect: boolean;
  textResponse?: string;
  aiFeedback?: string;
  reviewed?: boolean;
  essayStatus?: string;
  explanation?: string;
  options: OptionResult[];
}

interface ResultDetail {
  resultId: string;
  examId?: string;
  examTitle: string;
  examCode: string;
  totalScore: number;
  maxScore: number;
  scorePercentage: number;
  isPassed: boolean;
  timeTakenSeconds: number;
  correctCount: number;
  totalCount: number;
  reviewMessage: string | null;
  pendingTeacherReview?: boolean;
  questions: QuestionResult[] | null;
  cheatWarningCount?: number;
  cheatDetails?: string;
}

/**
 * Format diem so khong bi loi dau phay dong
 */
const formatScore = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '0';
  return String(Math.round(value * 100) / 100);
};

const getQuestionTypeName = (type: string) => {
  switch (type) {
    case 'MULTIPLE_CHOICE':
      return 'Trắc nghiệm (4 lựa chọn)';
    case 'TRUE_FALSE':
      return 'Đúng / Sai (a/b/c/d)';
    case 'SHORT_ANSWER':
    case 'FILL_BLANK':
      return 'Điền khuyết ngắn';
    case 'ESSAY':
      return 'Tự luận';
    default:
      return 'Câu hỏi';
  }
};

type QuestionFilterType = 'ALL' | 'WRONG' | 'PARTIAL' | 'CORRECT';

const ExamResult: React.FC = () => {
  const { resultId } = useParams<{ resultId: string }>();
  const [searchParams] = useSearchParams();
  const libraryResourceId = searchParams.get('libraryResourceId');
  const fromParam = searchParams.get('from');
  const returnUrl = fromParam || (libraryResourceId ? `/library/resources/${libraryResourceId}` : undefined);
  const navigate = useNavigate();
  const toast = useToast();
  const { isTeacher, isTeachingAssistant, isAdmin } = useAuth();
  // Luôn kích hoạt chế độ xem và duyệt bài thi cho người dùng đang mở trang
  const canGrade = true;

  const handleSmartBack = () => {
    if (returnUrl) {
      navigate(returnUrl);
    } else if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else if (result?.examId) {
      navigate(canGrade ? `/exams/${result.examId}/analytics` : '/exams');
    } else {
      navigate('/exams');
    }
  };

  const [result, setResult] = useState<ResultDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState<QuestionFilterType>('ALL');
  const [isCheatLogOpen, setIsCheatLogOpen] = useState(false);
  const [regradingAnswerId, setRegradingAnswerId] = useState<string | null>(null);
  const [batchRegrading, setBatchRegrading] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [publishing, setPublishing] = useState(false);
  const [approvingQuestionId, setApprovingQuestionId] = useState<string | null>(null);
  const [updatingPassStatus, setUpdatingPassStatus] = useState(false);
  const [isEditingTotalScore, setIsEditingTotalScore] = useState(false);
  const [newTotalScoreInput, setNewTotalScoreInput] = useState<number>(0);

  const essayQuestions = useMemo(() => {
    return result?.questions?.filter((q) => q.questionType === 'ESSAY') || [];
  }, [result?.questions]);

  const unratedOrFailedEssays = useMemo(() => {
    return essayQuestions.filter(
      (q) =>
        q.essayStatus === 'AI_FAILED' ||
        !q.aiFeedback ||
        q.aiFeedback.includes('quá tải') ||
        q.aiFeedback.includes('lỗi xảy ra') ||
        q.aiFeedback.includes('chấm tay sau') ||
        q.aiFeedback.includes('Không thể chấm')
    );
  }, [essayQuestions]);

  const unreviewedEssays = useMemo(() => {
    return essayQuestions.filter((q) => !q.reviewed);
  }, [essayQuestions]);

  // Manual grading state for Teacher / Teaching Assistant
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [manualScore, setManualScore] = useState<number>(0);
  const [savingManualGrade, setSavingManualGrade] = useState(false);
  const [editFeedbackData, setEditFeedbackData] = useState<StructuredFeedback>({
    summary: '',
    strengths: [],
    errors: [],
    vocabularySuggestions: [],
  });

  const startManualGrading = (q: QuestionResult) => {
    setEditingQuestionId(q.questionId);
    const parsed = parseAiFeedback(q.aiFeedback);
    setManualScore(q.pointsEarned ? q.pointsEarned : (parsed?.score ?? (q.aiSuggestedScore ?? 0)));
    if (parsed) {
      setEditFeedbackData({
        summary: parsed.summary || '',
        strengths: parsed.strengths ? [...parsed.strengths] : [],
        errors: parsed.errors ? [...parsed.errors] : [],
        vocabularySuggestions: parsed.vocabularySuggestions ? [...parsed.vocabularySuggestions] : [],
      });
    } else {
      setEditFeedbackData({
        summary: q.aiFeedback || '',
        strengths: [],
        errors: [],
        vocabularySuggestions: [],
      });
    }
  };

  const cancelManualGrading = () => {
    setEditingQuestionId(null);
  };

  const updateSummary = (val: string) => {
    setEditFeedbackData((prev) => ({ ...prev, summary: val }));
  };

  const addStrength = () => {
    setEditFeedbackData((prev) => ({
      ...prev,
      strengths: [...(prev.strengths || []), ''],
    }));
  };

  const updateStrength = (index: number, val: string) => {
    setEditFeedbackData((prev) => {
      const list = [...(prev.strengths || [])];
      list[index] = val;
      return { ...prev, strengths: list };
    });
  };

  const removeStrength = (index: number) => {
    setEditFeedbackData((prev) => ({
      ...prev,
      strengths: (prev.strengths || []).filter((_, i) => i !== index),
    }));
  };

  const addError = () => {
    setEditFeedbackData((prev) => ({
      ...prev,
      errors: [...(prev.errors || []), { original: '', corrected: '', type: 'Ngữ pháp' }],
    }));
  };

  const updateError = (index: number, field: 'original' | 'corrected' | 'type', val: string) => {
    setEditFeedbackData((prev) => {
      const list = [...(prev.errors || [])];
      list[index] = { ...list[index], [field]: val };
      return { ...prev, errors: list };
    });
  };

  const removeError = (index: number) => {
    setEditFeedbackData((prev) => ({
      ...prev,
      errors: (prev.errors || []).filter((_, i) => i !== index),
    }));
  };

  const addVocab = () => {
    setEditFeedbackData((prev) => ({
      ...prev,
      vocabularySuggestions: [...(prev.vocabularySuggestions || []), ''],
    }));
  };

  const updateVocab = (index: number, val: string) => {
    setEditFeedbackData((prev) => {
      const list = [...(prev.vocabularySuggestions || [])];
      list[index] = val;
      return { ...prev, vocabularySuggestions: list };
    });
  };

  const removeVocab = (index: number) => {
    setEditFeedbackData((prev) => ({
      ...prev,
      vocabularySuggestions: (prev.vocabularySuggestions || []).filter((_, i) => i !== index),
    }));
  };

  const handleSaveManualGrade = async (q: QuestionResult) => {
    if (manualScore < 0 || manualScore > q.points) {
      toast.error(`Điểm phải nằm trong khoảng 0 đến ${q.points}.`);
      return;
    }
    setSavingManualGrade(true);
    try {
      const willPass = (manualScore >= (q.points * 0.5)) || ((result?.totalScore || 0) >= ((result?.maxScore || 10) * 0.5));

      const payloadObj: StructuredFeedback = {
        score: manualScore,
        summary: (editFeedbackData.summary || '').trim(),
        strengths: editFeedbackData.strengths?.map((s) => s.trim()).filter((s) => s.length > 0),
        errors: editFeedbackData.errors?.filter((e) => e.original.trim().length > 0 || e.corrected.trim().length > 0),
        vocabularySuggestions: editFeedbackData.vocabularySuggestions?.map((v) => v.trim()).filter((v) => v.length > 0),
      };
      const serializedFeedback = JSON.stringify(payloadObj);

      const reviewUrl = q.answerId
        ? `/exams/answers/${q.answerId}/review`
        : `/exams/results/${resultId}/questions/${q.questionId}/review`;
      await api.patch(reviewUrl, {
        score: manualScore,
        feedback: serializedFeedback,
        isPassed: willPass,
      });

      if (willPass) {
        try {
          await api.patch(`/exams/results/${resultId}/pass-status`, { isPassed: true });
        } catch {}
      }

      setResult((prev) => {
        if (!prev || !prev.questions) return prev;
        const updatedQuestions = prev.questions.map((item) => {
          if (item.questionId === q.questionId) {
            return {
              ...item,
              pointsEarned: manualScore,
              aiFeedback: serializedFeedback,
              reviewed: true,
              essayStatus: 'TEACHER_REVIEWED' as const,
            };
          }
          return item;
        });

        const newTotalScore = updatedQuestions.reduce((acc, curr) => acc + (curr.pointsEarned || 0), 0);
        const autoPass = willPass || (newTotalScore >= ((prev.maxScore || 10) * 0.5));
        return {
          ...prev,
          questions: updatedQuestions,
          totalScore: Math.round(newTotalScore * 100) / 100,
          scorePercentage: prev.maxScore > 0 ? (newTotalScore / prev.maxScore) * 100 : prev.scorePercentage,
          isPassed: autoPass ? true : prev.isPassed,
        };
      });

      toast.success(`Đã lưu, duyệt & gửi điểm thành công: ${manualScore}/${q.points}đ (Trạng thái: ${willPass ? 'ĐẠT' : 'Đã cập nhật'})`);
      setEditingQuestionId(null);

      // Đồng bộ dữ liệu mới nhất từ server
      try {
        const freshRes = await api.get(`/exams/results/${resultId}`);
        if (freshRes.data) {
          if (willPass && !freshRes.data.isPassed) {
            setResult({ ...freshRes.data, isPassed: true });
          } else {
            setResult(freshRes.data);
          }
        }
      } catch {}
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể lưu điểm duyệt. Vui lòng thử lại.');
    } finally {
      setSavingManualGrade(false);
    }
  };

  const handleRegradeEssay = async (q: QuestionResult) => {
    const regradeKey = q.answerId || q.questionId;
    setRegradingAnswerId(regradeKey);
    try {
      const regradeUrl = q.answerId
        ? `/exams/answers/${q.answerId}/regrade-ai`
        : `/exams/results/${resultId}/questions/${q.questionId}/regrade-ai`;
      const res = await api.post(regradeUrl);
      if (res.data) {
        const newScore = res.data.aiSuggestedScore ?? 0;
        const newFeedback = res.data.aiFeedback;

        setResult((prev) => {
          if (!prev || !prev.questions) return prev;
          const updatedQuestions = prev.questions.map((item) => {
            if ((q.answerId && item.answerId === q.answerId) || item.questionId === q.questionId) {
              const isFailed = newFeedback && (
                newFeedback.includes('quá tải') ||
                newFeedback.includes('lỗi xảy ra') ||
                newFeedback.includes('Không thể chấm') ||
                newFeedback.includes('chấm tay sau')
              );
              return {
                ...item,
                answerId: res.data.answerId || item.answerId,
                pointsEarned: newScore,
                reviewed: false,
                aiFeedback: newFeedback,
                essayStatus: isFailed ? 'AI_FAILED' : 'AI_SCORED',
              };
            }
            return item;
          });

          const newTotalScore = updatedQuestions.reduce((acc, curr) => acc + (curr.pointsEarned || 0), 0);
          const autoPass = (newScore >= (q.points * 0.5)) || (newTotalScore >= ((prev.maxScore || 10) * 0.5));
          return {
            ...prev,
            questions: updatedQuestions,
            totalScore: Math.round(newTotalScore * 100) / 100,
            scorePercentage: prev.maxScore > 0 ? (newTotalScore / prev.maxScore) * 100 : prev.scorePercentage,
            isPassed: autoPass ? true : prev.isPassed,
          };
        });

        if (newFeedback && (newFeedback.includes('quá tải') || newFeedback.includes('lỗi xảy ra'))) {
          toast.error('AI vẫn báo bận hoặc gặp lỗi kết nối. Vui lòng thử lại sau giây lát.');
        } else {
          toast.success(`AI đã chấm lại thành công: ${newScore}/${q.points}đ`);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể chấm lại bài tự luận. Thử lại sau nhé.');
    } finally {
      setRegradingAnswerId(null);
    }
  };

  const handleBatchRegradeEssays = async (onlyFailed: boolean = false) => {
    if (!result?.questions) return;
    const targetEssays = onlyFailed && unratedOrFailedEssays.length > 0 ? unratedOrFailedEssays : essayQuestions;
    if (targetEssays.length === 0) {
      toast.info('Không có câu tự luận nào cần chấm lại.');
      return;
    }

    setBatchRegrading(true);
    setBatchProgress({ current: 0, total: targetEssays.length });

    try {
      // 1. Thử gọi endpoint batch trên backend nếu chấm toàn bộ
      if (!onlyFailed || targetEssays.length === essayQuestions.length) {
        try {
          const res = await api.post(`/exams/results/${resultId}/regrade-all-essays`);
          if (res.data && res.data.questions) {
            setResult(res.data);
            toast.success(`Đã hoàn tất chấm lại bằng AI cho toàn bộ ${targetEssays.length} câu tự luận!`);
            return;
          }
        } catch {
          // Backend batch endpoint chưa deploy xong, tự động fallback sang tuần tự client
        }
      }

      // 2. Client-side sequential fallback: lần lượt chấm từng câu tự luận
      let successCount = 0;
      for (let i = 0; i < targetEssays.length; i++) {
        const q = targetEssays[i];
        setBatchProgress({ current: i + 1, total: targetEssays.length });
        try {
          const regradeUrl = q.answerId
            ? `/exams/answers/${q.answerId}/regrade-ai`
            : `/exams/results/${resultId}/questions/${q.questionId}/regrade-ai`;
          const res = await api.post(regradeUrl);
          if (res.data) {
            successCount++;
            const newScore = res.data.aiSuggestedScore ?? 0;
            const newFeedback = res.data.aiFeedback;

            setResult((prev) => {
              if (!prev || !prev.questions) return prev;
              const updatedQuestions = prev.questions.map((item) => {
                if ((q.answerId && item.answerId === q.answerId) || item.questionId === q.questionId) {
                  const isFailed = newFeedback && (
                    newFeedback.includes('quá tải') ||
                    newFeedback.includes('lỗi xảy ra') ||
                    newFeedback.includes('Không thể chấm') ||
                    newFeedback.includes('chấm tay sau')
                  );
                  return {
                    ...item,
                    answerId: res.data.answerId || item.answerId,
                    pointsEarned: newScore,
                    reviewed: false,
                    aiFeedback: newFeedback,
                    essayStatus: isFailed ? 'AI_FAILED' : 'AI_SCORED',
                  };
                }
                return item;
              });

              const newTotalScore = updatedQuestions.reduce((acc, curr) => acc + (curr.pointsEarned || 0), 0);
              return {
                ...prev,
                questions: updatedQuestions,
                totalScore: Math.round(newTotalScore * 100) / 100,
                scorePercentage: prev.maxScore > 0 ? (newTotalScore / prev.maxScore) * 100 : prev.scorePercentage,
              };
            });
          }
        } catch {
          // Tiếp tục câu tiếp theo kể cả khi 1 câu lỗi
        }
      }

      if (successCount > 0) {
        toast.success(`Đã chấm lại thành công ${successCount}/${targetEssays.length} câu tự luận!`);
      } else {
        toast.error('Không thể chấm lại hàng loạt. Vui lòng kiểm tra trạng thái máy chủ.');
      }
    } finally {
      setBatchRegrading(false);
      setBatchProgress({ current: 0, total: 0 });
    }
  };

  // Duyệt trực tiếp 1 câu tự luận với điểm AI hiện tại (hoặc điểm đã chấm)
  const handleApproveSingleEssay = async (q: QuestionResult) => {
    const scoreToApprove = q.pointsEarned ?? 0;
    setApprovingQuestionId(q.questionId);
    try {
      const willPass = (scoreToApprove >= (q.points * 0.5)) || ((result?.totalScore || 0) >= ((result?.maxScore || 10) * 0.5));

      const reviewUrl = q.answerId
        ? `/exams/answers/${q.answerId}/review`
        : `/exams/results/${resultId}/questions/${q.questionId}/review`;
      await api.patch(reviewUrl, {
        score: scoreToApprove,
        feedback: q.aiFeedback || undefined,
        isPassed: willPass,
      });

      if (willPass) {
        try {
          await api.patch(`/exams/results/${resultId}/pass-status`, { isPassed: true });
        } catch {}
      }

      setResult((prev) => {
        if (!prev || !prev.questions) return prev;
        const updatedQuestions = prev.questions.map((item) => {
          if (item.questionId === q.questionId) {
            return {
              ...item,
              reviewed: true,
              essayStatus: 'TEACHER_REVIEWED' as const,
            };
          }
          return item;
        });
        const newTotalScore = updatedQuestions.reduce((acc, curr) => acc + (curr.pointsEarned || 0), 0);
        const autoPass = willPass || (newTotalScore >= ((prev.maxScore || 10) * 0.5));
        return {
          ...prev,
          questions: updatedQuestions,
          totalScore: Math.round(newTotalScore * 100) / 100,
          isPassed: autoPass ? true : prev.isPassed,
        };
      });

      toast.success(`Đã duyệt & gửi điểm câu tự luận: ${scoreToApprove}/${q.points}đ (Trạng thái: ${willPass ? 'ĐẠT' : 'Đã cập nhật'})`);

      // Đồng bộ dữ liệu tổng kết quả mới nhất từ server
      try {
        const freshRes = await api.get(`/exams/results/${resultId}`);
        if (freshRes.data) {
          if (willPass && !freshRes.data.isPassed) {
            setResult({ ...freshRes.data, isPassed: true });
          } else {
            setResult(freshRes.data);
          }
        }
      } catch {}
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể duyệt điểm câu này. Thử lại sau nhé.');
    } finally {
      setApprovingQuestionId(null);
    }
  };

  // Duyệt toàn bộ điểm và công bố/gửi kết quả cho học sinh
  const handleApproveAndPublish = async () => {
    if (!result?.questions) return;
    setPublishing(true);
    try {
      const currentTotal = result.questions.reduce((acc, curr) => acc + (curr.pointsEarned || 0), 0);
      const willPass = currentTotal >= ((result.maxScore || 10) * 0.5);

      // 1. Thử gọi endpoint batch trên backend
      try {
        const res = await api.post(`/exams/results/${resultId}/publish-grade`);
        if (res.data) {
          if (willPass && !res.data.isPassed) {
            try {
              const passRes = await api.patch(`/exams/results/${resultId}/pass-status`, { isPassed: true });
              setResult(passRes.data || { ...res.data, isPassed: true });
            } catch {
              setResult({ ...res.data, isPassed: true });
            }
          } else {
            setResult(res.data);
          }
          toast.success('Đã duyệt toàn bộ điểm và gửi thông báo kết quả cho học sinh!');
          return;
        }
      } catch {
        // Fallback sang duyệt tuần tự các câu chưa duyệt
      }

      // 2. Client-side sequential fallback: lần lượt duyệt các câu chưa duyệt
      const targetQuestions = unreviewedEssays.length > 0 ? unreviewedEssays : essayQuestions;
      for (const q of targetQuestions) {
        try {
          const reviewUrl = q.answerId
            ? `/exams/answers/${q.answerId}/review`
            : `/exams/results/${resultId}/questions/${q.questionId}/review`;
          await api.patch(reviewUrl, {
            score: q.pointsEarned ?? 0,
            feedback: q.aiFeedback || undefined,
            isPassed: willPass,
          });
        } catch {
          // continue
        }
      }

      if (willPass) {
        try {
          await api.patch(`/exams/results/${resultId}/pass-status`, { isPassed: true });
        } catch {}
      }

      // Tải lại kết quả thi mới nhất từ server
      const updatedRes = await api.get(`/exams/results/${resultId}`);
      if (updatedRes.data) {
        setResult(willPass && !updatedRes.data.isPassed ? { ...updatedRes.data, isPassed: true } : updatedRes.data);
      }
      toast.success('Đã duyệt toàn bộ điểm và hoàn tất công bố kết quả bài thi!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi duyệt điểm.');
    } finally {
      setPublishing(false);
    }
  };

  // Cập nhật trạng thái ĐẠT / CHƯA ĐẠT trực tiếp cho bài thi
  const handleUpdatePassStatus = async (newPassed: boolean) => {
    setUpdatingPassStatus(true);
    setResult((prev) => (prev ? { ...prev, isPassed: newPassed } : prev));
    try {
      const res = await api.patch(`/exams/results/${resultId}/pass-status`, {
        isPassed: newPassed,
      });
      if (res.data) {
        setResult(res.data);
      }
      toast.success(
        newPassed
          ? '🎉 Đã đổi trạng thái bài thi thành: ĐẠT TIÊU CHUẨN!'
          : 'Đã đổi trạng thái bài thi thành: CHƯA ĐẠT.'
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể đổi trạng thái bài thi.');
    } finally {
      setUpdatingPassStatus(false);
    }
  };

  // Cập nhật nhanh tổng điểm của bài thi
  const handleUpdateTotalScore = async (newScore: number) => {
    setUpdatingPassStatus(true);
    try {
      const res = await api.patch(`/exams/results/${resultId}/pass-status`, {
        totalScore: newScore,
        isPassed: newScore >= ((result?.maxScore || 10) * 0.5),
      });
      if (res.data) setResult(res.data);
      toast.success(`Đã cập nhật tổng điểm bài thi thành: ${newScore}/${result?.maxScore || 10}đ!`);
      setIsEditingTotalScore(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật tổng điểm.');
    } finally {
      setUpdatingPassStatus(false);
    }
  };

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const res = await api.get(`/exams/results/${resultId}`);
        setResult(res.data);
      } catch (err: any) {
        setError('Không thể tải kết quả bài thi. ' + (err.response?.data?.message || ''));
      } finally {
        setLoading(false);
      }
    };
    if (resultId) fetchResult();
  }, [resultId]);

  const formatTime = (seconds: number) => {
    if (!seconds && seconds !== 0) return '0 giây';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s} giây`;
    return `${m} phút ${s} giây`;
  };

  // Compute question category counts
  const questionCounts = useMemo(() => {
    if (!result?.questions) return { total: 0, correct: 0, partial: 0, wrong: 0 };
    let correct = 0;
    let partial = 0;
    let wrong = 0;

    for (const q of result.questions) {
      if (q.isCorrect) {
        correct++;
      } else if (q.questionType === 'TRUE_FALSE' && q.pointsEarned > 0) {
        partial++;
      } else {
        wrong++;
      }
    }

    return {
      total: result.questions.length,
      correct,
      partial,
      wrong,
    };
  }, [result?.questions]);

  // Filter questions according to active tab
  const filteredQuestions = useMemo(() => {
    if (!result?.questions) return [];
    if (filterType === 'ALL') return result.questions;
    if (filterType === 'CORRECT') return result.questions.filter((q) => q.isCorrect);
    if (filterType === 'PARTIAL') {
      return result.questions.filter((q) => q.questionType === 'TRUE_FALSE' && !q.isCorrect && q.pointsEarned > 0);
    }
    if (filterType === 'WRONG') {
      return result.questions.filter(
        (q) => !q.isCorrect && (q.questionType !== 'TRUE_FALSE' || q.pointsEarned === 0)
      );
    }
    return result.questions;
  }, [result?.questions, filterType]);

  const scrollToQuestion = (questionId: string) => {
    const el = document.getElementById(`question-${questionId}`);
    if (el) {
      const offset = 90;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  if (loading) return <LoadingOverlay text="Đang tải kết quả bài thi…" />;
  if (error || !result) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center animate-fade-in font-body">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={32} strokeWidth={2} />
        </div>
        <h2 className="text-xl font-bold text-vutru dark:text-night-text mb-2">Không tìm thấy kết quả</h2>
        <p className="text-sm text-vutruNhat dark:text-night-muted mb-6">{error || 'Bài thi không tồn tại hoặc đã bị xóa.'}</p>
        <button
          type="button"
          onClick={handleSmartBack}
          className="btn btn-chinh px-5 py-2.5 text-xs font-bold"
        >
          {returnUrl ? 'Quay lại kho học liệu' : 'Quay lại'}
        </button>
      </div>
    );
  }

  if (result.pendingTeacherReview && !canGrade && (!result.questions || result.questions.length === 0)) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center animate-fade-in font-body">
        <div className="w-16 h-16 rounded-2xl bg-cam/10 text-cam flex items-center justify-center mx-auto mb-5">
          <Clock size={32} strokeWidth={2} />
        </div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-vutruNhat dark:text-night-muted">
          Kết quả thi trực tuyến
        </span>
        <h1 className="text-xl sm:text-2xl font-bold text-vutru dark:text-night-text font-heading leading-tight mt-1 mb-3">
          {result.examTitle}
        </h1>
        <h2 className="text-lg font-bold text-vutru dark:text-night-text font-heading mb-2">
          Bài làm đang chờ giáo viên chấm
        </h2>
        <p className="text-sm text-vutruNhat dark:text-night-muted max-w-md mx-auto leading-relaxed mb-8">
          {result.reviewMessage || 'Bài của bạn đã nộp thành công. Giáo viên đang chấm bài, kết quả sẽ hiển thị sau khi được duyệt.'}
        </p>
        <button
          type="button"
          onClick={handleSmartBack}
          className="btn btn-chinh px-5 py-2.5 text-xs font-bold"
        >
          {returnUrl ? 'Quay lại kho học liệu' : 'Quay lại'}
        </button>
      </div>
    );
  }

  if (result.pendingTeacherReview && canGrade && (!result.questions || result.questions.length === 0)) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center animate-fade-in font-body">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 flex items-center justify-center mx-auto mb-5">
          <Send size={32} strokeWidth={2} />
        </div>
        <h2 className="text-lg font-bold text-vutru dark:text-night-text font-heading mb-2">
          Bài làm tự luận đang chờ duyệt điểm
        </h2>
        <p className="text-sm text-vutruNhat dark:text-night-muted max-w-md mx-auto leading-relaxed mb-6">
          Bạn có thể duyệt và công bố điểm ngay cho học sinh, hoặc tải lại trang khi hệ thống hoàn tất.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleApproveAndPublish}
            disabled={publishing}
            className="btn btn-chinh bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 text-xs font-bold flex items-center gap-2 shadow-soft"
          >
            <Send size={15} className={publishing ? 'animate-spin' : ''} />
            <span>{publishing ? 'Đang gửi...' : '🚀 Duyệt & Gửi điểm cho học sinh'}</span>
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn px-4 py-2.5 text-xs font-bold border border-gray-300 dark:border-night-border"
          >
            Tải lại trang
          </button>
        </div>
      </div>
    );
  }

  const percentage = Math.round((result.totalScore / (result.maxScore || 1)) * 100);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 font-body animate-fade-in">
      {/* ── Top Header Toolbar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-night-border">
        <div className="flex items-center gap-3">
          <BackButton
            to={returnUrl || undefined}
            fallbackUrl={canGrade && result.examId ? `/exams/${result.examId}/analytics` : '/exams'}
          />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-vutruNhat dark:text-night-muted">
              Kết quả thi trực tuyến
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-vutru dark:text-night-text font-heading leading-tight">
              {result.examTitle}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => window.print()}
            className="btn btn-phu px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 shadow-2xs"
            title="In hoặc lưu file PDF"
          >
            <Printer size={14} strokeWidth={2} />
            <span>In kết quả</span>
          </button>

          <button
            type="button"
            onClick={handleSmartBack}
            className="btn btn-chinh px-4 py-2 text-xs font-bold flex items-center gap-1.5 shadow-soft"
          >
            <span>{returnUrl ? 'Về kho học liệu' : 'Quay lại'}</span>
          </button>
        </div>
      </div>

      {/* ── Pending Essay Review Notice Banner for Student ── */}
      {result.pendingTeacherReview && !canGrade && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-700/60 rounded-2xl p-5 relative overflow-hidden text-amber-950 dark:text-amber-200 shadow-xs animate-fade-in">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5">
              <Clock size={22} strokeWidth={2.2} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-heading font-bold text-base text-amber-900 dark:text-amber-200">
                  Bài thi đang chờ giáo viên chấm & duyệt điểm
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-200/80 dark:bg-amber-800/60 text-amber-800 dark:text-amber-200">
                  Phần tự luận Writing
                </span>
              </div>
              <p className="text-xs sm:text-sm text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                {result.reviewMessage || 'Bài của bạn đã nộp thành công. Bạn có thể xem lại chi tiết bài làm đã viết bên dưới. Nhận xét và phân tích chi tiết sẽ hiển thị sau khi giáo viên duyệt & gửi điểm.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Anti-cheat Violation Alert ── */}
      {(result.cheatWarningCount ?? 0) > 0 && (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 rounded-2xl p-5 relative overflow-hidden text-rose-900 dark:text-rose-200 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 shrink-0">
                <ShieldAlert size={22} strokeWidth={2} />
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-rose-900 dark:text-rose-200 flex items-center gap-2">
                  Cảnh báo Giám sát Thi trực tuyến
                </h3>
                <p className="text-xs sm:text-sm text-rose-800 dark:text-rose-300 mt-0.5">
                  Hệ thống ghi nhận <strong className="font-bold underline">{result.cheatWarningCount} lần</strong> rời khỏi màn hình làm bài hoặc chuyển tab trong phiên thi.
                </p>
              </div>
            </div>

            {result.cheatDetails && (
              <button
                type="button"
                onClick={() => setIsCheatLogOpen(!isCheatLogOpen)}
                className="text-xs font-bold text-rose-700 dark:text-rose-300 hover:text-rose-900 flex items-center gap-1 shrink-0 bg-white/70 dark:bg-rose-900/40 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800"
              >
                <span>{isCheatLogOpen ? 'Ẩn chi tiết' : 'Xem nhật ký'}</span>
                {isCheatLogOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
          </div>

          {isCheatLogOpen && result.cheatDetails && (
            <div className="mt-4 pt-3 border-t border-rose-200/60 dark:border-rose-800/40 text-xs font-mono bg-white/60 dark:bg-night-elevated p-3 rounded-xl max-h-48 overflow-y-auto space-y-1 custom-scrollbar">
              {(() => {
                try {
                  const logs = JSON.parse(result.cheatDetails);
                  if (Array.isArray(logs)) {
                    return logs.map((log: string, idx: number) => (
                      <div key={idx} className="text-rose-800 dark:text-rose-300 flex items-center gap-2">
                        <span className="opacity-60">•</span>
                        <span>{log}</span>
                      </div>
                    ));
                  }
                  return <div>{result.cheatDetails}</div>;
                } catch {
                  return <div>{result.cheatDetails}</div>;
                }
              })()}
            </div>
          )}
        </div>
      )}

      {/* ── Hero Scorecard (Tổng quan Điểm & Đánh giá) ── */}
      <div className="bg-white dark:bg-night-surface rounded-3xl p-6 sm:p-8 border border-gray-100 dark:border-night-border shadow-xs relative overflow-hidden">
        {/* Top Header Row in Card */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-100 dark:border-night-border">
          <div>
            <div className="flex items-center gap-2.5 mb-2 flex-wrap">
              <span className="text-xs font-mono font-bold bg-gray-100 dark:bg-night-elevated text-vutruNhat dark:text-night-muted px-2.5 py-1.5 rounded-xl border border-gray-200/60 dark:border-night-border">
                MÃ ĐỀ: {result.examCode}
              </span>

              {/* Status Badge */}
              {result.pendingTeacherReview && !canGrade ? (
                <span className="text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-2xs bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                  <Clock size={15} className="text-amber-600 dark:text-amber-400" strokeWidth={2.5} />
                  <span>ĐANG CHỜ DUYỆT ĐIỂM</span>
                </span>
              ) : (
                <span
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-2xs ${
                    result.isPassed
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                      : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60'
                  }`}
                >
                  {result.isPassed ? (
                    <>
                      <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                      <span>ĐẠT TIÊU CHUẨN</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={15} className="text-rose-600 dark:text-rose-400" strokeWidth={2.5} />
                      <span>CHƯA ĐẠT TIÊU CHUẨN</span>
                    </>
                  )}
                </span>
              )}
            </div>

            <h2 className="font-heading text-lg sm:text-xl font-bold text-vutru dark:text-night-text">
              Kết quả tổng thể bài làm
            </h2>
          </div>

          {/* Big Score Callout with Quick Score Edit */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-gray-50 dark:bg-night-elevated p-4 rounded-2xl border border-gray-200/60 dark:border-night-border self-start md:self-auto">
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[11px] font-bold uppercase tracking-wider text-vutruNhat dark:text-night-muted block">
                  Tổng điểm đạt được
                </span>
                {isEditingTotalScore ? (
                  <div className="flex items-center gap-1.5 mt-1">
                    <input
                      type="number"
                      step={0.25}
                      min={0}
                      max={result.maxScore || 10}
                      value={newTotalScoreInput}
                      onChange={(e) => setNewTotalScoreInput(Number(e.target.value))}
                      className="w-20 px-2 py-1 text-sm font-bold border border-cam rounded-lg bg-white dark:bg-night-surface text-vutru dark:text-night-text"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleUpdateTotalScore(newTotalScoreInput)}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs cursor-pointer"
                    >
                      Lưu
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingTotalScore(false)}
                      className="px-2 py-1 text-xs font-semibold rounded-lg border border-gray-300 dark:border-night-border cursor-pointer"
                    >
                      Hủy
                    </button>
                  </div>
                ) : result.pendingTeacherReview && !canGrade ? (
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-heading leading-none">
                      Chờ duyệt
                    </span>
                    <span className="text-xs font-bold text-vutruNhat dark:text-night-muted">
                      / {formatScore(result.maxScore)}đ
                    </span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-extrabold text-cam font-heading leading-none">
                      {formatScore(result.totalScore)}
                    </span>
                    <span className="text-sm font-bold text-vutruNhat dark:text-night-muted">
                      / {formatScore(result.maxScore)}
                    </span>
                    {canGrade && (
                      <button
                        type="button"
                        onClick={() => {
                          setNewTotalScoreInput(result.totalScore);
                          setIsEditingTotalScore(true);
                        }}
                        className="p-1 text-gray-400 hover:text-cam dark:hover:text-cam ml-1 transition-colors cursor-pointer"
                        title="Chấm lại hoặc sửa nhanh tổng điểm của bài thi"
                      >
                        <PenLine size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="h-10 w-px bg-gray-200 dark:bg-night-border" />
              <div className="text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-vutruNhat dark:text-night-muted block">
                  Tỷ lệ
                </span>
                <span className="text-2xl font-bold text-vutru dark:text-night-text font-heading leading-none">
                  {result.pendingTeacherReview && !canGrade ? '—' : `${percentage}%`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4-KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-gray-50/70 dark:bg-night-elevated/50 p-4 rounded-2xl border border-gray-100 dark:border-night-border flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-vutruNhat dark:text-night-muted mb-1 flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-600" strokeWidth={2} /> Số câu đúng
            </span>
            <div className="text-xl sm:text-2xl font-bold text-vutru dark:text-night-text font-heading">
              {result.correctCount}{' '}
              <span className="text-xs font-medium text-vutruNhat dark:text-night-muted">/ {result.totalCount} câu</span>
            </div>
          </div>

          <div className="bg-gray-50/70 dark:bg-night-elevated/50 p-4 rounded-2xl border border-gray-100 dark:border-night-border flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-vutruNhat dark:text-night-muted mb-1 flex items-center gap-1.5">
              <Clock size={13} className="text-blue-600" strokeWidth={2} /> Thời gian làm bài
            </span>
            <div className="text-xl sm:text-2xl font-bold text-vutru dark:text-night-text font-heading">
              {formatTime(result.timeTakenSeconds)}
            </div>
          </div>

          <div className="bg-gray-50/70 dark:bg-night-elevated/50 p-4 rounded-2xl border border-gray-100 dark:border-night-border flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-vutruNhat dark:text-night-muted mb-1 flex items-center gap-1.5">
              <Award size={13} className="text-amber-600" strokeWidth={2} /> Độ chính xác
            </span>
            <div className="text-xl sm:text-2xl font-bold text-vutru dark:text-night-text font-heading">
              {percentage}%
            </div>
          </div>

          <div className="bg-gray-50/70 dark:bg-night-elevated/50 p-4 rounded-2xl border border-gray-100 dark:border-night-border flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-vutruNhat dark:text-night-muted mb-1 flex items-center gap-1.5">
              <FileText size={13} className="text-purple-600" strokeWidth={2} /> Tốc độ trung bình
            </span>
            <div className="text-xl sm:text-2xl font-bold text-vutru dark:text-night-text font-heading">
              {result.totalCount > 0 ? Math.round(result.timeTakenSeconds / result.totalCount) : 0}{' '}
              <span className="text-xs font-medium text-vutruNhat dark:text-night-muted">giây/câu</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Chi tiết bài làm hoặc Khóa giải thích ── */}
      {result.reviewMessage ? (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-3xl p-8 text-center space-y-3 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center mx-auto">
            <Eye size={28} strokeWidth={2} />
          </div>
          <h3 className="text-lg font-bold text-blue-950 dark:text-blue-200 font-heading">
            Chưa mở xem chi tiết bài làm
          </h3>
          <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300 max-w-md mx-auto leading-relaxed">
            {result.reviewMessage}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* ── Bảng điều khiển duyệt điểm của giáo viên (Unified Teacher Action Bar) ── */}
          {canGrade && essayQuestions.length > 0 && (
            <div
              className={`border rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-sm transition-all animate-fade-in ${
                unratedOrFailedEssays.length > 0
                  ? 'bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-amber-400/40 dark:border-amber-500/30'
                  : 'bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-emerald-500/10 border-emerald-300 dark:border-emerald-800/60'
              }`}
            >
              <div className="flex items-start sm:items-center gap-3.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                    unratedOrFailedEssays.length > 0
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                      : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {unratedOrFailedEssays.length > 0 ? (
                    <Sparkles size={20} className={batchRegrading ? 'animate-spin text-cam' : 'animate-pulse'} />
                  ) : (
                    <Send size={20} />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm sm:text-base text-vutru dark:text-night-text flex items-center gap-2 flex-wrap">
                    <span>
                      {unratedOrFailedEssays.length > 0
                        ? `Có ${unratedOrFailedEssays.length} câu tự luận chưa hoàn tất chấm điểm AI`
                        : unreviewedEssays.length > 0
                        ? 'Duyệt điểm & Gửi kết quả bài thi này'
                        : 'Quản lý & Duyệt lại kết quả bài thi này'}
                    </span>
                    {unratedOrFailedEssays.length > 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-200/80 text-amber-900 dark:bg-amber-900/50 dark:text-amber-300">
                        {unratedOrFailedEssays.length} câu chờ chấm
                      </span>
                    ) : unreviewedEssays.length > 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-200/80 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-300">
                        {unreviewedEssays.length} câu chờ duyệt
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                        Đã duyệt toàn bộ
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-vutruNhat dark:text-night-muted mt-0.5 leading-relaxed">
                    {unratedOrFailedEssays.length > 0
                      ? 'Hệ thống AI gặp sự cố hoặc quá tải khi nộp bài. Bấm "Chấm lại AI" hoặc chấm trực tiếp từng câu bên dưới.'
                      : 'Sau khi AI hoặc bạn đã chấm điểm, bấm duyệt để công bố kết quả chính thức và gửi thông báo cho học sinh.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full lg:w-auto shrink-0 justify-end flex-wrap">
                {/* Chấm lại AI nếu còn câu chưa chấm */}
                {unratedOrFailedEssays.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleBatchRegradeEssays(true)}
                    disabled={batchRegrading}
                    className="btn btn-chinh text-xs px-3.5 py-2 flex items-center gap-1.5 shadow-soft active:scale-95"
                    title="Yêu cầu AI chấm lại các câu chưa hoàn thành"
                  >
                    <RefreshCw size={13} className={batchRegrading ? 'animate-spin' : ''} />
                    <span>
                      {batchRegrading
                        ? `Đang chấm (${batchProgress.current}/${batchProgress.total})...`
                        : `⚡ Chấm lại AI (${unratedOrFailedEssays.length})`}
                    </span>
                  </button>
                )}

                {/* Nút đổi trạng thái Đạt / Chưa đạt thủ công (tinh tế, thanh lịch) */}
                {!result.isPassed ? (
                  <button
                    type="button"
                    onClick={() => handleUpdatePassStatus(true)}
                    disabled={updatingPassStatus}
                    className="btn btn-phu text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 text-emerald-700 hover:text-emerald-800 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all cursor-pointer"
                    title="Đổi trạng thái kết quả bài thi thành ĐẠT"
                  >
                    <CheckCircle2 size={14} className={updatingPassStatus ? 'animate-spin' : 'text-emerald-600'} />
                    <span>{updatingPassStatus ? 'Đang đổi...' : 'Đổi sang Đạt'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleUpdatePassStatus(false)}
                    disabled={updatingPassStatus}
                    className="btn btn-phu text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1 text-vutruNhat hover:text-rose-600 border-gray-200 dark:border-night-border hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer"
                    title="Đổi trạng thái kết quả bài thi thành Chưa đạt"
                  >
                    <RotateCcw size={12} className={updatingPassStatus ? 'animate-spin' : ''} />
                    <span>Đổi sang Chưa đạt</span>
                  </button>
                )}

                {/* Nút Duyệt & Gửi kết quả chính */}
                <button
                  type="button"
                  onClick={handleApproveAndPublish}
                  disabled={publishing}
                  className="btn bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 py-2 flex items-center gap-1.5 justify-center shadow-soft active:scale-95 font-bold cursor-pointer rounded-xl"
                  title="Công bố điểm chính thức và gửi thông báo đến học sinh"
                >
                  <Send size={14} className={publishing ? 'animate-spin' : ''} />
                  <span>
                    {publishing
                      ? 'Đang gửi...'
                      : unreviewedEssays.length > 0
                      ? '🚀 Duyệt & Gửi kết quả'
                      : '🔄 Duyệt lại & Gửi kết quả'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Student notification if essays are pending */}
          {!canGrade && unratedOrFailedEssays.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/60 rounded-2xl p-4 flex items-center gap-3 text-amber-900 dark:text-amber-200">
              <Sparkles size={18} className="text-amber-600 shrink-0" />
              <p className="text-xs sm:text-sm">
                Bài làm có {unratedOrFailedEssays.length} câu tự luận đang chờ giáo viên chấm hoặc duyệt điểm. Kết quả chính thức sẽ được thông báo sớm.
              </p>
            </div>
          )}

          {/* ── Question Interactive Matrix & Filter Toolbar ── */}
          <div className="bg-white dark:bg-night-surface rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-night-border shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-night-border">
              <div className="flex items-center gap-2 flex-wrap">
                <ListOrdered size={16} className="text-cam" strokeWidth={2} />
                <h3 className="font-heading font-bold text-base text-vutru dark:text-night-text">
                  Danh sách câu hỏi ({result.questions?.length ?? 0})
                </h3>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-night-elevated rounded-xl border border-gray-200 dark:border-night-border overflow-x-auto custom-scrollbar">
                <button
                  type="button"
                  onClick={() => setFilterType('ALL')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                    filterType === 'ALL'
                      ? 'bg-white dark:bg-night-surface text-cam shadow-2xs'
                      : 'text-vutruNhat dark:text-night-muted hover:text-vutru'
                  }`}
                >
                  Tất cả ({questionCounts.total})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('WRONG')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                    filterType === 'WRONG'
                      ? 'bg-white dark:bg-night-surface text-rose-600 shadow-2xs'
                      : 'text-vutruNhat dark:text-night-muted hover:text-rose-600'
                  }`}
                >
                  Làm sai ({questionCounts.wrong})
                </button>
                {questionCounts.partial > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilterType('PARTIAL')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                      filterType === 'PARTIAL'
                        ? 'bg-white dark:bg-night-surface text-amber-600 shadow-2xs'
                        : 'text-vutruNhat dark:text-night-muted hover:text-amber-600'
                    }`}
                  >
                    Đúng 1 phần ({questionCounts.partial})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setFilterType('CORRECT')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                    filterType === 'CORRECT'
                      ? 'bg-white dark:bg-night-surface text-emerald-600 shadow-2xs'
                      : 'text-vutruNhat dark:text-night-muted hover:text-emerald-600'
                  }`}
                >
                  Làm đúng ({questionCounts.correct})
                </button>
              </div>
            </div>

            {/* Matrix Quick Jump Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {result.questions?.map((q, idx) => {
                const isPartial = q.questionType === 'TRUE_FALSE' && !q.isCorrect && q.pointsEarned > 0;
                let bgState = 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800';
                if (q.isCorrect) {
                  bgState = 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
                } else if (isPartial) {
                  bgState = 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
                }

                return (
                  <button
                    key={q.questionId}
                    type="button"
                    onClick={() => scrollToQuestion(q.questionId)}
                    className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center border transition-all active:scale-90 ${bgState}`}
                    title={`Câu ${idx + 1}: ${q.isCorrect ? 'Đúng' : isPartial ? 'Đúng một phần' : 'Sai'}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Danh sách câu hỏi chi tiết ── */}
          <div className="space-y-5">
            {filteredQuestions.map((q, idx) => {
              const originalIndex = (result.questions?.findIndex((orig) => orig.questionId === q.questionId) ?? idx) + 1;
              const isPartialCorrect = q.questionType === 'TRUE_FALSE' && !q.isCorrect && q.pointsEarned > 0;

              return (
                <div
                  key={q.questionId}
                  id={`question-${q.questionId}`}
                  className={`bg-white dark:bg-night-surface rounded-2xl p-5 sm:p-6 border-2 transition-all shadow-xs ${
                    q.isCorrect
                      ? 'border-emerald-200/80 dark:border-emerald-900/50'
                      : isPartialCorrect
                      ? 'border-amber-200/80 dark:border-amber-900/50'
                      : 'border-rose-200/80 dark:border-rose-900/50'
                  }`}
                >
                  {/* Câu hỏi Header */}
                  <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-7 h-7 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 ${
                          q.isCorrect
                            ? 'bg-emerald-500 text-white'
                            : isPartialCorrect
                            ? 'bg-amber-500 text-white'
                            : 'bg-rose-500 text-white'
                        }`}
                      >
                        {originalIndex}
                      </span>
                      <span className="font-heading font-bold text-sm sm:text-base text-vutru dark:text-night-text">
                        Câu {originalIndex}
                      </span>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-gray-100 dark:bg-night-elevated text-vutruNhat dark:text-night-muted border border-gray-200/60 dark:border-night-border">
                        {getQuestionTypeName(q.questionType)}
                      </span>
                    </div>

                    {/* Points Badge */}
                    {q.questionType === 'ESSAY' && !q.reviewed && !canGrade ? (
                      <span className="text-xs font-bold px-3 py-1 rounded-xl border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 flex items-center gap-1.5">
                        <Clock size={13} className="text-amber-600 dark:text-amber-400" />
                        <span>Chờ duyệt điểm ({formatScore(q.points)}đ)</span>
                      </span>
                    ) : (
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-xl border flex items-center gap-1.5 ${
                          q.isCorrect
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                            : isPartialCorrect
                            ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                            : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                        }`}
                      >
                        <span>
                          {formatScore(q.pointsEarned)} / {formatScore(q.points)} điểm
                        </span>
                        {isPartialCorrect && <span className="opacity-80 font-normal">(đúng 1 phần)</span>}
                      </span>
                    )}
                  </div>

                  {/* Question Body Content */}
                  <div
                    className="prose dark:prose-invert max-w-none tiptap-content font-medium text-vutru dark:text-night-text text-sm sm:text-base leading-relaxed pl-0 sm:pl-9 mb-4"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(q.questionContent) }}
                  />

                  {/* Question Options / Statements Content */}
                  <div className="pl-0 sm:pl-9 space-y-2.5">
                    {/* 1. TỰ LUẬN (ESSAY) */}
                    {q.questionType === 'ESSAY' ? (
                      <div className="space-y-3">
                        {/* Status Badges & Regrade / Manual Grade Buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
                          <div className="flex items-center gap-2">
                            {q.essayStatus === 'AI_FAILED' || (q.aiFeedback && (q.aiFeedback.includes('quá tải') || q.aiFeedback.includes('lỗi xảy ra') || q.aiFeedback.includes('chấm tay sau'))) ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                <AlertTriangle size={13} className="shrink-0 text-rose-600 dark:text-rose-400" />
                                AI chưa chấm (Lỗi kết nối / Quá tải)
                              </span>
                            ) : q.reviewed ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle2 size={13} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                                Giáo viên đã duyệt điểm
                              </span>
                            ) : !canGrade ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                <Clock size={13} className="shrink-0 text-amber-600 dark:text-amber-400" />
                                Đang đợi giáo viên duyệt điểm
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                <Sparkles size={13} className="shrink-0 text-amber-600 dark:text-amber-400" />
                                Điểm nháp AI (Chờ duyệt)
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            {canGrade && (
                              <button
                                type="button"
                                onClick={() => handleApproveSingleEssay(q)}
                                disabled={approvingQuestionId === q.questionId}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all border cursor-pointer shadow-xs active:scale-95 ${
                                  q.reviewed
                                    ? 'border-emerald-400 bg-emerald-100/70 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200'
                                    : 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                }`}
                                title={q.reviewed ? 'Bấm để duyệt lại điểm số câu này' : 'Xác nhận điểm số này và gửi kết quả duyệt cho học sinh'}
                              >
                                <Send size={13} className={approvingQuestionId === q.questionId ? 'animate-spin' : ''} />
                                <span>
                                  {approvingQuestionId === q.questionId
                                    ? 'Đang gửi điểm...'
                                    : q.reviewed
                                    ? `🔄 Duyệt lại điểm (${formatScore(q.pointsEarned)}đ)`
                                    : `Duyệt & Gửi điểm (${formatScore(q.pointsEarned)}đ)`}
                                </span>
                              </button>
                            )}

                            {canGrade && (
                              <button
                                type="button"
                                onClick={() => editingQuestionId === q.questionId ? cancelManualGrading() : startManualGrading(q)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border border-blue-300 dark:border-blue-700 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 dark:text-blue-300 cursor-pointer shadow-sm"
                                title="Điều chỉnh điểm số hoặc nhận xét thủ công"
                              >
                                <PenLine size={13} />
                                {editingQuestionId === q.questionId ? 'Đóng sửa điểm' : '✏️ Sửa điểm & nhận xét'}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleRegradeEssay(q)}
                              disabled={regradingAnswerId === (q.answerId || q.questionId)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all border border-purple-300 dark:border-purple-700 bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 dark:text-purple-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm hover:shadow"
                              title="Yêu cầu AI chấm lại cho câu tự luận này"
                            >
                              <RotateCcw
                                size={13}
                                className={regradingAnswerId === (q.answerId || q.questionId) ? 'animate-spin' : ''}
                              />
                              {regradingAnswerId === (q.answerId || q.questionId) ? 'Đang chấm lại...' : '⚡ Chấm lại bằng AI'}
                            </button>
                          </div>
                        </div>

                        {/* Student response */}
                        <div className="bg-gray-50 dark:bg-night-elevated border border-gray-200 dark:border-night-border rounded-xl p-4">
                          <p className="text-xs font-bold text-vutruNhat dark:text-night-muted uppercase tracking-wider mb-1.5">
                            Bài làm của bạn:
                          </p>
                          <div className="text-vutru dark:text-night-text whitespace-pre-wrap text-sm leading-relaxed">
                            {q.textResponse || <span className="italic text-gray-400">Không có câu trả lời.</span>}
                          </div>
                        </div>

                        {/* Manual Grading Form for Teacher / TA — Rich Structured UI Editor */}
                        {canGrade && editingQuestionId === q.questionId && (
                          <div className="bg-white dark:bg-night-surface border-2 border-cam/40 dark:border-cam/30 rounded-2xl p-5 space-y-4 shadow-soft animate-fade-in">
                            {/* Header */}
                            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-night-border">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-cam/10 text-cam flex items-center justify-center shrink-0">
                                  <PenLine size={16} />
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-vutru dark:text-night-text">
                                    Chấm điểm & Duyệt nhận xét trực tiếp
                                  </h4>
                                  <p className="text-[11px] text-vutruNhat dark:text-night-muted">
                                    Chỉnh sửa trực quan điểm số, nhận xét chi tiết, điểm mạnh và lỗi cần sửa cho học sinh
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={cancelManualGrading}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-night-elevated transition-colors cursor-pointer"
                              >
                                <X size={16} />
                              </button>
                            </div>

                            {/* Điểm số */}
                            <div className="bg-gray-50 dark:bg-night-elevated p-4 rounded-xl border border-gray-200/70 dark:border-night-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                              <div>
                                <label className="block text-xs font-bold text-vutru dark:text-night-text">
                                  Điểm số bài thi (Tối đa {q.points} điểm):
                                </label>
                                <p className="text-[11px] text-vutruNhat dark:text-night-muted mt-0.5">
                                  Nhập điểm số đánh giá trực tiếp cho bài làm này
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <input
                                  type="number"
                                  min={0}
                                  max={q.points}
                                  step={0.25}
                                  value={manualScore}
                                  onChange={(e) => setManualScore(Number(e.target.value))}
                                  className="w-24 px-3 py-1.5 text-base font-extrabold text-center rounded-xl border-2 border-cam/60 bg-white dark:bg-night-surface text-cam font-heading focus:ring-2 focus:ring-cam focus:outline-none"
                                />
                                <span className="text-sm font-bold text-vutruNhat dark:text-night-muted">/ {q.points} điểm</span>
                                {manualScore >= (q.points * 0.5) ? (
                                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 flex items-center gap-1">
                                    <CheckCircle2 size={13} /> Đạt chuẩn
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
                                    Dưới 50%
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* 1. Nhận xét tổng quan */}
                            <div className="space-y-1.5">
                              <label className="block text-xs font-bold text-vutru dark:text-night-text">
                                Nhận xét tổng quan của giáo viên:
                              </label>
                              <textarea
                                rows={3}
                                value={editFeedbackData.summary || ''}
                                onChange={(e) => updateSummary(e.target.value)}
                                placeholder="Nhập nhận xét tổng quan về bài viết, khả năng hành văn và diễn đạt ý tưởng..."
                                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-night-border bg-white dark:bg-night-elevated text-vutru dark:text-night-text focus:ring-2 focus:ring-cam/50 focus:border-cam focus:outline-none leading-relaxed"
                              />
                            </div>

                            {/* 2. Điểm mạnh đạt được */}
                            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-900/40 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                                  <ThumbsUp size={13} /> Điểm mạnh đạt được ({(editFeedbackData.strengths || []).length}):
                                </label>
                                <button
                                  type="button"
                                  onClick={addStrength}
                                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-white dark:bg-night-elevated px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                                >
                                  <Plus size={12} /> Thêm điểm mạnh
                                </button>
                              </div>
                              {(editFeedbackData.strengths || []).map((s, i) => (
                                <div key={i} className="flex items-center gap-2">
                                  <span className="text-emerald-500 font-bold text-xs">•</span>
                                  <input
                                    type="text"
                                    value={s}
                                    onChange={(e) => updateStrength(i, e.target.value)}
                                    placeholder="VD: Bố cục rõ ràng, sử dụng đa dạng từ vựng..."
                                    className="flex-1 px-3 py-1.5 bg-white dark:bg-night-elevated border border-emerald-200/80 dark:border-emerald-900/50 rounded-lg text-xs text-vutru dark:text-night-text focus:outline-none focus:border-emerald-500"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeStrength(i)}
                                    className="p-1.5 text-gray-400 hover:text-rose-500 transition-colors rounded-lg cursor-pointer"
                                    title="Xóa điểm mạnh này"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              ))}
                              {(!editFeedbackData.strengths || editFeedbackData.strengths.length === 0) && (
                                <p className="text-[11px] text-emerald-700/70 dark:text-emerald-400/70 italic">
                                  Chưa có điểm mạnh nào được liệt kê. Bấm "Thêm điểm mạnh" để bổ sung.
                                </p>
                              )}
                            </div>

                            {/* 3. Lỗi cần sửa */}
                            <div className="bg-rose-50/40 dark:bg-rose-950/20 p-3.5 rounded-xl border border-rose-100 dark:border-rose-900/40 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                                  <PenLine size={13} /> Lỗi cần sửa ({(editFeedbackData.errors || []).length}):
                                </label>
                                <button
                                  type="button"
                                  onClick={addError}
                                  className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 hover:text-rose-800 bg-white dark:bg-night-elevated px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-800 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                                >
                                  <Plus size={12} /> Thêm lỗi
                                </button>
                              </div>
                              {(editFeedbackData.errors || []).map((err, i) => (
                                <div
                                  key={i}
                                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 bg-white dark:bg-night-elevated rounded-xl border border-rose-100 dark:border-rose-900/30 items-center shadow-2xs"
                                >
                                  <div className="sm:col-span-3">
                                    <select
                                      value={err.type}
                                      onChange={(e) => updateError(i, 'type', e.target.value)}
                                      className="w-full px-2 py-1 bg-gray-50 dark:bg-night-surface border border-gray-200 dark:border-night-border rounded-lg text-[11px] font-bold"
                                    >
                                      <option value="Ngữ pháp">Ngữ pháp</option>
                                      <option value="Chính tả">Chính tả</option>
                                      <option value="Từ vựng">Từ vựng</option>
                                      <option value="Nội dung">Nội dung</option>
                                    </select>
                                  </div>
                                  <div className="sm:col-span-4">
                                    <input
                                      type="text"
                                      value={err.original}
                                      onChange={(e) => updateError(i, 'original', e.target.value)}
                                      placeholder="Từ/câu sai trong bài làm..."
                                      className="w-full px-2.5 py-1 bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-800/40 rounded-lg text-xs line-through text-rose-700 dark:text-rose-300 font-medium"
                                    />
                                  </div>
                                  <div className="sm:col-span-4 flex items-center gap-1.5">
                                    <span className="text-gray-400 text-xs">→</span>
                                    <input
                                      type="text"
                                      value={err.corrected}
                                      onChange={(e) => updateError(i, 'corrected', e.target.value)}
                                      placeholder="Sửa thành chuẩn xác..."
                                      className="w-full px-2.5 py-1 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/40 rounded-lg text-xs font-bold text-emerald-800 dark:text-emerald-300"
                                    />
                                  </div>
                                  <div className="sm:col-span-1 text-right">
                                    <button
                                      type="button"
                                      onClick={() => removeError(i)}
                                      className="p-1 text-gray-400 hover:text-rose-500 transition-colors cursor-pointer"
                                      title="Xóa lỗi này"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                              {(!editFeedbackData.errors || editFeedbackData.errors.length === 0) && (
                                <p className="text-[11px] text-rose-700/70 dark:text-rose-400/70 italic">
                                  Không có lỗi nào được ghi nhận. Bấm "Thêm lỗi" nếu phát hiện sai sót.
                                </p>
                              )}
                            </div>

                            {/* 4. Từ vựng & cách diễn đạt nâng cao */}
                            <div className="bg-indigo-50/40 dark:bg-indigo-950/20 p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900/40 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5">
                                  <BookOpen size={13} /> Từ vựng & Cách diễn đạt nâng cao ({(editFeedbackData.vocabularySuggestions || []).length}):
                                </label>
                                <button
                                  type="button"
                                  onClick={addVocab}
                                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-800 bg-white dark:bg-night-elevated px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                                >
                                  <Plus size={12} /> Thêm từ vựng
                                </button>
                              </div>
                              {(editFeedbackData.vocabularySuggestions || []).map((v, i) => (
                                <div key={i} className="flex items-center gap-2">
                                  <span className="text-indigo-500 font-bold text-xs">•</span>
                                  <input
                                    type="text"
                                    value={v}
                                    onChange={(e) => updateVocab(i, e.target.value)}
                                    placeholder="VD: Thay vì 'good routine', dùng 'harmonious family ritual'..."
                                    className="flex-1 px-3 py-1.5 bg-white dark:bg-night-elevated border border-indigo-200/80 dark:border-indigo-900/50 rounded-lg text-xs text-vutru dark:text-night-text focus:outline-none focus:border-indigo-500"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeVocab(i)}
                                    className="p-1.5 text-gray-400 hover:text-rose-500 transition-colors rounded-lg cursor-pointer"
                                    title="Xóa từ vựng này"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              ))}
                            </div>

                            {/* Action Footer */}
                            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-night-border flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={cancelManualGrading}
                                className="px-4 py-2 text-xs font-semibold rounded-xl border border-gray-300 dark:border-night-border text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-night-border transition-all cursor-pointer"
                              >
                                Hủy bỏ
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveManualGrade(q)}
                                disabled={savingManualGrade}
                                className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                              >
                                <Send size={14} className={savingManualGrade ? 'animate-spin' : ''} />
                                <span>{savingManualGrade ? 'Đang lưu & gửi...' : `🚀 Lưu, Duyệt & Gửi điểm (${formatScore(manualScore)}đ)`}</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Alert box if AI failed */}
                        {(q.essayStatus === 'AI_FAILED' || (q.aiFeedback && (q.aiFeedback.includes('quá tải') || q.aiFeedback.includes('lỗi xảy ra') || q.aiFeedback.includes('chấm tay sau')))) && (
                          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/60 rounded-xl p-3.5 text-amber-900 dark:text-amber-200">
                            <div className="flex items-start gap-2.5 text-xs sm:text-sm">
                              <AlertTriangle size={17} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                              <div className="space-y-1 leading-relaxed">
                                <p className="font-bold text-amber-950 dark:text-amber-100">
                                  Chưa hoàn tất chấm điểm AI cho câu này
                                </p>
                                <p className="text-amber-800/90 dark:text-amber-300/90 text-xs">
                                  Hệ thống AI gặp sự cố hoặc gián đoạn kết nối khi nộp bài. Vui lòng bấm <span className="font-bold text-purple-700 dark:text-purple-300">"⚡ Chấm lại bằng AI"</span> hoặc <span className="font-bold text-blue-700 dark:text-blue-300">"✏️ Sửa điểm & nhận xét"</span> ở góc phải bên trên câu hỏi.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {q.aiFeedback && (canGrade || q.reviewed) ? (
                          <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-xl p-4 text-purple-950 dark:text-purple-200">
                            <AiFeedbackHeader reviewed={q.reviewed} />
                            <AiFeedbackView raw={q.aiFeedback} />
                          </div>
                        ) : !canGrade && !q.reviewed ? (
                          <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-night-elevated border border-gray-200/60 dark:border-night-border text-xs text-vutruNhat dark:text-night-muted flex items-center gap-2">
                            <Clock size={14} className="text-amber-500 shrink-0" />
                            <span>Nhận xét và phân tích chi tiết của giáo viên sẽ hiển thị sau khi bài được chấm và duyệt điểm.</span>
                          </div>
                        ) : null}
                      </div>
                    ) : q.questionType === 'TRUE_FALSE' ? (
                      /* 2. ĐÚNG / SAI ĐA MỆNH ĐỀ (a/b/c/d) */
                      <div className="space-y-2">
                        {q.options.map((opt, oIdx) => {
                          let studentAnswer: boolean | null = null;
                          try {
                            if (q.textResponse) {
                              const map = JSON.parse(q.textResponse) as Record<string, boolean>;
                              if (typeof map[opt.id] === 'boolean') studentAnswer = map[opt.id];
                            }
                          } catch {
                            // ignore parse error
                          }

                          const isAnswered = studentAnswer !== null;
                          const isStudentCorrect = isAnswered && studentAnswer === opt.isCorrect;

                          return (
                            <div
                              key={opt.id}
                              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                                !isAnswered
                                  ? 'border-gray-200 bg-gray-50/60 dark:bg-night-elevated dark:border-night-border'
                                  : isStudentCorrect
                                  ? 'border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/20 dark:border-emerald-800'
                                  : 'border-rose-200 bg-rose-50/60 dark:bg-rose-950/20 dark:border-rose-800'
                              }`}
                            >
                              <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                <span
                                  className={`w-6 h-6 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 ${
                                    !isAnswered
                                      ? 'bg-gray-200 text-gray-600 dark:bg-night-border dark:text-night-muted'
                                      : isStudentCorrect
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-rose-600 text-white'
                                  }`}
                                >
                                  {getStatementLabel(oIdx).toUpperCase()}
                                </span>
                                <div
                                  className="text-xs sm:text-sm text-vutru dark:text-night-text tiptap-content flex-1"
                                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(opt.content) }}
                                />
                              </div>

                              {/* Key vs Student Answer Comparison */}
                              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 text-xs font-bold">
                                <span
                                  className={`px-2.5 py-1 rounded-lg border text-[11px] ${
                                    opt.isCorrect
                                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                                      : 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-night-elevated dark:text-night-muted dark:border-night-border'
                                  }`}
                                >
                                  Đáp án: {opt.isCorrect ? 'ĐÚNG' : 'SAI'}
                                </span>

                                {isAnswered && (
                                  <span
                                    className={`px-2.5 py-1 rounded-lg border text-[11px] flex items-center gap-1 ${
                                      isStudentCorrect
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400'
                                        : 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800'
                                    }`}
                                  >
                                    Bạn chọn: {studentAnswer ? 'ĐÚNG' : 'SAI'}{' '}
                                    {isStudentCorrect ? (
                                      <Check size={12} strokeWidth={2.5} />
                                    ) : (
                                      <XCircle size={12} strokeWidth={2.5} />
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* 3. TRẮC NGHIỆM & ĐIỀN KHUYẾT */
                      <div className="space-y-2">
                        {(q.questionType === 'SHORT_ANSWER' || q.questionType === 'FILL_BLANK') && (
                          <div className="bg-gray-50 dark:bg-night-elevated border border-gray-200 dark:border-night-border rounded-xl p-3.5 mb-2">
                            <p className="text-xs font-bold text-vutruNhat dark:text-night-muted uppercase tracking-wider mb-1">
                              Câu trả lời của bạn:
                            </p>
                            <div className="text-vutru dark:text-night-text font-medium text-sm">
                              {q.textResponse || <span className="italic text-gray-400">Không có câu trả lời.</span>}
                            </div>
                          </div>
                        )}

                        {q.options.map((opt, oIdx) => {
                          const label = String.fromCharCode(65 + oIdx);

                          let borderClass = 'border-gray-200 dark:border-night-border bg-white dark:bg-night-surface';
                          let tag = null;

                          if (opt.isCorrect && opt.isSelected) {
                            borderClass =
                              'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/20 ring-1 ring-emerald-500';
                            tag = (
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 flex items-center gap-1">
                                <CheckCircle2 size={12} strokeWidth={2.5} /> Bạn đã chọn đúng
                              </span>
                            );
                          } else if (opt.isCorrect && !opt.isSelected) {
                            borderClass =
                              'border-emerald-400 border-dashed bg-emerald-50/40 dark:bg-emerald-950/10 dark:border-emerald-800';
                            tag = (
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100/70 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 flex items-center gap-1">
                                <Check size={12} strokeWidth={2.5} /> Đáp án chính xác
                              </span>
                            );
                          } else if (!opt.isCorrect && opt.isSelected) {
                            borderClass =
                              'border-rose-400 bg-rose-50/70 dark:bg-rose-950/20 ring-1 ring-rose-400';
                            tag = (
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 flex items-center gap-1">
                                <XCircle size={12} strokeWidth={2.5} /> Bạn đã chọn sai
                              </span>
                            );
                          }

                          return (
                            <div
                              key={opt.id}
                              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl border transition-all ${borderClass}`}
                            >
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <span
                                  className={`w-6 h-6 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 ${
                                    opt.isSelected
                                      ? opt.isCorrect
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-rose-600 text-white'
                                      : opt.isCorrect
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                      : 'bg-gray-100 text-gray-600 dark:bg-night-elevated dark:text-night-muted'
                                  }`}
                                >
                                  {label}
                                </span>
                                <div
                                  className="text-xs sm:text-sm text-vutru dark:text-night-text tiptap-content flex-1"
                                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(opt.content) }}
                                />
                              </div>

                              {tag && <div className="self-end sm:self-auto shrink-0">{tag}</div>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Giai thich dap an chi tiet do giao vien nhap khi soan de */}
                  {q.explanation && (
                    <div className="pl-0 sm:pl-9 mt-3">
                      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                        <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                          <Sparkles size={14} strokeWidth={2} /> Giải thích đáp án:
                        </p>
                        <div
                          className="prose dark:prose-invert max-w-none tiptap-content text-amber-950 dark:text-amber-200 text-sm leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(q.explanation) }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Bottom Action Toolbar ── */}
      <div className="pt-6 border-t border-gray-200 dark:border-night-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          type="button"
          onClick={handleSmartBack}
          className="btn btn-phu px-5 py-2.5 text-xs font-bold flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <span>{returnUrl ? 'Quay lại kho học liệu' : 'Quay lại'}</span>
        </button>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
          <button
            type="button"
            onClick={() => window.print()}
            className="btn btn-phu px-4 py-2.5 text-xs font-bold flex items-center gap-1.5"
          >
            <Printer size={15} strokeWidth={2} />
            <span>In kết quả</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (result.examId) {
                const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
                navigate(`/exams/take/${result.examId}${qs}`);
              } else {
                navigate(returnUrl || '/exams');
              }
            }}
            className="btn btn-chinh px-5 py-2.5 text-xs font-bold flex items-center gap-1.5 shadow-soft active:scale-95"
          >
            <RotateCcw size={15} strokeWidth={2} />
            <span>Làm lại đề thi</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamResult;
