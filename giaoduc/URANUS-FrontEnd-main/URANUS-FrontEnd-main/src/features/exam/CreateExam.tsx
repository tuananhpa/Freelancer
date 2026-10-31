import { getApiErrorMessage } from '../../services/api';
import Stepper, { StepConfig, StepState } from '../../components/ui/Stepper';
import StepperFooter from '../../components/ui/StepperFooter';
import { CheckCircle2, CloudOff } from 'lucide-react';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams, Link, useParams } from 'react-router-dom';
import TipTapEditor from '../../components/common/TipTapEditor';
import ExamImportAzotaModal, { ImportedOption, ImportedPassage, ImportedQuestion } from '../../components/exam/ExamImportAzotaModal';
import ExamPreviewModal from '../../components/exam/ExamPreviewModal';
import DistributePointsModal from '../../components/exam/DistributePointsModal';
import ExamPdfEditor from './pdf-import/ExamPdfEditor';
import type { AnswerSheetItem } from './pdf-import/AnswerSheetBuilder';
import DateTimePicker from '../../components/common/DateTimePicker';
import api from '../../services/api';
import axios from 'axios';
import Button from '../../components/ui/Button';
import AutocompleteInput from '../../components/ui/AutocompleteInput';
import Select from '../../components/ui/Select';
import { useToast } from '../../context/ToastContext';
import { folderApi } from '../../services/folderApi';
import { classExamApi } from '../../services/classExamApi';
import classService, { ClassFolder } from '../../services/class.service';
import ClassroomSelector from '../../components/common/ClassroomSelector';
import { mediaApi } from '../../services/mediaApi';
import { Sparkles, Settings, Wrench, Loader2, Folder, ChevronDown, ChevronUp, ChevronLeft, Lock, Copy, Eye, Share2, Trash2, GripVertical, Image as ImageIcon, CheckCircle, Circle, Save, RefreshCw, AlertCircle, FileText, Upload, PlusCircle, ArrowLeft, Calculator, AlertTriangle, Scale, Info } from 'lucide-react';
import BackButton from '../../components/ui/BackButton';
import Breadcrumb from '../../components/ui/Breadcrumb';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
  ensureSingleCorrectOption,
  getDefaultTfScoringConfig,
  getQuestionTypeBadge,
  getQuestionTypesForSubject,
  getStatementLabel,
  isEnglishSubject,
  makeMultipleChoiceOptions,
  makeTrueFalseStatements,
  type TfScoringConfig,
  type TfScoringThreshold,
} from './examQuestionTypes';

interface Option {
  id: string;
  content: string;
  isCorrect: boolean;
}


interface Question {
  id: string;
  content: string;
  points: number;
  skillTag: string;
  questionType?: string;
  groupId?: string;
  options: Option[];
  scoringConfig?: TfScoringConfig;
  explanation?: string;
}

const PREDEFINED_SUBJECTS = [
  "IELTS Academic", "IELTS General", "TOEIC SW", "TOEIC",
  "HSK 1", "HSK 2", "HSK 3", "HSK 4", "HSK 5", "HSK 6",
  "TOPIK I", "TOPIK II", "N5", "N4", "N3", "N2", "N1",
  "Digital SAT", "Tiếng Anh THPTQG", "Toán THPTQG", "Vật lý THPTQG",
  "Hóa học THPTQG", "Sinh học THPTQG", "ACT"
];

const CreateExam = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const folderIdParam = searchParams.get('folderId');
  const classIdParam = searchParams.get('classId');
  const [folderId, setFolderId] = useState<string | null>(folderIdParam);
  const [folderName, setFolderName] = useState('');
  const [myClasses, setMyClasses] = useState<any[]>([]);
  
  const [selectedClasses, setSelectedClasses] = useState<string[]>(classIdParam ? [classIdParam] : []);
  const [selectedClassFolders, setSelectedClassFolders] = useState<Record<string, string>>({});
  const [classFoldersMap, setClassFoldersMap] = useState<Record<string, ClassFolder[]>>({});
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const classDropdownRef = useRef<HTMLDivElement>(null);
  
  const [loading, setLoading] = useState(false);
  const assignmentSectionRef = useRef<HTMLDivElement>(null);
  const [importing, setImporting] = useState(false);
  const [expandedQuestionIds, setExpandedQuestionIds] = useState<Record<string, boolean>>({});
  const [expandedGroupIds, setExpandedGroupIds] = useState<Record<string, boolean>>({});
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);

  const toggleGroupExpanded = (id: string) => {
    setExpandedGroupIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleQuestionExpanded = (id: string) => {
    setExpandedQuestionIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  const [importPreview, setImportPreview] = useState<{
    questions: ImportedQuestion[];
    passages: ImportedPassage[];
    fileUrl: string | null;
    meta: any;
  } | null>(null);

  // Danh sách nhóm câu hỏi (bài đọc)
  const [questionGroups, setQuestionGroups] = useState<Array<{
    id: string;
    groupTitle: string;
    passageText: string;
    audioUrl?: string;
    orderIndex: number;
  }>>([]);
  const [groupAudioUploading, setGroupAudioUploading] = useState<Record<string, boolean>>({});

  const [exam, setExam] = useState({
    title: '',
    description: '',
    subject: '',
    grade: '',
    durationMinutes: 45,
    /** Loại bài để ghi vào cột sổ điểm: TX 15 phút, GK 1 tiết, CK cuối kì; rỗng = luyện tập */
    assessmentType: '' as '' | 'TX' | 'GK' | 'CK',
    passingScore: 50,
    shuffleQuestions: true,
    startTime: '',
    endTime: '',
    reviewPolicy: 'IMMEDIATELY',
    accessCode: '',
    maxAttempts: 1,
    visibility: 'PUBLIC' as 'PUBLIC' | 'HIDDEN' | 'CLASSROOM',
    examCode: '',
    isPublished: false,
  });

  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const typeParam = searchParams.get('type') as 'DETAILED' | 'ANSWER_SHEET' | null;
  const [examType, setExamType] = useState<'DETAILED' | 'ANSWER_SHEET'>(typeParam || 'DETAILED');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioTracks, setAudioTracks] = useState<{ label: string; url: string }[]>([]);
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(true);
  const [sheetItems, setSheetItems] = useState<AnswerSheetItem[]>([]);

  const [questions, setQuestions] = useState<Question[]>([
    {
      id: Date.now().toString(),
      content: '',
      points: 1,
      skillTag: 'GENERAL',
      questionType: 'MULTIPLE_CHOICE',
      options: makeMultipleChoiceOptions(4),
    }
  ]);

  const [isDistributeModalOpen, setIsDistributeModalOpen] = useState(false);

  const totalExamPoints = useMemo(() => {
    return Math.round(questions.reduce((sum, q) => sum + (q.points || 0), 0) * 100) / 100;
  }, [questions]);

  const handleApplyDistributedPoints = (updatedPoints: { id: string; points: number }[]) => {
    const pointMap = new Map(updatedPoints.map(p => [p.id, p.points]));
    setQuestions(prev => prev.map(q => {
      const newPoint = pointMap.get(q.id);
      if (newPoint !== undefined) {
        return { ...q, points: newPoint };
      }
      return q;
    }));
    toast.success('Đã chia đều thang điểm cho các câu hỏi thành công!');
  };

  const autoSavedIdRef = useRef<string | null>(null);
  const lastSavedDataRef = useRef<string>('');

  // ── Stepper State ──────────────────────────────────────────────────────────
  const EXAM_STEPS: StepConfig[] = [
    { id: 'type', title: 'Loại đề thi', subtitle: 'Chi tiết hoặc PDF' },
    { id: 'basic', title: 'Thông tin cơ bản', subtitle: 'Tên, môn, thời gian' },
    { id: 'content', title: 'Nội dung đề thi', subtitle: 'Câu hỏi / phiếu trả lời' },
    { id: 'settings', title: 'Cài đặt & Giao đề', subtitle: 'Quyền, lớp học, thư mục' },
  ];

  type ExamStepErrors = Record<number, string[]>;
  const [currentExamStep, setCurrentExamStep] = useState(0);
  const [examStepErrors, setExamStepErrors] = useState<ExamStepErrors>({ 0: [], 1: [], 2: [], 3: [] });
  const [showExamValidation, setShowExamValidation] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [autoSavedAt, setAutoSavedAt] = useState<Date | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isCreatingRef = useRef(false);

  const validateExamStep = (step: number): string[] => {
    if (step === 0) return []; // examType always set
    if (step === 1) {
      const errs: string[] = [];
      if (!exam.title.trim()) errs.push('Tên bài thi là bắt buộc');
      if (!exam.subject.trim()) errs.push('Môn học là bắt buộc');
      if (!exam.durationMinutes || exam.durationMinutes <= 0) errs.push('Thời gian làm bài phải lớn hơn 0');
      return errs;
    }
    if (step === 2) {
      if (examType === 'ANSWER_SHEET') {
        if (sheetItems.length === 0) return ['Phiếu trả lời cần ít nhất 1 câu'];
      } else {
        if (questions.length === 0) return ['Đề thi phải có ít nhất 1 câu hỏi'];
      }
      return [];
    }
    return [];
  };

  const computeExamStepStates = (): StepState[] => {
    return EXAM_STEPS.map((_, i) => {
      if (showExamValidation && (examStepErrors[i]?.length ?? 0) > 0) return 'error';
      if (i === currentExamStep) return 'active';
      if (i < currentExamStep) return 'completed';
      return 'pending';
    });
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const updateQuestionGroup = (id: string, updates: Partial<{ groupTitle: string; passageText: string }>) => {
    setQuestionGroups(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  // Cập nhật state active question mặc định là câu đầu tiên
  useEffect(() => {
    if (questions.length > 0 && Object.keys(expandedQuestionIds).length === 0 && !id) {
      setExpandedQuestionIds({ [questions[0].id]: true });
    }
  }, []);

  // ── Auto-save: debounce 500ms, race-condition safe ─────────────────────────
  const buildAutoSavePayload = () => {
    if (examType === 'ANSWER_SHEET') {
      return {
        ...exam,
        accessCode: exam.visibility === 'HIDDEN' ? exam.accessCode?.trim() : undefined,
        assignedClassIds: exam.visibility === 'CLASSROOM' ? selectedClasses : undefined,
        examType: 'ANSWER_SHEET',
        pdfUrl: pdfUrl?.startsWith('blob:') ? null : pdfUrl,
        audioUrl: audioUrl?.startsWith('blob:') ? null : audioUrl,
        audioTracks,
        folderId: folderId || undefined,
        startTime: exam.startTime || null,
        endTime: exam.endTime || null,
        isPublished: exam.isPublished || false,
        questionGroups: [],
        questions: sheetItemsToQuestions(sheetItems),
      };
    }
    return {
      ...exam,
      accessCode: exam.visibility === 'HIDDEN' ? exam.accessCode?.trim() : undefined,
      assignedClassIds: exam.visibility === 'CLASSROOM' ? selectedClasses : undefined,
      examType: 'DETAILED',
      folderId: folderId || undefined,
      startTime: exam.startTime || null,
      endTime: exam.endTime || null,
      isPublished: exam.isPublished || false,
      questionGroups: questionGroups.map((g, i) => ({ id: g.id, groupTitle: g.groupTitle, passageText: g.passageText, audioUrl: g.audioUrl, orderIndex: i })),
      questions: questions.map((q, index) => ({
        id: q.id && q.id.length >= 36 ? q.id : undefined,
        content: q.content, points: q.points, skillTag: q.skillTag, orderIndex: index,
        questionType: q.questionType || 'MULTIPLE_CHOICE', groupId: q.groupId || undefined,
        explanation: q.explanation || undefined,
        options: (q.questionType === 'MULTIPLE_CHOICE' || !q.questionType ? ensureSingleCorrectOption(q.options) : q.options).map(o => ({
          id: o.id && o.id.length >= 36 ? o.id : undefined,
          content: o.content, isCorrect: o.isCorrect,
        }))
      }))
    };
  };

  // Serialized snapshot — only actual form data, no status/savedId to avoid loops
  const autoSaveSnapshot = JSON.stringify({ exam, examType, sheetItems, questionGroups, questions: questions.map(q => ({ id: q.id, content: q.content, points: q.points, options: q.options, questionType: q.questionType, explanation: q.explanation })), pdfUrl, audioUrl, audioTracks, folderId, selectedClasses });

  useEffect(() => {
    if (!exam.title.trim()) return;
    // O Buoc 4/4, xoa trang o "Thoi gian lam bai" de go lai so moi tao ra
    // NaN tam thoi -> JSON.stringify thanh null -> backend tra 400 (@NotNull),
    // hien "Luu that bai" du UI trong con lanh thuong. Bo qua chu ky autosave
    // nay, doi lan tiep theo khi gia tri lai hop le.
    if (!exam.durationMinutes || exam.durationMinutes < 1) return;

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(async () => {
      const payload = buildAutoSavePayload();
      const payloadStr = JSON.stringify(payload);
      if (lastSavedDataRef.current === payloadStr) return;

      if (isCreatingRef.current) return; // POST in-flight, skip

      // abort() chi co tac dung neu signal duoc truyen thang vao request - truoc
      // day controller duoc tao nhung khong gan vao api.post/put nen request cu
      // van chay ngam, tao 2 PUT chong cheo cho cung 1 de thi va de dung do
      // (delete/insert cau hoi + tuy chon) o backend.
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setAutoSaveStatus('saving');
      try {
        const targetId = id || autoSavedIdRef.current;
        if (!targetId) {
          isCreatingRef.current = true;
          const res = await api.post('/exams', payload, { signal: controller.signal });
          autoSavedIdRef.current = res.data.id;
          lastSavedDataRef.current = payloadStr;
          window.history.replaceState(null, '', `/exams/${res.data.id}/edit`);
        } else {
          await api.put(`/exams/${targetId}`, payload, { signal: controller.signal });
          lastSavedDataRef.current = payloadStr;
        }
        setAutoSaveStatus('saved');
        setAutoSavedAt(new Date());
      } catch (err: any) {
        if (axios.isCancel(err)) return;
        setAutoSaveStatus('error');
      } finally {
        isCreatingRef.current = false;
      }
    }, 500);

    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSaveSnapshot]);

  // IntersectionObserver to track active question for sidebar
  useEffect(() => {
    if (examType === 'ANSWER_SHEET') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id.replace('question-', '');
            setActiveQuestionId(id);
            // Cuộn sidebar item vào view mà không làm nhảy trang
            const btn = document.getElementById(`sidebar-btn-${id}`);
            const container = document.getElementById('sidebar-scroll-container');
            if (btn && container) {
              const scrollTop = btn.offsetTop - container.offsetTop - (container.clientHeight / 2) + (btn.clientHeight / 2);
              container.scrollTo({ top: scrollTop, behavior: 'smooth' });
            }
          }
        });
      },
      {
        root: null,
        rootMargin: '-30% 0px -50% 0px', // Active khi ở 1/3 màn hình phía trên
        threshold: 0
      }
    );

    questions.forEach((q) => {
      const el = document.getElementById(`question-${q.id}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [questions, examType]);

  // Fetch exam data if in edit mode
  useEffect(() => {
    if (id) {
      setLoading(true);
      api.get(`/exams/${id}`).then(res => {
        const data = res.data;
        setExam({
          title: data.title,
          description: data.description || '',
          subject: data.subject || '',
          grade: data.grade || '',
          durationMinutes: data.durationMinutes,
          assessmentType: data.assessmentType || '',
          passingScore: data.passingScore,
          shuffleQuestions: data.shuffleQuestions,
          startTime: data.startTime || '',
          endTime: data.endTime || '',
          reviewPolicy: data.reviewPolicy || 'IMMEDIATELY',
          accessCode: data.accessCode || '',
          // data.maxAttempts co the la 0 (khong gioi han) - "|| 1" coi 0 la falsy
          // nen luon ghi de thanh 1, xoa mat cai dat khong gioi han moi lan sua de.
          maxAttempts: data.maxAttempts ?? 1,
          visibility: data.visibility || 'PUBLIC',
          examCode: data.examCode || '',
          isPublished: Boolean(data.isPublished),
        });
        
        if (data.folderId) setFolderId(data.folderId);
        if (data.examType) setExamType(data.examType);
        if (data.pdfUrl) setPdfUrl(data.pdfUrl);
        if (data.audioUrl) setAudioUrl(data.audioUrl);
        if (data.audioTracks) setAudioTracks(data.audioTracks);
        
        if (data.questions && data.questions.length > 0) {
          setQuestions(data.questions.map((q: any) => {
            const type = q.questionType || 'MULTIPLE_CHOICE';
            const options = (q.options || []).map((o: Option) => ({
              id: o.id,
              content: o.content,
              isCorrect: o.isCorrect
            }));
            return {
              id: q.id,
              content: q.content,
              points: q.points,
              skillTag: q.skillTag || 'GENERAL',
              questionType: type,
              groupId: q.groupId,
              explanation: q.explanation || '',
              options: type === 'MULTIPLE_CHOICE' ? ensureSingleCorrectOption(options) : options,
            };
          }));
          setExpandedQuestionIds({ [data.questions[0].id]: true });
          
          if (data.examType === 'ANSWER_SHEET') {
            setSheetItems(data.questions.map((q: any, i: number) => {
              let type: 'ABCD' | 'TRUE_FALSE' | 'ESSAY' = 'ABCD';
              if (q.questionType === 'TRUE_FALSE') type = 'TRUE_FALSE';
              if (q.questionType === 'ESSAY' || q.questionType === 'SHORT_ANSWER') type = 'ESSAY';

              const correctOption = (q.options || []).find((o: any) => o.isCorrect);
              let correctAnswer = undefined;
              if (type === 'ABCD') {
                const optIdx = q.options && correctOption ? q.options.indexOf(correctOption) : -1;
                if (correctOption && correctOption.content && correctOption.content.trim().length === 1 && /^[A-Z]$/i.test(correctOption.content.trim())) {
                  correctAnswer = correctOption.content.trim().toUpperCase();
                } else if (optIdx >= 0) {
                  correctAnswer = String.fromCharCode(65 + optIdx);
                } else {
                  correctAnswer = 'A';
                }
              } else if (type === 'ESSAY') {
                correctAnswer = (q.options || []).map((o: any) => o.content).join(' ||| ');
              }

              let statements = undefined;
              let scoringConfig = undefined;
              if (type === 'TRUE_FALSE') {
                statements = (q.options || []).map((o: any, idx: number) => ({
                  id: o.id,
                  label: String.fromCharCode(97 + idx),
                  content: o.content || '',
                  isCorrect: o.isCorrect
                }));
                try {
                  scoringConfig = q.scoringConfig ? JSON.parse(q.scoringConfig) : undefined;
                } catch (e) {
                  console.error('Failed to parse scoring config', e);
                }
              }

              return {
                id: q.id,
                orderIndex: i,
                type,
                points: q.points,
                correctAnswer,
                optionsCount: q.options ? q.options.length : 4,
                options: q.options || [],
                statements,
                scoringConfig,
                explanation: q.explanation || '',
              };
            }));
          }
        } else {
          // De thi dang sua co 0 cau hoi that (vd: moi tao, con dang o Buoc
          // 1/4) - phai xoa cau hoi placeholder rong mac dinh (dung cho luong
          // TAO MOI), neu khong autosave se gui no len va bi 400 "Noi dung
          // cau hoi khong duoc de trong".
          setQuestions([]);
        }
        if (data.questionGroups && data.questionGroups.length > 0) {
          setQuestionGroups(data.questionGroups.map((g: any) => ({
            id: g.id,
            groupTitle: g.groupTitle || '',
            passageText: g.passageText || '',
            audioUrl: g.audioUrl || undefined,
            orderIndex: g.orderIndex || 0,
          })));
        }
      }).catch(err => {
        toast.error('Lỗi khi tải thông tin bài thi');
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [id]);

  useEffect(() => {
    classService.getMyClasses().then(res => {
      setMyClasses(res.content || res.data?.content || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (classDropdownRef.current && !classDropdownRef.current.contains(event.target as Node)) {
        setIsClassDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    selectedClasses.forEach(classId => {
      if (!classFoldersMap[classId]) {
        classService.getClassFolders(classId)
          .then((res) => {
            setClassFoldersMap(prev => ({ ...prev, [classId]: res || [] }));
          })
          .catch(() => {
            // Silently ignore classes the teacher does not manage
            setClassFoldersMap(prev => ({ ...prev, [classId]: [] }));
          });
      }
    });
  }, [selectedClasses, classFoldersMap]);

  useEffect(() => {
    if (id && myClasses.length > 0) {
      classExamApi.getClassExamsByExamId(id).then(res => {
        const assignments = res || [];
        const myClassIdSet = new Set(myClasses.map((c: any) => c.id));
        const manageableClassIds = assignments
          .map((a: any) => a.classroomId)
          .filter((cid: string) => myClassIdSet.has(cid));
        const folderMap: Record<string, string> = {};
        assignments.forEach((a: any) => {
          if (a.folderId && myClassIdSet.has(a.classroomId)) {
            folderMap[a.classroomId] = a.folderId;
          }
        });
        setSelectedClasses(manageableClassIds);
        setSelectedClassFolders(folderMap);
      }).catch(() => {});
    }
  }, [id, myClasses]);

  useEffect(() => {
    if (folderIdParam) {
      setFolderId(folderIdParam);
      folderApi.getMyFolders().then((res) => {
        const f = res.data?.content?.find((x: any) => x.id === folderIdParam);
        if (f) setFolderName(f.name);
      });
    }
  }, [folderIdParam]);

  const handleAddQuestion = () => handleAddQuestionWithType('MULTIPLE_CHOICE');

  const handleAddQuestionWithType = (questionType: string) => {
    const newId = Date.now().toString();
    let options: Option[] = [];
    let scoringConfig: TfScoringConfig | undefined = undefined;

    if (questionType === 'MULTIPLE_CHOICE') {
      options = makeMultipleChoiceOptions(4);
    } else if (questionType === 'TRUE_FALSE') {
      options = makeTrueFalseStatements(4);
      scoringConfig = getDefaultTfScoringConfig(4);
    } else if (questionType === 'SHORT_ANSWER') {
      options = [{ id: `${Date.now()}`, content: '', isCorrect: true }];
    } else {
      options = [];
    }

    setQuestions(prev => [
      ...prev,
      {
        id: newId,
        content: '',
        points: 1,
        skillTag: 'GENERAL',
        questionType,
        options,
        scoringConfig,
      }
    ]);
    setExpandedQuestionIds(prev => ({ ...prev, [newId]: true }));

    setTimeout(() => {
      const el = document.getElementById(`question-${newId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleDuplicateQuestion = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = questions.find(q => q.id === id);
    if (!target) return;
    const newId = Date.now().toString();
    const newQ: Question = {
      ...target,
      id: newId,
      options: target.options.map(opt => ({
        ...opt,
        id: Date.now().toString() + Math.random(),
      })),
    };
    const idx = questions.findIndex(q => q.id === id);
    const updated = [...questions];
    updated.splice(idx + 1, 0, newQ);
    setQuestions(updated);
    setExpandedQuestionIds(prev => ({ ...prev, [newId]: true }));
    toast.success('Đã nhân bản câu hỏi!');
  };

  const handleRemoveQuestion = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Ngăn trigger Accordion Toggle
    if (questions.length === 1) return toast.warning('Đề thi phải có ít nhất 1 câu hỏi');
    const newQuestions = questions.filter(q => q.id !== id);
    setQuestions(newQuestions);
    
    // Nếu đang xóa câu có trạng thái mở, dọn dẹp state
    setExpandedQuestionIds(prev => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
  };

  const handleQuestionChange = (id: string, field: keyof Question, value: any) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  // --- DYNAMIC OPTIONS LOGIC ---
  const handleAddOption = (qId: string) => {
    setQuestions(prev => prev.map(q => {
      if (q.id !== qId) return q;
      return {
        ...q,
        options: [
          ...q.options.map((o) => ({ ...o, isCorrect: false })),
          { id: Date.now().toString(), content: '', isCorrect: q.options.length === 0 },
        ]
      };
    }));
  };

  const handleRemoveOption = (qId: string, optId: string) => {
    setQuestions(prev => prev.map(q => {
      if (q.id !== qId) return q;
      const newOptions = q.options.filter(o => o.id !== optId);
      
      // Nếu option bị xóa đang là đáp án đúng duy nhất, gán lại đáp án đúng cho phần tử đầu tiên (nếu còn)
      const hasCorrect = newOptions.some(o => o.isCorrect);
      if (!hasCorrect && newOptions.length > 0) {
        newOptions[0].isCorrect = true;
      }

      return { ...q, options: newOptions };
    }));
  };

  const handleOptionChange = (qId: string, optId: string, value: string) => {
    setQuestions(prev => prev.map(q => {
      if (q.id !== qId) return q;
      return {
        ...q,
        options: q.options.map(o => o.id === optId ? { ...o, content: value } : o)
      };
    }));
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    setQuestions(prev => {
      const items = Array.from(prev);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination!.index, 0, reorderedItem);
      return items;
    });
  };

  const handleSetCorrect = (qId: string, optId: string) => {
    // Trắc nghiệm: chỉ đúng 1 đáp án
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        if (q.questionType && q.questionType !== 'MULTIPLE_CHOICE') return q;
        return {
          ...q,
          options: q.options.map((o) => ({ ...o, isCorrect: o.id === optId })),
        };
      }),
    );
  };

  const ensureSingleCorrectForMc = (opts: Option[]): Option[] => ensureSingleCorrectOption(opts);

  const handleSetStatementCorrect = (qId: string, optId: string, isCorrect: boolean) => {
    setQuestions(prev => prev.map(q => {
      if (q.id !== qId) return q;
      return {
        ...q,
        options: q.options.map(o => (o.id === optId ? { ...o, isCorrect } : o)),
      };
    }));
  };

  // Lấy nhãn chữ cái (A, B, C...)
  const getAlphabetLabel = (index: number) => String.fromCharCode(65 + index);

  const availableQuestionTypes = getQuestionTypesForSubject(exam.subject);
  const englishMode = isEnglishSubject(exam.subject);

  useEffect(() => {
    if (!englishMode) return;
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.questionType === 'TRUE_FALSE' || q.questionType === 'SHORT_ANSWER') {
          return { ...q, questionType: 'MULTIPLE_CHOICE', options: [] };
        }
        return q;
      }),
    );
  }, [englishMode]);

  const applyQuestionType = (qId: string, type: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        let newOptions = [...q.options];
        if (type === 'ESSAY') {
          newOptions = [];
        } else if (type === 'TRUE_FALSE') {
          newOptions = makeTrueFalseStatements(4);
          // Gắn default scoring config chuẩn BGDĐT
          return {
            ...q,
            questionType: type,
            options: newOptions,
            scoringConfig: q.scoringConfig ?? getDefaultTfScoringConfig(4),
          };
        } else if (type === 'SHORT_ANSWER') {
          newOptions = [{ id: `${Date.now()}-ans`, content: '', isCorrect: true }];
        } else if (type === 'MULTIPLE_CHOICE') {
          newOptions =
            q.options.length >= 2 && q.questionType === 'MULTIPLE_CHOICE'
              ? q.options
              : makeMultipleChoiceOptions(4);
        }
        return { ...q, questionType: type, options: newOptions };
      }),
    );
  };

  const isUUID = (str?: string | null): boolean => {
    if (!str) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
  };

  const sheetItemsToQuestions = (items: AnswerSheetItem[]) =>
    items.map((item, index) => {
      const qId = isUUID(item.id) ? item.id : undefined;
      const preservedOpts = item.options || [];
      const points = typeof item.points === 'number' && !isNaN(item.points) ? item.points : 1.0;

      if (item.type === 'ABCD') {
        const correct = (item.correctAnswer || 'A').toUpperCase();
        const optionLetters = Array.from({ length: item.optionsCount || 4 }, (_, i) => String.fromCharCode(65 + i));
        return {
          id: qId,
          content: `<p>Câu ${index + 1}</p>`,
          points,
          skillTag: 'GENERAL',
          orderIndex: index,
          questionType: 'MULTIPLE_CHOICE',
          explanation: item.explanation || undefined,
          options: optionLetters.map((letter, i) => ({
            id: isUUID(preservedOpts[i]?.id) ? preservedOpts[i].id : undefined,
            content: letter,
            isCorrect: correct === letter,
          })),
        };
      }
      if (item.type === 'TRUE_FALSE') {
        // Dạng mới: multi-statement dùng item.statements
        const stmts = item.statements && item.statements.length > 0
          ? item.statements
          : [{ label: 'a', content: '', isCorrect: true }, { label: 'b', content: '', isCorrect: true },
             { label: 'c', content: '', isCorrect: true }, { label: 'd', content: '', isCorrect: true }];
        return {
          id: qId,
          content: `<p>Câu ${index + 1}</p>`,
          points,
          skillTag: 'GENERAL',
          orderIndex: index,
          questionType: 'TRUE_FALSE',
          scoringConfig: JSON.stringify(item.scoringConfig ?? getDefaultTfScoringConfig(stmts.length)),
          explanation: item.explanation || undefined,
          options: stmts.map((s, i) => ({
            id: isUUID(s.id) ? s.id : (isUUID(preservedOpts[i]?.id) ? preservedOpts[i].id : undefined),
            content: s.content || `<p>Mệnh đề ${s.label})</p>`,
            isCorrect: s.isCorrect,
          })),
        };
      }
      const answers = (item.correctAnswer || '')
        .split('|||')
        .map((s) => s.trim())
        .filter(Boolean);
      return {
        id: qId,
        content: `<p>Câu ${index + 1}</p>`,
        points,
        skillTag: 'GENERAL',
        orderIndex: index,
        questionType: answers.length > 0 ? 'SHORT_ANSWER' : 'ESSAY',
        explanation: item.explanation || undefined,
        options:
          answers.length > 0
            ? answers.map((ans, i) => ({
                id: isUUID(preservedOpts[i]?.id) ? preservedOpts[i].id : undefined,
                content: ans,
                isCorrect: true
              }))
            : [],
      };
    });

  const handleSubmit = async (publish: boolean) => {
    if (!exam.title.trim()) return toast.warning('Vui lòng nhập tên bài thi');
    
    // ── Chế độ Phiếu trả lời (ANSWER_SHEET): chỉ cần chọn A/B/C/D ──
    if (examType === 'ANSWER_SHEET') {
      if (sheetItems.length === 0) {
        return toast.warning('Vui lòng thêm ít nhất 1 câu trên phiếu trả lời.');
      }
      const missingAnswer = sheetItems
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => item.type === 'ABCD' && !item.correctAnswer);
      if (missingAnswer.length > 0) {
        const nums = missingAnswer.map(({ index }) => index + 1).join(', ');
        return toast.warning(`Câu ${nums} chưa chọn đáp án đúng.`);
      }

      setLoading(true);
      
      let finalPdfUrl = pdfUrl;
      if (pdfFile) {
        try {
          const uploadRes = await mediaApi.uploadFile(pdfFile, 'exams');
          finalPdfUrl = uploadRes.url;
        } catch (err) {
          setLoading(false);
          toast.error('Lỗi khi tải lên file PDF');
          return;
        }
      }

      let finalAudioUrl = audioUrl;
      if (audioFile) {
        try {
          const uploadRes = await mediaApi.uploadFile(audioFile, 'exams');
          finalAudioUrl = uploadRes.url;
        } catch (err) {
          setLoading(false);
          toast.error('Lỗi khi tải lên file âm thanh');
          return;
        }
      }

      const payload = {
        ...exam,
        accessCode: exam.visibility === 'HIDDEN' ? exam.accessCode?.trim() : undefined,
        assignedClassIds: exam.visibility === 'CLASSROOM' ? selectedClasses : undefined,
        examType: 'ANSWER_SHEET',
        pdfUrl: finalPdfUrl,
        audioUrl: finalAudioUrl,
        audioTracks,
        folderId: folderId || undefined,
        startTime: exam.startTime || null,
        endTime: exam.endTime || null,
        isPublished: publish,
        questionGroups: [],
        questions: sheetItemsToQuestions(sheetItems),
      };

      try {
        let res;
        const targetId = id || autoSavedIdRef.current;
        if (targetId) {
          res = await api.put(`/exams/${targetId}`, payload);
          toast.success('Cập nhật đề thi thành công!');
        } else {
          res = await api.post('/exams', payload);
          toast.success('Tạo đề thi thành công!', {
            description: 'Mã đề thi để chia sẻ cho học sinh:',
            copyText: res.data.examCode,
            duration: 8000,
          });
        }

        if (selectedClasses.length > 0) {
          try {
            const assignments = selectedClasses.map(classId => ({
              classroomId: classId,
              folderId: classFoldersMap[classId] ? selectedClassFolders[classId] : undefined
            }));
            await classExamApi.batchSyncClassExams(targetId || res.data.id, assignments);
            toast.success(id ? 'Đã gán đề thi vào lớp học!' : 'Đã tạo đề thi và gán vào lớp học!');
          } catch (e) {
            // Ignore if already linked
          }
          navigate(`/classes/${selectedClasses[0]}/classwork`);
          return;
        }

        if (id) {
          navigate(-1);
        } else {
          navigate(folderId ? `/library/folders/${folderId}` : '/exams');
        }
      } catch (err: any) {
        const message = getApiErrorMessage(err, id ? 'Lỗi khi cập nhật đề thi' : 'Lỗi khi tạo đề thi');
        toast.error(message);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Chuẩn hoá: mỗi câu trắc nghiệm chỉ còn đúng 1 đáp án
    const normalizedQuestions = questions.map((q) => {
      if (q.questionType === 'MULTIPLE_CHOICE' || !q.questionType) {
        return { ...q, options: ensureSingleCorrectForMc(q.options) };
      }
      return q;
    });
    setQuestions(normalizedQuestions);
    
    // hasContent: check if HTML has meaningful content (text or media)
    const hasContent = (html: string) => {
      if (!html) return false;
      if (/<(img|video|audio|iframe)[^>]*>/i.test(html)) return true;
      return html.replace(/<[^>]+>/g, '').trim().length > 0;
    };

    // Validate cơ bản - chỉ áp dụng cho trắc nghiệm (chế độ soạn chi tiết)
    const invalidMCQuestions = normalizedQuestions
      .map((q, index) => ({ q, index }))
      .filter(
        ({ q }) =>
          (q.questionType === 'MULTIPLE_CHOICE' || !q.questionType) &&
          (q.options.length < 2 ||
            q.options.filter((o) => hasContent(o.content)).length < 2),
      );
    if (invalidMCQuestions.length > 0) {
      const nums = invalidMCQuestions.map(({ index }) => index + 1).join(', ');
      return toast.warning(
        `Câu trắc nghiệm ${nums} chưa đủ đáp án có nội dung (tối thiểu 2 phương án A/B/C/D).`,
      );
    }
    const noCorrectAnswer = normalizedQuestions
      .map((q, index) => ({ q, index }))
      .filter(
        ({ q }) =>
          (q.questionType === 'MULTIPLE_CHOICE' || !q.questionType) &&
          q.options.filter((o) => o.isCorrect).length !== 1,
      );
    if (noCorrectAnswer.length > 0) {
      const nums = noCorrectAnswer.map(({ index }) => index + 1).join(', ');
      return toast.warning(`Câu trắc nghiệm ${nums} phải chọn đúng 1 đáp án (nút tròn xanh).`);
    }
    const invalidTf = normalizedQuestions.filter(
      (q) =>
        q.questionType === 'TRUE_FALSE' &&
        (q.options.length < 1 || q.options.some((o) => !hasContent(o.content))),
    );
    if (invalidTf.length > 0) {
      return toast.warning('Câu Đúng/Sai cần ít nhất 1 ý và mỗi ý phải có nội dung.');
    }
    const invalidShort = normalizedQuestions.filter(
      (q) =>
        q.questionType === 'SHORT_ANSWER' &&
        !q.options.some((o) => o.isCorrect && o.content.replace(/<[^>]+>/g, '').trim()),
    );
    if (invalidShort.length > 0) {
      return toast.warning('Câu Trả lời ngắn cần nhập đáp án đúng.');
    }

    setLoading(true);

    const payload = {
      ...exam,
      accessCode: exam.visibility === 'HIDDEN' ? exam.accessCode?.trim() : undefined,
      assignedClassIds: exam.visibility === 'CLASSROOM' ? selectedClasses : undefined,
      examType: 'DETAILED',
      folderId: folderId || undefined,
      startTime: exam.startTime || null,
      endTime: exam.endTime || null,
      isPublished: publish,
      questionGroups: questionGroups.map((g, i) => ({
        id: g.id,
        groupTitle: g.groupTitle,
        passageText: g.passageText,
        audioUrl: g.audioUrl,
        orderIndex: i,
      })),
      questions: normalizedQuestions.map((q, index) => ({
        id: q.id && q.id.length >= 36 ? q.id : undefined,
        content: q.content,
        points: q.points,
        skillTag: q.skillTag,
        orderIndex: index,
        questionType: q.questionType || 'MULTIPLE_CHOICE',
        groupId: q.groupId || undefined,
        scoringConfig: q.scoringConfig ? (typeof q.scoringConfig === 'string' ? q.scoringConfig : JSON.stringify(q.scoringConfig)) : undefined,
        explanation: q.explanation || undefined,
        options: (q.questionType === 'MULTIPLE_CHOICE' || !q.questionType
          ? ensureSingleCorrectForMc(q.options)
          : q.options
        ).map(o => ({
          id: o.id && o.id.length >= 36 ? o.id : undefined,
          content: o.content,
          isCorrect: o.isCorrect
        }))
      }))
    };

    try {
      let res;
      const targetId = id || autoSavedIdRef.current;
      
      if (targetId) {
        res = await api.put(`/exams/${targetId}`, payload);
        toast.success('Cập nhật đề thi thành công!');
      } else {
        res = await api.post('/exams', payload);
        toast.success('Tạo đề thi thành công!', {
          description: 'Mã đề thi để chia sẻ cho học sinh:',
          copyText: res.data.examCode,
          duration: 8000,
        });
      }

      if (selectedClasses.length > 0) {
        try {
          const assignments = selectedClasses.map(classId => ({
            classroomId: classId,
            folderId: classFoldersMap[classId] ? selectedClassFolders[classId] : undefined
          }));
          await classExamApi.batchSyncClassExams(targetId || res.data.id, assignments);
          toast.success(id ? 'Đã gán đề thi vào lớp học!' : 'Đã tạo đề thi và gán vào lớp học!');
        } catch (e) {
          // Ignore if already linked
        }
        if (id) {
          navigate(-1);
        } else {
          navigate(`/classes/${selectedClasses[0]}/classwork`);
        }
        return;
      }

      if (id) {
        navigate(-1);
      } else {
        navigate(folderId ? `/library/folders/${folderId}` : '/exams');
      }
    } catch (err: any) {
      const message = err instanceof Error ? err.message : (typeof err === 'object' && err !== null && 'response' in err ? (err as Record<string, any>).response?.data?.message : '');
      toast.error(message || (id ? 'Lỗi khi cập nhật đề thi' : 'Lỗi khi tạo đề thi'));
    } finally {
      setLoading(false);
    }
  };

  const structureInputRef = useRef<HTMLInputElement>(null);
  const aiScanInputRef = useRef<HTMLInputElement>(null);
  const [importMode, setImportMode] = useState<'structure' | 'ai-scan' | null>(null);

  const mapImportedQuestions = (data: Record<string, any>): { questions: ImportedQuestion[]; passages: ImportedPassage[] } => {
    const passages: ImportedPassage[] = (data.passages || []).map((p: any) => ({
      id: p.id,
      instruction: p.instruction,
      content: p.content,
      questionNumbers: p.questionNumbers,
    }));

    const structured = data.structuredQuestions as any[] | undefined;
    if (structured && structured.length > 0) {
      const questions: ImportedQuestion[] = structured.map((q: any) => {
        const options: ImportedOption[] = (q.options || []).map((o: any) => ({
          id: Date.now().toString() + Math.random().toString(36).substring(7),
          content: o.content || '',
          isCorrect: !!o.isCorrect,
        }));
        return {
          id: Date.now().toString() + Math.random().toString(36).substring(7),
          sourceNumber: q.sourceNumber,
          sectionId: q.sectionId ?? null,
          stem: q.stem || '',
          content: q.stem || '',
          skillTag: q.skillTag || 'GENERAL',
          questionType: 'MULTIPLE_CHOICE',
          points: q.points ?? (structured?.length ? Math.round(10 / structured.length * 100) / 100 : 0.25),
          options: ensureSingleCorrectOption(options),
        };
      });
      return { questions, passages };
    }

    const questions: ImportedQuestion[] = (data.questions || []).map((q: any, idx: number) => {
      const options: ImportedOption[] = (q.options || []).map((o: any) => ({
        id: Date.now().toString() + Math.random().toString(36).substring(7),
        content: o.content || '',
        isCorrect: !!o.isCorrect,
      }));
      return {
        id: Date.now().toString() + Math.random().toString(36).substring(7),
        sourceNumber: (q.orderIndex ?? idx) + 1,
        sectionId: null,
        stem: q.content || '',
        content: q.content || '',
        skillTag: q.skillTag || 'GENERAL',
        questionType: 'MULTIPLE_CHOICE',
        points: q.points ?? 1,
        options: ensureSingleCorrectOption(options),
      };
    });
    return { questions, passages };
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>, mode: 'structure' | 'ai-scan') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const name = file.name.toLowerCase();
    if (mode === 'structure' && !name.endsWith('.pdf') && !name.endsWith('.docx')) {
      toast.warning('Mapping cấu trúc chỉ hỗ trợ PDF hoặc DOCX có text');
      return;
    }
    if (mode === 'ai-scan' && !/\.(pdf|docx|jpg|jpeg|png)$/.test(name)) {
      toast.warning('AI Scan hỗ trợ PDF, DOCX, JPG, PNG');
      return;
    }

    setImporting(true);
    setImportMode(mode);
    const formData = new FormData();
    formData.append('file', file);
    const endpoint = mode === 'structure' ? '/exams/import-structure' : '/exams/import-ai-scan';

    try {
      const res = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = res.data;
      const { questions: imported, passages } = mapImportedQuestions(data);
      if (imported.length === 0) {
        toast.warning('Không trích xuất được câu hỏi nào từ file');
        return;
      }

      const fileUrl = mode === 'structure' && file.type === 'application/pdf'
        ? URL.createObjectURL(file)
        : null;

      setImportPreview({
        questions: imported,
        passages,
        fileUrl,
        meta: {
          fileName: data.fileName,
          sourceFormat: data.sourceFormat,
          parseMethod: data.parseMethod,
          message: data.message,
          totalExtracted: data.totalExtracted,
          mappedWithAnswerKey: data.mappedWithAnswerKey,
        },
      });
    } catch (err: any) {
      const message = err instanceof Error ? err.message : (typeof err === 'object' && err !== null && 'response' in err ? (err as Record<string, any>).response?.data?.message : '');
      toast.error(message || 'Lỗi khi import đề thi');
    } finally {
      setImporting(false);
      setImportMode(null);
      if (structureInputRef.current) structureInputRef.current.value = '';
      if (aiScanInputRef.current) aiScanInputRef.current.value = '';
    }
  };

  const confirmImport = (imported: ImportedQuestion[], passages: ImportedPassage[]) => {
    // Build questionGroups từ passages — passage lưu riêng, không nhúng vào nội dung câu hỏi
    const newGroups = passages
      .filter(p => p.content && p.content.trim())
      .map((p, i) => ({
        id: p.id,
        groupTitle: p.instruction || `Đoạn đọc ${i + 1}`,
        passageText: p.content,
        orderIndex: (questionGroups.length) + i,
      }));

    const merged: Question[] = imported.map(q => {
      const stemHtml = q.stem.includes('<br') ? q.stem : q.stem.replace(/\n/g, '<br/>');
      return {
        id: q.id,
        content: stemHtml,
        points: q.points,
        skillTag: q.skillTag,
        groupId: q.sectionId ?? undefined,
        options: q.options,
      };
    });

    setQuestionGroups(prev => [
      ...prev.filter(g => !newGroups.some(ng => ng.id === g.id)),
      ...newGroups,
    ]);

    setQuestions((prev) => {
      const isEmptyStarter = prev.length === 1 && !prev[0].content && prev[0].options.length === 0;
      return isEmptyStarter ? merged : [...prev, ...merged];
    });
    if (merged.length > 0) {
      setExpandedQuestionIds(prev => ({ ...prev, [merged[0].id]: true }));
    }
    if (importPreview?.fileUrl) {
      URL.revokeObjectURL(importPreview.fileUrl);
    }
    setImportPreview(null);
    toast.success(`Đã thêm ${imported.length} câu hỏi vào đề thi`);
  };

  // ── Step 1: Exam type selector ──
  const handleExamTypeChange = async (newType: 'DETAILED' | 'ANSWER_SHEET') => {
    if (newType === examType) return;
    const hasContent = examType === 'DETAILED'
      ? questions.some(q => q.content || q.options.length > 0)
      : sheetItems.length > 0;
    if (hasContent) {
      const ok = await toast.confirm(
        'Đổi loại đề sẽ không tương thích với dữ liệu bước 3 hiện tại. Bạn có chắc muốn tiếp tục? Dữ liệu bước 3 sẽ được giữ nguyên cho đến khi bạn xác nhận xóa.',
        { title: 'Đổi loại đề thi', confirmLabel: 'Đổi loại đề', cancelLabel: 'Hủy' },
      );
      if (!ok) return;
    }
    setExamType(newType);
  };

  const handleExamFinish = (publish: boolean) => {
    const errors: Record<number, string[]> = {};
    for (let i = 0; i <= 3; i++) errors[i] = validateExamStep(i);
    setExamStepErrors(errors);
    setShowExamValidation(true);
    const hasErrors = Object.values(errors).some(e => e.length > 0);
    if (hasErrors) {
      const firstErrStep = Object.entries(errors).find(([, e]) => e.length > 0);
      if (firstErrStep) setCurrentExamStep(Number(firstErrStep[0]));
      return;
    }
    handleSubmit(publish);
  };

  const examStepStates = computeExamStepStates();
  const currentExamStepErrors = showExamValidation ? (examStepErrors[currentExamStep] ?? []) : [];

  const AutoSaveBadge = () => {
    if (autoSaveStatus === 'saving') return <span className="flex items-center gap-1.5 text-xs text-gray-400"><Loader2 className="w-3 h-3 animate-spin" />Đang lưu...</span>;
    if (autoSaveStatus === 'saved') return <span className="flex items-center gap-1.5 text-xs text-green-500"><CheckCircle2 className="w-3 h-3" />Đã lưu{autoSavedAt ? ` lúc ${autoSavedAt.getHours()}:${String(autoSavedAt.getMinutes()).padStart(2, '0')}` : ''}</span>;
    if (autoSaveStatus === 'error') return <span className="flex items-center gap-1.5 text-xs text-red-500"><CloudOff className="w-3 h-3" />Lưu thất bại</span>;
    return null;
  };

  return (
    <div className="min-h-screen bg-kem dark:bg-night-page animate-fade-in pb-10 w-full -mx-3 sm:-mx-6 -my-4 sm:-my-6 sm:w-[calc(100%+3rem)] w-[calc(100%+1.5rem)]">
      <main className="mx-auto p-4 sm:p-6 pb-20 w-full max-w-[1400px]">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <BackButton to="/exams" />
            <h1 className="text-3xl font-extrabold text-vutru font-heading">{id ? 'Chỉnh Sửa Đề Thi' : 'Soạn Đề Thi'}</h1>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <Button onClick={() => setShowPreviewModal(true)} variant="outline" className="border-cam text-cam hover:bg-cam/10 flex-1 md:flex-none whitespace-nowrap">
              <Eye size={18} className="mr-2 inline" /> Xem trước
            </Button>
          </div>
        </div>

        {/* Stepper Bar */}
        <div className="bg-white dark:bg-night-surface rounded-2xl border border-gray-100 dark:border-night-border shadow-sm px-4 sm:px-8 pt-6 pb-4 mb-6">
          <Stepper
            steps={EXAM_STEPS}
            currentStep={currentExamStep}
            stepStates={examStepStates}
            onStepClick={setCurrentExamStep}
          />
        </div>

        {/* Step Error Banner */}
        {currentExamStepErrors.length > 0 && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            {currentExamStepErrors.map((e, i) => (
              <p key={i} className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5">
                <AlertTriangle size={15} className="shrink-0 text-red-500" aria-hidden="true" />
                <span>{e}</span>
              </p>
            ))}
          </div>
        )}

        {/* ── Step 0: Exam Type Selector ── */}
        {currentExamStep === 0 && (
          <section className="bg-white dark:bg-night-surface p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-night-border w-full mb-6 animate-fade-in">
            <h2 className="text-xl font-bold text-camDam mb-6 font-heading flex items-center gap-2">
              <FileText size={20} className="text-gray-400" /> Chọn loại đề thi
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {([
                {
                  type: 'DETAILED' as const,
                  title: 'Đề chi tiết',
                  desc: 'Soạn từng câu hỏi với các loại: Trắc nghiệm, Đúng/Sai, Tự luận, Trả lời ngắn. Hỗ trợ import từ PDF/DOCX.',
                  icon: '📝',
                },
                {
                  type: 'ANSWER_SHEET' as const,
                  title: 'Phiếu trả lời (PDF)',
                  desc: 'Upload đề thi dạng PDF và thiết lập đáp án đúng cho từng câu. Học sinh làm bài trực tuyến chọn A/B/C/D.',
                  icon: '📄',
                },
              ]).map(opt => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => handleExamTypeChange(opt.type)}
                  className={`flex flex-col items-start gap-3 p-6 rounded-2xl border-2 text-left transition-all hover:scale-[1.01] ${
                    examType === opt.type
                      ? 'border-cam bg-cam/5 shadow-md shadow-cam/10'
                      : 'border-gray-200 dark:border-night-border hover:border-cam/40'
                  }`}
                >
                  <span className="text-4xl">{opt.icon}</span>
                  <div>
                    <p className="text-lg font-bold text-vutru dark:text-white mb-1">{opt.title}</p>
                    <p className="text-sm text-gray-500 dark:text-night-muted">{opt.desc}</p>
                  </div>
                  {examType === opt.type && (
                    <span className="text-xs font-bold text-cam bg-cam/10 px-3 py-1 rounded-full">Đang chọn</span>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── Step 1: Basic Info ── */}
        {currentExamStep === 1 && (
        <section className={`bg-white dark:bg-night-surface p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-night-border w-full mb-8 animate-fade-in ${examType === 'ANSWER_SHEET' ? 'shrink-0' : ''}`}>
            <div 
              className={`flex justify-between items-center cursor-pointer select-none border-gray-100 dark:border-night-border ${isSettingsExpanded ? 'border-b pb-4 mb-4' : ''}`}
              onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
            >
              <h2 className="text-xl font-bold text-camDam flex items-center gap-2 m-0 font-heading">
                <Settings size={20} className="text-gray-400" /> Thông tin chung
              </h2>
              <button className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-1 rounded-md transition-colors">
                {isSettingsExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>
            
            {isSettingsExpanded && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Tên bài thi <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  className="w-full p-3 border-2 border-gray-200 dark:border-night-border rounded-xl focus:border-cam outline-none transition-colors bg-white dark:bg-night-elevated" 
                  placeholder="VD: Đề thi Giữa kỳ Tiếng Anh 12..."
                  value={exam.title}
                  onChange={e => setExam({...exam, title: e.target.value})}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">Mô tả thêm</label>
                <textarea 
                  className="w-full p-3 border-2 border-gray-200 dark:border-night-border rounded-xl focus:border-cam outline-none transition-colors bg-white dark:bg-night-elevated" 
                  rows={2}
                  placeholder="Một vài lời nhắn nhủ tới học viên..."
                  value={exam.description}
                  onChange={e => setExam({...exam, description: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Môn học</label>
                <AutocompleteInput
                  value={exam.subject}
                  onChange={subject => setExam({...exam, subject})}
                  options={['Toán học', 'Vật lý', 'Hóa học', 'Sinh học', 'Ngữ văn', 'Lịch sử', 'Địa lý', 'Tiếng Anh', 'Tin học', 'GDCD']}
                  className="w-full p-3 border-2 border-gray-200 dark:border-night-border rounded-xl focus:border-cam outline-none transition-colors bg-white dark:bg-night-elevated"
                  placeholder="VD: Toán, Ngữ Văn, Tiếng Anh..."
                />

                {/* Predefined Hashtags for Quick Selection */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {PREDEFINED_SUBJECTS.map(tag => {
                    const currentSubjects = exam.subject ? exam.subject.split(',').map(s => s.trim()).filter(Boolean) : [];
                    const isSelected = currentSubjects.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          let newSubjects = [...currentSubjects];
                          if (isSelected) {
                            newSubjects = newSubjects.filter(s => s !== tag);
                          } else {
                            newSubjects.push(tag);
                          }
                          setExam({...exam, subject: newSubjects.join(', ')});
                        }}
                        className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${isSelected ? 'bg-cam/10 text-camDam border-cam/30 font-bold' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  {englishMode
                    ? 'Tiếng Anh: chỉ Trắc nghiệm và Tự luận (không có Đúng/Sai).'
                    : 'Toán/Lý/Hóa…: Trắc nghiệm · Đúng/Sai (ý a–d) · Trả lời ngắn · Tự luận.'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Khối lớp</label>
                <AutocompleteInput
                  value={exam.grade}
                  onChange={grade => setExam({...exam, grade})}
                  options={['Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5', 'Lớp 6', 'Lớp 7', 'Lớp 8', 'Lớp 9', 'Lớp 10', 'Lớp 11', 'Lớp 12', 'Đại học', 'Khác']}
                  className="w-full p-3 border-2 border-gray-200 dark:border-night-border rounded-xl focus:border-cam outline-none transition-colors bg-white dark:bg-night-elevated"
                  placeholder="VD: Lớp 10, Lớp 11..."
                />
              </div>
              <div className="md:col-span-2">
                {folderId && folderName ? (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-camNhat/60 border border-cam/15 text-sm">
                    <span><Folder size={16} className="inline mr-1.5" /> Thêm vào thư viện:</span>
                    <Link to={`/library/folders/${folderId}`} className="font-bold text-camDam hover:underline">
                      {folderName}
                    </Link>
                  </div>
                ) : null}
              </div>

              </div>
            )}
          </section>
        )}

        {/* ── Step 3: Settings & Assignment ── */}
        {currentExamStep === 3 && (
          <section className="bg-white dark:bg-night-surface p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-night-border w-full mb-8 animate-fade-in flex flex-col gap-6">
            <div>
              <p className="text-sm font-bold text-gray-700 dark:text-night-text mb-2">Loại bài kiểm tra <span className="font-normal text-vutruNhat">— điểm tự ghi vào đúng cột sổ điểm và tính vào TB học kì</span></p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {([
                  { t: 'TX', m: 15, label: '15 phút', sub: 'Thường xuyên · hệ số 1', tone: 'sky' },
                  { t: 'GK', m: 45, label: '1 tiết', sub: 'Giữa kì · hệ số 2', tone: 'violet' },
                  { t: 'CK', m: 90, label: 'Cuối kì', sub: 'Học kì · hệ số 3', tone: 'rose' },
                  { t: '', m: exam.durationMinutes, label: 'Luyện tập', sub: 'Không tính vào sổ điểm', tone: 'gray' },
                ] as const).map((o) => {
                  const on = exam.assessmentType === o.t;
                  return (
                    <button key={o.label} type="button" aria-pressed={on} onClick={() => setExam({ ...exam, assessmentType: o.t, durationMinutes: o.m })}
                      className={`rounded-2xl border-2 p-3 text-left transition-all ${on ? 'border-cam bg-camNhat/60 shadow-cam' : 'border-gray-100 dark:border-night-border hover:border-cam/40'}`}>
                      <span className={`inline-block rounded-lg px-2 py-0.5 text-[11px] font-bold bg-${o.tone}-100 text-${o.tone}-700`}>{o.t || 'LT'}</span>
                      <p className="mt-1.5 font-heading text-lg font-bold text-vutru">{o.label}</p>
                      <p className="text-xs text-vutruNhat">{o.sub}</p>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Thời gian làm bài (Phút) <span className="text-red-500">*</span></label>
                <input 
                  type="number" 
                  className="w-full p-3 border-2 border-gray-200 dark:border-night-border rounded-xl focus:border-cam outline-none transition-colors font-medium text-lg bg-white dark:bg-night-elevated" 
                  value={exam.durationMinutes}
                  onChange={e => setExam({...exam, durationMinutes: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Điểm đạt (% trên tổng điểm, VD: 50%) <span className="text-red-500">*</span></label>
                <input 
                  type="number"
                  className="w-full p-3 border-2 border-gray-200 dark:border-night-border rounded-xl focus:border-cam outline-none transition-colors font-medium text-lg bg-white dark:bg-night-elevated" 
                  value={exam.passingScore}
                  onChange={e => setExam({...exam, passingScore: parseInt(e.target.value)})}
                />
              </div>
              <div className="flex items-center gap-3 md:col-span-2 mt-2 bg-gray-50 dark:bg-night-elevated p-4 rounded-xl border border-transparent dark:border-night-border">
                <div className="relative flex items-center">
                  <input 
                    type="checkbox" 
                    id="shuffle" 
                    className="w-5 h-5 accent-cam"
                    checked={exam.shuffleQuestions}
                    onChange={e => setExam({...exam, shuffleQuestions: e.target.checked})}
                  />
                </div>
                <div>
                  <label htmlFor="shuffle" className="font-bold text-vutru cursor-pointer select-none">Trộn câu hỏi và đáp án</label>
                  <p className="text-xs text-gray-500 mt-0.5">Mỗi học viên sẽ thấy thứ tự câu hỏi khác nhau để hạn chế gian lận.</p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-night-border pt-4">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2"><Lock size={16} className="text-gray-400" /> Quyền truy cập & Bảo mật</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Quyền truy cập</label>
                    <div className="flex flex-col gap-3 mb-6">
                      <label className="flex items-center gap-2 cursor-pointer bg-gray-50 hover:bg-gray-100 dark:bg-night-elevated dark:hover:bg-night-surface px-3 py-2 rounded-lg border border-transparent transition-colors w-fit">
                        <input type="radio" name="visibility" checked={exam.visibility === 'PUBLIC'} onChange={() => { setExam({...exam, visibility: 'PUBLIC'}); }} className="w-4 h-4 accent-cam" />
                        <span className="text-sm font-medium">Công khai trên thư viện</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer bg-gray-50 hover:bg-gray-100 dark:bg-night-elevated dark:hover:bg-night-surface px-3 py-2 rounded-lg border border-transparent transition-colors w-fit">
                        <input type="radio" name="visibility" checked={exam.visibility === 'HIDDEN'} onChange={() => { setExam({...exam, visibility: 'HIDDEN'}); }} className="w-4 h-4 accent-cam" />
                        <span className="text-sm font-medium">Chỉ người có link / mã (ẩn khỏi thư viện)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer bg-gray-50 hover:bg-gray-100 dark:bg-night-elevated dark:hover:bg-night-surface px-3 py-2 rounded-lg border border-transparent transition-colors w-fit">
                        <input type="radio" name="visibility" checked={exam.visibility === 'CLASSROOM'} onChange={() => { setExam({...exam, visibility: 'CLASSROOM'}); }} className="w-4 h-4 accent-cam" />
                        <span className="text-sm font-medium">Chỉ học sinh trong lớp được giao</span>
                      </label>
                    </div>

                    {/* Class Assignment Section */}
                    {exam.visibility === 'CLASSROOM' && (
                      <div className="mb-6 animate-fade-in space-y-4" ref={assignmentSectionRef}>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Giao đề cho lớp học</label>
                          <div className="bg-cam/5 border border-cam/20 rounded-2xl p-4">
                            <div className="text-xs text-vutruNhat dark:text-night-muted mb-3">
                              Đề thi sau khi {id ? 'lưu' : 'tạo'} sẽ tự động được gán vào lớp học bạn chọn dưới đây. (Tùy chọn)
                            </div>
                            <ClassroomSelector selectedClassIds={selectedClasses} onChange={setSelectedClasses} />
                          </div>
                        </div>

                        {selectedClasses.length > 0 && (
                          <div className="bg-white dark:bg-night-surface border border-gray-200 dark:border-night-border rounded-2xl p-4 space-y-3 shadow-2xs">
                            <label className="flex items-center gap-1.5 text-xs font-bold text-vutru dark:text-night-text uppercase tracking-wide">
                              <Folder size={14} className="text-cam" />
                              Gán vào Chủ đề / Thư mục trong Lớp học (Tùy chọn)
                            </label>
                            <p className="text-xs text-vutruNhat dark:text-night-muted">
                              Chọn chủ đề tương ứng trong từng lớp học để bài tập hiển thị gọn gàng trên trang Bài tập (Classwork):
                            </p>

                            <div className="space-y-2.5">
                              {selectedClasses.map(classId => {
                                const cls = myClasses.find(c => c.id === classId);
                                const folders = classFoldersMap[classId] || [];
                                return (
                                  <div
                                    key={classId}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-gray-50 dark:bg-night-elevated border border-gray-200/80 dark:border-night-border rounded-xl"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <span className="text-xs sm:text-sm font-bold text-cam truncate block">
                                        {cls?.name || 'Lớp học'}
                                      </span>
                                      <span className="text-[11px] text-vutruNhat dark:text-night-muted">
                                        {cls?.subject ? cls.subject : 'Chung'}
                                      </span>
                                    </div>

                                    <div className="sm:w-64 shrink-0">
                                      <Select
                                        className="w-full p-2 text-xs border border-gray-200 dark:border-night-border rounded-lg focus:border-cam outline-none bg-white dark:bg-night-surface text-vutru dark:text-night-text font-medium"
                                        value={selectedClassFolders[classId] || ''}
                                        onChange={(v) => setSelectedClassFolders(prev => ({ ...prev, [classId]: v }))}
                                        options={[
                                          { value: '', label: '-- Chưa phân loại (Chung) --' },
                                          ...folders.map(f => ({ value: f.id, label: f.name })),
                                        ]}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {exam.visibility === 'HIDDEN' && (
                    <div className="animate-fade-in">
                      <label className="block text-sm font-bold text-gray-700 mb-1">Mã truy cập bảo vệ <span className="text-gray-400 font-normal">(Tùy chọn)</span></label>
                      <input 
                        type="text" 
                        className="w-full p-3 border-2 border-gray-200 dark:border-night-border rounded-xl focus:border-cam outline-none transition-colors bg-white dark:bg-night-elevated" 
                        placeholder="Nhập mã truy cập bảo vệ đề thi..."
                        value={exam.accessCode}
                        onChange={e => setExam({...exam, accessCode: e.target.value})}
                      />
                      <p className="text-xs text-gray-500 mt-1">Nếu để trống, ai có link cũng có thể vào thi.</p>
                    </div>
                  )}
                </div>

                
                {exam.examCode && (
                  <div className="bg-cam/5 border border-cam/20 rounded-xl p-4 flex items-center justify-between mb-4">
                    <div>
                      <span className="text-xs text-camDam font-bold block mb-1">MÃ CHIA SẺ ĐỀ THI</span>
                      <span className="text-lg font-mono font-bold text-gray-800 dark:text-gray-100">{exam.examCode}</span>
                    </div>
                    <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={() => {navigator.clipboard.writeText(exam.examCode); toast.success('Đã copy mã đề thi!');}}>
                      <Copy size={16} /> Copy Mã
                    </Button>
                  </div>
                )}
              </div>

              {/* Cài đặt nâng cao */}
              <div className="md:col-span-2 pt-4 mt-2 border-t border-gray-100 dark:border-night-border">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2"><Wrench size={16} className="text-gray-400" /> Cài đặt nâng cao</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <DateTimePicker
                      label="Thời gian bắt đầu (Tùy chọn)"
                      value={exam.startTime}
                      onChange={(val) => setExam({ ...exam, startTime: val })}
                      showPresets={true}
                    />
                  </div>
                  <div>
                    <DateTimePicker
                      label="Thời gian kết thúc (Tùy chọn)"
                      value={exam.endTime}
                      onChange={(val) => setExam({ ...exam, endTime: val })}
                      showPresets={true}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      Số lần làm bài tối đa <span className="text-gray-400 font-normal">(Nhập 0 để không giới hạn)</span>
                    </label>
                    <input 
                      type="number" 
                      min="0"
                      placeholder="Không giới hạn"
                      className="w-full p-3 border-2 border-gray-200 dark:border-night-border rounded-xl focus:border-cam outline-none transition-colors bg-white dark:bg-night-elevated" 
                      value={exam.maxAttempts === 0 ? '' : exam.maxAttempts}
                      onChange={e => setExam({...exam, maxAttempts: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Xem lại bài sau khi nộp</label>
                    <Select
                      className="p-3 border-2 border-gray-200 dark:border-night-border rounded-xl focus:border-cam outline-none transition-colors bg-white dark:bg-night-elevated"
                      value={exam.reviewPolicy}
                      onChange={(v) => setExam({...exam, reviewPolicy: v})}
                      options={[
                        { value: 'IMMEDIATELY', label: 'Cho phép xem ngay' },
                        { value: 'AFTER_ALL_SUBMITTED', label: 'Xem khi kết thúc giờ thi' },
                        { value: 'NEVER', label: 'Không cho phép xem' },
                      ]}
                    />
                  </div>
                </div>
              </div>
          </section>
        )}

          {/* ── Step 2: Content (questions or PDF) ── */}
          {/* Quản lý nhóm bài đọc */}
          {currentExamStep === 2 && examType !== 'ANSWER_SHEET' && (
            <section className="bg-white dark:bg-night-surface p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-night-border w-full mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-camDam flex items-center gap-2 m-0 font-heading">
                  <Wrench size={20} className="text-gray-400" /> Quản lý bài đọc <span className="text-sm text-gray-400 font-normal">(Tùy chọn)</span>
                </h2>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    const newId = Date.now().toString();
                    setQuestionGroups(prev => [
                      ...prev,
                      { id: newId, groupTitle: `Đoạn đọc ${prev.length + 1}`, passageText: '', orderIndex: prev.length }
                    ]);
                    setExpandedGroupIds(prev => ({ ...prev, [newId]: true }));
                  }}
                  className="border-cam text-cam hover:bg-cam/10"
                >
                  + Thêm bài đọc
                </Button>
              </div>

              {questionGroups.length > 0 ? (
                <div className="space-y-4">
                  {questionGroups.map((g, idx) => {
                    const isExpanded = expandedGroupIds[g.id];
                    return (
                      <div key={g.id} className="border border-gray-200 dark:border-night-border rounded-xl bg-white dark:bg-night-elevated overflow-hidden">
                        {/* Header */}
                        <div 
                          className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-night-surface transition-colors"
                          onClick={() => toggleGroupExpanded(g.id)}
                        >
                          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </div>
                          <div className="flex-1 font-bold text-vutru">{g.groupTitle || `Đoạn đọc ${idx + 1}`}</div>
                          <button 
                            className="text-red-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors ml-auto"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Bạn có chắc muốn xóa bài đọc này? Các câu hỏi thuộc bài đọc sẽ bị tách thành câu hỏi độc lập.')) {
                                setQuestionGroups(prev => prev.filter(pg => pg.id !== g.id));
                                // Gỡ bỏ groupId khỏi các câu hỏi
                                setQuestions(prev => prev.map(q => q.groupId === g.id ? { ...q, groupId: undefined } : q));
                                setExpandedGroupIds(prev => {
                                  const newState = { ...prev };
                                  delete newState[g.id];
                                  return newState;
                                });
                              }
                            }}
                            title="Xóa bài đọc"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                          </button>
                          <button className="text-gray-400 p-1 shrink-0">
                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                          </button>
                        </div>
                        
                        {/* Body */}
                        {isExpanded && (
                          <div className="p-4 pt-0 border-t border-gray-100 dark:border-night-border mt-2">
                            <div className="mb-4 pt-4">
                              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Tiêu đề / Chỉ dẫn</label>
                              <input 
                                type="text"
                                className="w-full p-2.5 border-2 border-gray-200 dark:border-night-border rounded-lg focus:border-cam outline-none transition-colors text-sm bg-white dark:bg-night-elevated"
                                value={g.groupTitle}
                                onChange={(e) => {
                                  setQuestionGroups(prev => prev.map(pg => pg.id === g.id ? { ...pg, groupTitle: e.target.value } : pg));
                                }}
                                placeholder="Ví dụ: Read the following passage and mark the letter..."
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Đoạn văn bản</label>
                              <TipTapEditor
                                value={g.passageText}
                                onChange={(val) => {
                                  setQuestionGroups(prev => prev.map(pg => pg.id === g.id ? { ...pg, passageText: val } : pg));
                                }}
                                minHeight="150px"
                                placeholder="Nhập nội dung bài đọc..."
                              />
                            </div>
                            <div className="mt-4">
                              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">File nghe riêng cho part này (nếu có)</label>
                              {g.audioUrl ? (
                                <div className="flex items-center gap-3 p-2.5 border-2 border-gray-200 dark:border-night-border rounded-lg bg-gray-50 dark:bg-night-surface">
                                  <audio controls src={g.audioUrl} className="h-9 flex-1" />
                                  <button
                                    type="button"
                                    onClick={() => setQuestionGroups(prev => prev.map(pg => pg.id === g.id ? { ...pg, audioUrl: undefined } : pg))}
                                    className="text-red-400 hover:text-red-500 p-1.5 shrink-0"
                                    title="Xóa file nghe"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              ) : (
                                <label className="flex items-center justify-center gap-2 p-2.5 border-2 border-dashed border-gray-200 dark:border-night-border rounded-lg cursor-pointer hover:border-cam text-sm text-gray-500 dark:text-gray-400 transition-colors">
                                  {groupAudioUploading[g.id] ? (
                                    <><Loader2 size={16} className="animate-spin" /> Đang tải lên...</>
                                  ) : (
                                    <><Upload size={16} /> Chọn file audio (mp3, wav...)</>
                                  )}
                                  <input
                                    type="file"
                                    accept="audio/*"
                                    className="hidden"
                                    disabled={groupAudioUploading[g.id]}
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      setGroupAudioUploading(prev => ({ ...prev, [g.id]: true }));
                                      try {
                                        const uploadRes = await mediaApi.uploadFile(file, 'exams');
                                        setQuestionGroups(prev => prev.map(pg => pg.id === g.id ? { ...pg, audioUrl: uploadRes.url } : pg));
                                      } catch (err) {
                                        toast.error('Không tải lên được file audio. Thử lại nhé.');
                                      } finally {
                                        setGroupAudioUploading(prev => ({ ...prev, [g.id]: false }));
                                        e.target.value = '';
                                      }
                                    }}
                                  />
                                </label>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 border-2 border-dashed border-gray-200 dark:border-night-border rounded-xl bg-gray-50/50 dark:bg-night-surface">
                  <p className="text-gray-400 text-sm">Chưa có bài đọc nào. Thêm bài đọc nếu đề thi của bạn có phần đọc hiểu.</p>
                </div>
              )}
            </section>
          )}

          {/* Danh sách câu hỏi (Accordion UI) hoặc Editor PDF */}
          {currentExamStep === 2 && (examType === 'ANSWER_SHEET' ? (
            <div className="bg-white dark:bg-night-surface rounded-2xl shadow-sm border border-gray-100 dark:border-night-border overflow-hidden h-[800px] flex flex-col">
              <ExamPdfEditor
                pdfUrl={pdfUrl}
                setPdfUrl={setPdfUrl}
                setPdfFile={setPdfFile}
                audioUrl={audioUrl}
                setAudioUrl={setAudioUrl}
                setAudioFile={setAudioFile}
                audioTracks={audioTracks}
                setAudioTracks={setAudioTracks}
                sheetItems={sheetItems}
                setSheetItems={setSheetItems}
              />
            </div>
          ) : (
            <div className="flex flex-col xl:flex-row items-start gap-6">
              <aside className="w-full xl:w-72 2xl:w-80 bg-white dark:bg-night-surface rounded-2xl shadow-sm border border-gray-100 dark:border-night-border flex flex-col shrink-0 sticky top-20">
                <div className="p-4 border-b border-gray-100 dark:border-night-border bg-kem/30 dark:bg-night-elevated rounded-t-2xl flex justify-between items-center">
                  <div>
                    <h2 className="font-bold text-base text-vutru dark:text-night-text font-heading">Cấu trúc đề thi</h2>
                    <span className="text-[11px] text-vutruNhat dark:text-night-muted">
                      {questions.length} câu • <strong className="text-cam font-bold">{totalExamPoints}</strong> điểm
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDistributeModalOpen(true)}
                    disabled={questions.length === 0}
                    className="p-1.5 rounded-lg bg-white dark:bg-night-surface border border-gray-200 dark:border-night-border text-cam hover:bg-cam hover:text-white transition-all shadow-2xs disabled:opacity-50"
                    title="Chia đều thang điểm"
                  >
                    <Calculator size={15} />
                  </button>
                </div>

                {/* Danh sách mục lục câu hỏi */}
                <div id="sidebar-scroll-container" className="overflow-y-auto p-4 space-y-2 max-h-[400px] custom-scrollbar relative">
                  {questions.map((q, i) => {
                    const isActive = activeQuestionId === q.id;
                    return (
                      <button
                        key={q.id}
                        id={`sidebar-btn-${q.id}`}
                        onClick={() => {
                          setExpandedQuestionIds(prev => ({ ...prev, [q.id]: true }));
                          const el = document.getElementById(`question-${q.id}`);
                          if (el) {
                            const offset = 100; // Header offset
                            const bodyRect = document.body.getBoundingClientRect().top;
                            const elementRect = el.getBoundingClientRect().top;
                            const elementPosition = elementRect - bodyRect;
                            const offsetPosition = elementPosition - offset;
                            window.scrollTo({
                              top: offsetPosition,
                              behavior: 'smooth'
                            });
                          }
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-all flex justify-between items-center ${
                          isActive
                            ? 'bg-cam/10 text-camDam border-2 border-cam/30 shadow-sm' 
                            : 'bg-transparent text-vutruNhat dark:text-night-muted border-2 border-transparent hover:bg-gray-50 dark:hover:bg-night-elevated'
                        }`}
                      >
                        <span>Câu {i + 1}</span>
                        {q.options.length < 2 && <span className="text-[10px] bg-red-100 text-red-500 px-1.5 py-0.5 rounded-full" title="Chưa đủ đáp án">!</span>}
                      </button>
                    );
                  })}
                  
                  <button 
                    onClick={handleAddQuestion}
                    className="w-full mt-2 border-2 border-dashed border-gray-300 dark:border-night-border text-gray-500 dark:text-night-muted hover:text-camDam hover:border-cam/50 font-bold py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-1"
                  >
                    + Thêm câu hỏi
                  </button>
                </div>

                {/* Import đề thi */}
                <div className="p-4 border-t border-gray-100 dark:border-night-border bg-gray-50 dark:bg-night-elevated rounded-b-2xl">
                  <p className="text-xs font-bold text-vutruNhat dark:text-night-muted uppercase tracking-wide mb-2">Import đề thi</p>
                  <input
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    ref={structureInputRef}
                    onChange={(e) => handleImportFile(e, 'structure')}
                  />
                  <button
                    type="button"
                    onClick={() => structureInputRef.current?.click()}
                    disabled={importing || loading}
                    className="w-full bg-white dark:bg-night-surface border border-gray-200 dark:border-night-border text-vutru dark:text-night-text font-bold py-2.5 rounded-xl shadow-sm hover:shadow hover:border-cam/40 text-sm flex flex-col items-center gap-0.5 transition-all disabled:opacity-50"
                  >
                    {importing && importMode === 'structure' ? (
                      <span className="flex items-center gap-1"><Loader2 size={16} className="animate-spin" /> Đang xử lý...</span>
                    ) : (
                      <>
                        <span className="flex items-center gap-2">
                          <span className="text-base">📋</span>
                          Export từ PDF/DOCX
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </aside>

              {/* Main Question Editor Content Area */}
              <div className="flex-1 min-w-0 space-y-4">
                <div className="flex flex-wrap justify-between items-center bg-white dark:bg-night-surface p-4 rounded-2xl border border-gray-100 dark:border-night-border shadow-sm gap-3">
                  <div className="flex items-center gap-3">
                    <h2 className="text-base sm:text-lg font-bold text-vutru dark:text-night-text font-heading">Nội dung câu hỏi ({questions.length})</h2>
                    <span className="px-2.5 py-1 rounded-xl bg-gray-100 dark:bg-night-elevated text-vutru dark:text-night-text font-bold text-xs border border-gray-200 dark:border-night-border flex items-center gap-1.5 shadow-2xs">
                      <span className="text-vutruNhat dark:text-night-muted">Tổng:</span>
                      <strong className="text-cam font-bold text-sm">{totalExamPoints}</strong>
                      <span className="text-vutruNhat dark:text-night-muted">điểm</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsDistributeModalOpen(true)}
                      disabled={questions.length === 0}
                      className="px-3 py-1.5 bg-gray-50 hover:bg-cam/10 hover:text-cam dark:bg-night-elevated text-vutruNhat dark:text-night-muted hover:border-cam/40 border border-gray-200 dark:border-night-border font-bold rounded-xl shadow-2xs transition-all flex items-center gap-1.5 text-xs disabled:opacity-50"
                      title="Tự động chia đều thang điểm cho tất cả câu hỏi"
                    >
                      <Calculator size={14} className="text-cam" />
                      <span>Chia đều điểm</span>
                    </button>

                    <button 
                      type="button"
                      onClick={handleAddQuestion}
                      className="px-3.5 py-1.5 bg-cam text-white font-bold rounded-xl shadow hover:bg-camDam transition-all flex items-center gap-1.5 text-xs active:scale-95"
                    >
                      <span>+ Thêm câu hỏi</span>
                    </button>
                  </div>
                </div>

                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="questions-list">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                      {questions.map((q, index) => {
                        const isActive = !!expandedQuestionIds[q.id];
                        
                        // Trích xuất văn bản thô từ HTML content (để làm bản xem trước ở chế độ thu gọn)
                        const plainTextContent = q.content.replace(/<[^>]+>/g, '').trim();
                        const previewText = plainTextContent ? (plainTextContent.length > 60 ? plainTextContent.substring(0, 60) + '...' : plainTextContent) : 'Chưa nhập nội dung...';

                        return (
                          <Draggable key={q.id} draggableId={q.id} index={index}>
                            {(provided) => (
                              <div 
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                id={`question-${q.id}`}
                                className={`bg-white dark:bg-night-surface rounded-2xl shadow-sm border transition-all duration-300 overflow-hidden ${
                                  isActive ? 'border-cam ring-4 ring-cam/10' : 'border-gray-200 dark:border-night-border hover:border-gray-300 dark:hover:border-night-border'
                                }`}
                              >
                                
                                {/* ACCORDION HEADER (Bấm vào để mở/thu gọn) */}
                                <div 
                                  className={`flex justify-between items-center p-4 transition-colors cursor-pointer ${isActive ? 'bg-cam/5 border-b border-cam/20' : 'hover:bg-gray-50 dark:hover:bg-night-elevated'}`}
                                  onClick={() => toggleQuestionExpanded(q.id)}
                                >
                                  <div className="flex items-center gap-3 overflow-hidden">
                                    <div {...provided.dragHandleProps} className="text-gray-400 cursor-grab hover:text-gray-600 active:cursor-grabbing">
                                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                                    </div>
                                    <div className={`font-extrabold px-3 py-1 rounded-lg shrink-0 cursor-pointer ${isActive ? 'bg-cam text-white shadow-sm shadow-cam/30' : 'bg-gray-100 dark:bg-night-elevated text-vutruNhat dark:text-night-muted'}`}>
                                      Câu {index + 1}
                                    </div>
                                    {/* Badge loại câu hỏi */}
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${getQuestionTypeBadge(q.questionType).className}`}>
                                      {getQuestionTypeBadge(q.questionType).label}
                                    </span>
                                    
                                    {/* Tiêu đề xem trước khi thu gọn */}
                                    {!isActive && (
                                      <div className="text-sm font-medium text-gray-500 truncate max-w-sm cursor-pointer">
                                        {previewText}
                                      </div>
                                    )}
                                  </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold text-vutruNhat dark:text-night-muted bg-gray-100 dark:bg-night-elevated px-2 py-1 rounded-md">{q.points} Điểm</span>
                      
                      <button
                        type="button"
                        onClick={(e) => handleDuplicateQuestion(q.id, e)}
                        className="text-vutruNhat hover:text-cam dark:text-night-muted dark:hover:text-cam p-1.5 hover:bg-gray-100 dark:hover:bg-night-elevated rounded-lg transition-colors"
                        title="Nhân bản câu hỏi này"
                      >
                        <Copy size={16} />
                      </button>

                      <button 
                        type="button"
                        onClick={(e) => handleRemoveQuestion(q.id, e)}
                        className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                        title="Xóa câu hỏi"
                      >
                        <Trash2 size={16} />
                      </button>

                      {/* Icon Mũi tên */}
                      <svg className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isActive ? 'rotate-180 text-cam' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>

                  {/* ACCORDION BODY (Chỉ hiển thị khi isActive) */}
                  {isActive && (
                    <div className="p-5 animate-fade-in">
                      
                      {/* Cài đặt riêng cho câu hỏi */}
                      <div className="flex justify-end mb-4 gap-3">
                        <div className="flex flex-wrap items-center gap-2 bg-gray-50 dark:bg-night-elevated px-3 py-1.5 rounded-lg border border-gray-200 dark:border-night-border">
                          <label className="text-xs font-bold text-vutruNhat dark:text-night-muted">Loại câu:</label>
                          <Select
                            value={
                              availableQuestionTypes.some((t) => t.value === (q.questionType || 'MULTIPLE_CHOICE'))
                                ? (q.questionType || 'MULTIPLE_CHOICE')
                                : 'MULTIPLE_CHOICE'
                            }
                            onChange={(v) => applyQuestionType(q.id, v)}
                            options={availableQuestionTypes}
                            className="bg-white dark:bg-night-surface border border-gray-300 dark:border-night-border rounded text-sm font-semibold focus:outline-none focus:border-cam py-1 px-2"
                          />
                        </div>
                        {questionGroups.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2 bg-gray-50 dark:bg-night-elevated px-3 py-1.5 rounded-lg border border-gray-200 dark:border-night-border max-w-[200px]">
                            <label className="text-xs font-bold text-vutruNhat dark:text-night-muted whitespace-nowrap">Bài đọc:</label>
                            <Select
                              value={q.groupId || ''}
                              onChange={(v) => handleQuestionChange(q.id, 'groupId', v || undefined)}
                              options={[
                                { value: '', label: '-- Độc lập --' },
                                ...questionGroups.map((g, i) => ({ value: g.id, label: g.groupTitle || `Đoạn đọc ${i + 1}` })),
                              ]}
                              className="bg-white flex-1 min-w-0 truncate dark:bg-night-surface border border-gray-300 dark:border-night-border rounded text-sm font-semibold focus:outline-none focus:border-cam py-1 px-2"
                            />
                          </div>
                        )}
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-night-elevated px-3 py-1.5 rounded-lg border border-gray-200 dark:border-night-border">
                          <label className="text-xs font-bold text-vutruNhat dark:text-night-muted">Thang điểm:</label>
                          <input 
                            type="number" 
                            step="0.5"
                            value={q.points}
                            onChange={e => handleQuestionChange(q.id, 'points', parseFloat(e.target.value))}
                            className="w-16 p-1 bg-white dark:bg-night-surface border border-gray-300 dark:border-night-border rounded text-center text-sm font-semibold focus:outline-none focus:border-cam"
                          />
                        </div>
                      </div>

                      {/* Trình soạn thảo câu hỏi */}
                      <div className="mb-6">
                        <TipTapEditor 
                          value={q.content} 
                          onChange={(html) => handleQuestionChange(q.id, 'content', html)} 
                          minHeight="120px"
                          placeholder="Nhập nội dung câu hỏi (hỗ trợ văn bản, in đậm, hình ảnh...)"
                        />
                      </div>

                      {/* Tự luận - info box */}
                      {q.questionType === 'ESSAY' && (
                        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-xl p-4 text-sm text-purple-700 dark:text-purple-300">
                          <div className="flex items-start gap-2">
                            <svg className="w-5 h-5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <p><strong>Câu tự luận:</strong> Học sinh sẽ tự nhập câu trả lời văn bản khi làm bài. Giáo viên chấm điểm thủ công sau khi học sinh nộp bài.</p>
                          </div>
                        </div>
                      )}

                      {/* Đúng / Sai — dạng ý a/b/c/d như đề Lý/Hóa */}
                      {q.questionType === 'TRUE_FALSE' && (
                        <div className="bg-blue-50/40 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl p-5">
                          <div className="flex justify-between items-center mb-3 gap-3">
                            <div>
                              <h4 className="font-bold text-gray-700 dark:text-gray-300 text-sm">Các ý Đúng / Sai</h4>
                              <p className="text-xs text-gray-500 mt-0.5">Mỗi ý a), b), c), d) chọn Đúng hoặc Sai — giống cấu trúc đề kiểm tra định kỳ.</p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setQuestions((prev) =>
                                  prev.map((item) =>
                                    item.id === q.id
                                      ? {
                                          ...item,
                                          options: [
                                            ...item.options,
                                            {
                                              id: `${Date.now()}-${item.options.length}`,
                                              content: '',
                                              isCorrect: true,
                                            },
                                          ],
                                        }
                                      : item,
                                  ),
                                )
                              }
                              className="text-xs font-bold text-camDam hover:underline shrink-0"
                            >
                              + Thêm ý
                            </button>
                          </div>
                          <div className="space-y-3">
                            {q.options.map((opt, oIndex) => (
                              <div
                                key={opt.id}
                                className="bg-white dark:bg-night-surface border border-gray-200 dark:border-night-border rounded-xl p-3"
                              >
                                <div className="flex items-center justify-between gap-2 mb-2">
                                  <span className="text-sm font-extrabold text-vutru w-8">
                                    {getStatementLabel(oIndex)})
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleSetStatementCorrect(q.id, opt.id, true)}
                                      className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
                                        opt.isCorrect
                                          ? 'bg-green-500 border-green-500 text-white'
                                          : 'bg-white dark:bg-night-elevated border-gray-200 text-gray-500'
                                      }`}
                                    >
                                      Đúng
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSetStatementCorrect(q.id, opt.id, false)}
                                      className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
                                        !opt.isCorrect
                                          ? 'bg-red-500 border-red-500 text-white'
                                          : 'bg-white dark:bg-night-elevated border-gray-200 text-gray-500'
                                      }`}
                                    >
                                      Sai
                                    </button>
                                    {q.options.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveOption(q.id, opt.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-500"
                                        title="Xóa ý này"
                                      >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <TipTapEditor
                                  value={opt.content}
                                  onChange={(html) => handleOptionChange(q.id, opt.id, html)}
                                  minHeight="56px"
                                  placeholder={`Nội dung ý ${getStatementLabel(oIndex)})...`}
                                />
                              </div>
                            ))}
                          </div>

                          {/* Cấu hình chấm điểm Đúng/Sai */}
                          <div className="mt-4 border-t border-blue-100 dark:border-blue-800 pt-4">
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <span className="text-xs font-bold text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                                <Scale size={14} aria-hidden="true" />
                                <span>Cách tính điểm khi sai ý:</span>
                              </span>
                              {/* Preset buttons */}
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => updateQuestion(q.id, { scoringConfig: getDefaultTfScoringConfig(q.options.length) })}
                                  className="text-[11px] px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 font-bold hover:bg-blue-100 transition-colors"
                                  title="Áp dụng thang điểm chuẩn của Bộ GD&ĐT: Sai 1 ý=50%, Sai 2 ý=25%, Sai 3 ý=10%, Sai ≥4 ý=0"
                                >
                                  Chuẩn BGDĐT
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateQuestion(q.id, { scoringConfig: { type: 'ALL_OR_NOTHING' } })}
                                  className="text-[11px] px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-night-elevated border border-gray-200 dark:border-night-border text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-100 transition-colors"
                                >
                                  Tất cả hoặc không
                                </button>
                              </div>
                            </div>

                            {/* Scoring type toggle */}
                            <div className="flex flex-wrap gap-2 mb-3">
                              {[
                                { label: 'Đúng hết mới tính điểm', value: 'ALL_OR_NOTHING' },
                                { label: 'Tính điểm theo từng ý sai', value: 'PARTIAL' },
                              ].map((opt) => {
                                const current = q.scoringConfig?.type ?? 'PARTIAL';
                                return (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() =>
                                      updateQuestion(q.id, {
                                        scoringConfig:
                                          opt.value === 'ALL_OR_NOTHING'
                                            ? { type: 'ALL_OR_NOTHING' }
                                            : getDefaultTfScoringConfig(q.options.length),
                                      })
                                    }
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                                      current === opt.value
                                        ? 'bg-blue-600 border-blue-600 text-white'
                                        : 'bg-white dark:bg-night-elevated border-blue-200 dark:border-blue-700 text-gray-600 dark:text-gray-400 hover:border-blue-400'
                                    }`}
                                  >
                                    {opt.label}
                                  </button>
                                );
                              })}
                            </div>

                            {/* PARTIAL: bảng điểm trực quan */}
                            {(q.scoringConfig?.type === 'PARTIAL' || !q.scoringConfig) && (() => {
                              const sc = (q.scoringConfig ?? getDefaultTfScoringConfig(q.options.length)) as { type: 'PARTIAL'; thresholds: { wrongCount: number; ratio: number }[] };
                              if (sc.type !== 'PARTIAL') return null;

                              return (
                                <div className="bg-white dark:bg-night-surface border border-blue-100 dark:border-blue-800 rounded-xl overflow-hidden">
                                  {/* Header row */}
                                  <div className="grid grid-cols-3 gap-0 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 border-b border-blue-100 dark:border-blue-800">
                                    <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300">Số ý sai</span>
                                    <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 text-center">% Điểm</span>
                                    <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 text-right">Điểm thực tế ({q.points}đ)</span>
                                  </div>
                                  <div className="divide-y divide-blue-50 dark:divide-blue-900/20">
                                    {/* Row sai 0 ý */}
                                    <div className="grid grid-cols-3 items-center px-4 py-2 bg-green-50/50 dark:bg-green-900/10">
                                      <span className="text-xs font-bold text-green-700 dark:text-green-400">0 ý sai ✓</span>
                                      <span className="text-xs font-bold text-green-600 dark:text-green-400 text-center">100%</span>
                                      <span className="text-xs font-bold text-green-600 dark:text-green-400 text-right">{q.points}đ</span>
                                    </div>
                                    {sc.thresholds.map((t, ti) => (
                                      <div key={ti} className="grid grid-cols-3 items-center px-4 py-2.5 gap-2">
                                        <span className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Sai {t.wrongCount} ý</span>
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="range"
                                            min={0}
                                            max={100}
                                            step={5}
                                            value={Math.round(t.ratio * 100)}
                                            onChange={(e) => {
                                              const newRatio = Number(e.target.value) / 100;
                                              updateQuestion(q.id, {
                                                scoringConfig: {
                                                  ...sc,
                                                  thresholds: sc.thresholds.map((th, idx) =>
                                                    idx === ti ? { ...th, ratio: newRatio } : th
                                                  ),
                                                },
                                              });
                                            }}
                                            className="flex-1 accent-blue-600 h-1.5"
                                          />
                                          <span className={`text-xs font-bold w-9 text-center ${t.ratio === 0 ? 'text-red-500' : 'text-blue-600'}`}>
                                            {Math.round(t.ratio * 100)}%
                                          </span>
                                        </div>
                                        <span className={`text-xs font-bold text-right ${t.ratio === 0 ? 'text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                          {t.ratio === 0 ? '0đ' : `${(q.points * t.ratio).toFixed(2).replace(/\.?0+$/, '')}đ`}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="px-4 py-2 bg-gray-50 dark:bg-night-elevated border-t border-blue-50 dark:border-blue-900/20 flex items-center gap-1.5">
                                    <Info size={12} className="text-gray-400 shrink-0" aria-hidden="true" />
                                    <p className="text-[10px] text-gray-400">Kéo thanh trượt để điều chỉnh. Preset "Chuẩn BGDĐT": Sai 1=50% · Sai 2=25% · Sai 3=10% · Sai ≥4=0</p>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Trả lời ngắn */}
                      {q.questionType === 'SHORT_ANSWER' && (
                        <div className="bg-teal-50/50 dark:bg-teal-900/10 border border-teal-100 dark:border-teal-800 rounded-xl p-5">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-bold text-gray-700 dark:text-gray-300 text-sm">Đáp án đúng (trả lời ngắn)</h4>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setQuestions((prev) => prev.map((item) => {
                                        if (item.id !== q.id) return item;
                                        return {
                                            ...item,
                                            options: [...item.options, { id: `${Date.now()}-${Math.random()}`, content: '', isCorrect: true }]
                                        };
                                    }));
                                }}
                                className="flex items-center gap-1 px-3 py-1 bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 text-xs font-bold rounded-lg hover:bg-teal-200 transition-colors"
                            >
                                + Thêm đáp án
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mb-3">Học sinh điền đáp án ngắn (số hoặc cụm từ). Hệ thống chấm khớp đáp án (không phân biệt hoa thường). Có thể thêm nhiều đáp án đúng (VD: 0.5 và 0,5).</p>
                          <div className="flex flex-col gap-2">
                              {q.options.map((opt, idx) => (
                                  <div key={opt.id} className="flex gap-2 items-center">
                                      <input
                                          type="text"
                                          value={(opt.content || '').replace(/<[^>]+>/g, '')}
                                          onChange={(e) => {
                                              const value = e.target.value;
                                              setQuestions((prev) =>
                                              prev.map((item) =>
                                                  item.id === q.id
                                                  ? {
                                                      ...item,
                                                      options: item.options.map(o => o.id === opt.id ? { ...o, content: value } : o),
                                                      }
                                                  : item,
                                              ),
                                              );
                                          }}
                                          placeholder={`Cách ${idx + 1} (VD: 15 hoặc 0,5)`}
                                          className="flex-1 p-3 border-2 border-gray-200 dark:border-night-border rounded-xl focus:border-cam outline-none bg-white dark:bg-night-surface font-semibold"
                                      />
                                      {q.options.length > 1 && (
                                          <button
                                              onClick={(e) => {
                                                  e.stopPropagation();
                                                  setQuestions((prev) => prev.map((item) => {
                                                      if (item.id !== q.id) return item;
                                                      return {
                                                          ...item,
                                                          options: item.options.filter(o => o.id !== opt.id)
                                                      };
                                                  }));
                                              }}
                                              className="p-3 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                                              title="Xóa đáp án này"
                                          >
                                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                              </svg>
                                          </button>
                                      )}
                                  </div>
                              ))}
                              {q.options.length === 0 && (
                                  <button
                                      onClick={(e) => {
                                          e.stopPropagation();
                                          setQuestions((prev) => prev.map((item) => {
                                              if (item.id !== q.id) return item;
                                              return {
                                                  ...item,
                                                  options: [{ id: `${Date.now()}`, content: '', isCorrect: true }]
                                              };
                                          }));
                                      }}
                                      className="w-full py-3 border-2 border-dashed border-teal-200 text-teal-600 rounded-xl hover:bg-teal-50"
                                  >
                                      + Thêm đáp án đầu tiên
                                  </button>
                              )}
                          </div>
                        </div>
                      )}

                      {/* Trắc nghiệm - Dynamic Options */}
                      {(q.questionType === 'MULTIPLE_CHOICE' || !q.questionType) && (
                        <div className="bg-kem/40 dark:bg-night-elevated p-5 rounded-xl border border-gray-100 dark:border-night-border">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold text-gray-700 dark:text-gray-300 text-sm">Các đáp án trắc nghiệm:</h4>
                            <span className="text-xs text-gray-500 font-medium">Chỉ chọn 1 đáp án đúng</span>
                          </div>

                          {q.options.length === 0 ? (
                            <div className="text-center py-6 bg-white dark:bg-night-surface border border-dashed border-gray-300 dark:border-night-border rounded-xl mb-4">
                              <p className="text-gray-400 text-sm font-medium mb-2">Chưa có đáp án nào. Thêm ít nhất 2 đáp án.</p>
                            </div>
                          ) : (
                            <div className="space-y-3 mb-4" role="radiogroup" aria-label={`Đáp án đúng câu ${index + 1}`}>
                              {q.options.map((opt, oIndex) => (
                                <div
                                  key={opt.id}
                                  className={`flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-night-surface border-2 transition-all ${opt.isCorrect ? 'border-green-500 shadow-sm shadow-green-100 dark:shadow-green-900/20' : 'border-gray-200 dark:border-night-border hover:border-gray-300 dark:hover:border-night-border'}`}
                                >
                                  
                                  {/* Radio chọn đáp án đúng — exclusive single choice */}
                                  <div className="pt-2 flex flex-col items-center gap-1">
                                    <input 
                                      type="radio" 
                                      name={`correct-${q.id}`}
                                      className="w-5 h-5 accent-green-600 cursor-pointer"
                                      checked={!!opt.isCorrect}
                                      onChange={() => handleSetCorrect(q.id, opt.id)}
                                      onClick={() => handleSetCorrect(q.id, opt.id)}
                                      aria-label={`Chọn đáp án ${getAlphabetLabel(oIndex)} làm đáp án đúng`}
                                    />
                                    {opt.isCorrect && (
                                      <span className="text-[10px] font-bold text-green-600 whitespace-nowrap">Đúng</span>
                                    )}
                                  </div>
                                  
                                  {/* Nhãn A, B, C — bấm để chọn đáp án đúng */}
                                  <button
                                    type="button"
                                    onClick={() => handleSetCorrect(q.id, opt.id)}
                                    className={`font-extrabold pt-1.5 w-6 shrink-0 text-left ${opt.isCorrect ? 'text-green-600' : 'text-gray-400'}`}
                                    title="Chọn làm đáp án đúng"
                                  >
                                    {getAlphabetLabel(oIndex)}.
                                  </button>
                                  
                                  {/* Trình soạn thảo Option */}
                                  <div className="flex-1" onClick={(e) => e.stopPropagation()}>
                                    <TipTapEditor 
                                      value={opt.content} 
                                      onChange={(html) => handleOptionChange(q.id, opt.id, html)} 
                                      minHeight="60px"
                                      placeholder={`Nội dung đáp án ${getAlphabetLabel(oIndex)}...`}
                                    />
                                  </div>

                                  {/* Nút xóa đáp án */}
                                  <button
                                    onClick={() => handleRemoveOption(q.id, opt.id)}
                                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors pt-2"
                                    title="Xóa đáp án này"
                                  >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Nút thêm đáp án */}
                          <button 
                            onClick={() => handleAddOption(q.id)}
                            className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-white dark:bg-night-surface border-2 border-dashed border-gray-300 dark:border-night-border rounded-xl text-gray-500 dark:text-night-muted font-bold text-sm hover:border-cam/50 hover:text-camDam transition-colors"
                          >
                            <span>+ Thêm đáp án {getAlphabetLabel(q.options.length)}</span>
                          </button>
                        </div>
                      )}

                      {/* Giai thich dap an chi tiet - hoc sinh se thay o man hinh xem lai bai sau khi nop */}
                      <div className="mt-5 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800 rounded-xl p-5">
                        <h4 className="font-bold text-gray-700 dark:text-gray-300 text-sm mb-1">Giải thích đáp án chi tiết (không bắt buộc)</h4>
                        <p className="text-xs text-gray-500 mb-3">Hiển thị cho học sinh khi xem lại bài thi sau khi nộp, giúp học sinh hiểu vì sao đáp án này đúng.</p>
                        <TipTapEditor
                          value={q.explanation || ''}
                          onChange={(html) => handleQuestionChange(q.id, 'explanation', html)}
                          minHeight="80px"
                          placeholder="Nhập giải thích chi tiết cho đáp án đúng..."
                        />
                      </div>

                    </div>
                  )}
                </div>
              )}
            </Draggable>
          );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          </div>
        ))}
          {currentExamStep === 2 && examType !== 'ANSWER_SHEET' && (
            <div className="mt-8 text-center text-gray-400 text-sm">
              <p>Mẹo: Bạn có thể chọn câu hỏi từ danh sách bên trái để mở nhanh.</p>
            </div>
          )}



          {/* Footer Navigation */}
          <div className="bg-white dark:bg-night-surface rounded-2xl border border-gray-100 dark:border-night-border shadow-sm px-4 sm:px-8 py-4 mt-6">
            <StepperFooter
              currentStep={currentExamStep}
              totalSteps={EXAM_STEPS.length}
              onBack={() => setCurrentExamStep(s => Math.max(0, s - 1))}
              onNext={() => setCurrentExamStep(s => Math.min(EXAM_STEPS.length - 1, s + 1))}
              onFinish={() => handleExamFinish(true)}
              onSecondaryFinish={() => handleExamFinish(false)}
              secondaryFinishLabel="Lưu nháp"
              isSubmitting={loading}
              finishLabel={id ? (exam.isPublished ? 'Lưu thay đổi' : 'Lưu & Xuất bản') : 'Xuất bản ngay'}
              leftSlot={<AutoSaveBadge />}
            />
          </div>
      </main>

      {importPreview && (
        <ExamImportAzotaModal
          isOpen={!!importPreview}
          onClose={() => {
            if (importPreview.fileUrl) URL.revokeObjectURL(importPreview.fileUrl);
            setImportPreview(null);
          }}
          onConfirm={confirmImport}
          questions={importPreview.questions}
          passages={importPreview.passages}
          fileUrl={importPreview.fileUrl}
          fileName={importPreview.meta?.fileName as string}
          meta={importPreview.meta as any}
        />
      )}

      {showPreviewModal && (
        <ExamPreviewModal
          questions={examType === 'ANSWER_SHEET' ? (sheetItemsToQuestions(sheetItems) as any) : questions}
          questionGroups={questionGroups}
          examData={{ ...exam, examType, pdfUrl, audioUrl, audioTracks }}
          onClose={() => setShowPreviewModal(false)}
          onUpdateQuestion={updateQuestion}
          onUpdatePassage={updateQuestionGroup}
        />
      )}

      <DistributePointsModal
        isOpen={isDistributeModalOpen}
        onClose={() => setIsDistributeModalOpen(false)}
        questions={questions}
        onApply={handleApplyDistributedPoints}
        defaultTotalPoints={10}
      />
    </div>
  );
};

export default CreateExam;
