import { getApiErrorMessage } from '../../services/api';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { flashcardApi } from '../../services/flashcardApi';
import { folderApi } from '../../services/folderApi';
import { mediaApi } from '../../services/mediaApi';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import BackButton from '../../components/ui/BackButton';
import Stepper, { StepConfig, StepState } from '../../components/ui/Stepper';
import StepperFooter from '../../components/ui/StepperFooter';
import useAutoSave, { AutoSaveStatus } from '../../hooks/useAutoSave';
import {
  ArrowLeft, Plus, Trash2, Image as ImageIcon, Sparkles, Loader2,
  Upload, AlertTriangle, Info, Globe, EyeOff, Users as UsersIcon,
  KeyRound, Lock, CheckCircle2, CloudOff, Copy, LayoutList, LayoutGrid
} from 'lucide-react';
import axios from 'axios';
import ClassroomSelector from '../../components/common/ClassroomSelector';
import classService, { Classroom, ClassFolder } from '../../services/class.service';

// ─── Types ────────────────────────────────────────────────────────────────────

interface VocabDraft {
  id: string;
  wordType: string;
  frontContent: string;
  backContent: string;
  definitionEn: string;
  definitionVi: string;
  example: string;
  imageUrl: string;
  phonetic: string;
  exampleTranslation: string;
}

type StepErrors = Record<number, string[]>;

const STEPS: StepConfig[] = [
  { id: 'basic', title: 'Thông tin cơ bản', subtitle: 'Tên, mô tả, nhãn' },
  { id: 'content', title: 'Nội dung từ vựng', subtitle: 'Thêm và chỉnh sửa từ' },
  { id: 'settings', title: 'Cài đặt', subtitle: 'Quyền truy cập' },
];

const WORD_TYPES = [
  'Danh từ', 'Động từ', 'Tính từ', 'Trạng từ', 'Đại từ',
  'Giới từ', 'Liên từ', 'Thán từ', 'Cụm từ', 'Thành ngữ',
];

const SUBJECTS = ['Tiếng Anh', 'Toán', 'Vật Lý', 'Hóa Học', 'Sinh Học', 'Ngữ Văn', 'KHTN'];

const emptyVocab = (): VocabDraft => ({
  id: Date.now().toString() + Math.random(),
  wordType: '',
  frontContent: '',
  backContent: '',
  definitionEn: '',
  definitionVi: '',
  example: '',
  imageUrl: '',
  phonetic: '',
  exampleTranslation: '',
});

// ─── Validation ───────────────────────────────────────────────────────────────

function validateStep(step: number, title: string, cards: VocabDraft[]): string[] {
  if (step === 0) return title.trim() ? [] : ['Tên bộ từ vựng là bắt buộc'];
  if (step === 1) {
    const valid = cards.filter(c => c.frontContent.trim() && c.backContent.trim());
    return valid.length === 0 ? ['Bộ từ vựng cần ít nhất 1 từ có cả tiếng Anh và nghĩa tiếng Việt'] : [];
  }
  return [];
}

function validateAll(title: string, cards: VocabDraft[]): StepErrors {
  return { 0: validateStep(0, title, cards), 1: validateStep(1, title, cards), 2: [] };
}

// ─── AutoSave Badge ───────────────────────────────────────────────────────────

const SaveStatusBadge: React.FC<{ status: AutoSaveStatus; savedAt: Date | null }> = ({ status, savedAt }) => {
  if (status === 'saving') return (
    <span className="flex items-center gap-1.5 text-xs text-gray-400"><Loader2 className="w-3 h-3 animate-spin" />Đang lưu...</span>
  );
  if (status === 'saved') return (
    <span className="flex items-center gap-1.5 text-xs text-green-500">
      <CheckCircle2 className="w-3 h-3" />
      Đã lưu{savedAt ? ` lúc ${savedAt.getHours()}:${String(savedAt.getMinutes()).padStart(2, '0')}` : ''}
    </span>
  );
  if (status === 'error') return (
    <span className="flex items-center gap-1.5 text-xs text-red-500"><CloudOff className="w-3 h-3" />Lưu thất bại</span>
  );
  return null;
};

// ─── Main Component ───────────────────────────────────────────────────────────

const CreateVocab: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const folderId = searchParams.get('folderId');
  const classIdParam = searchParams.get('classId');
  const classFolderIdParam = searchParams.get('classFolderId');
  const toast = useToast();

  // ── Form State ──
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'HIDDEN' | 'CLASSROOM'>(classIdParam ? 'CLASSROOM' : 'PUBLIC');
  const [accessCode, setAccessCode] = useState('');
  const [assignedClassIds, setAssignedClassIds] = useState<string[]>(classIdParam ? [classIdParam] : []);
  const [assignedClassFolders, setAssignedClassFolders] = useState<Record<string, string>>(() => {
    if (classIdParam && classFolderIdParam) {
      return { [classIdParam]: classFolderIdParam };
    }
    return {};
  });
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [classFoldersMap, setClassFoldersMap] = useState<Record<string, ClassFolder[]>>({});
  const [subject, setSubject] = useState('');
  const [cards, setCards] = useState<VocabDraft[]>([emptyVocab()]);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fetching, setFetching] = useState(!!id);
  const [error, setError] = useState('');

  // ── Stepper State ──
  const [currentStep, setCurrentStep] = useState(0);
  const [stepErrors, setStepErrors] = useState<StepErrors>({ 0: [], 1: [], 2: [] });
  const [showValidation, setShowValidation] = useState(false);

  // ── Load classrooms ──
  useEffect(() => {
    classService.getMyClasses().then(res => {
      setClassrooms(res.content || res.data?.content || []);
    }).catch(() => {});
  }, []);

  // ── Load class folders for assigned classes ──
  useEffect(() => {
    assignedClassIds.forEach(classId => {
      if (!classFoldersMap[classId]) {
        classService.getClassFolders(classId).then(folders => {
          setClassFoldersMap(prev => ({ ...prev, [classId]: folders || [] }));
        }).catch(() => {
          setClassFoldersMap(prev => ({ ...prev, [classId]: [] }));
        });
      }
    });
  }, [assignedClassIds, classFoldersMap]);

  // ── Load existing deck ──
  useEffect(() => {
    if (id) {
      const fetchDeck = async () => {
        try {
          const res = await flashcardApi.getDeckById(id);
          const deck = res.data;
          setTitle(deck.title);
          setDescription(deck.description || '');
          setTags((deck as any).tags || '');
          setImageUrl((deck as any).imageUrl || '');
          setVisibility(deck.visibility || 'PUBLIC');
          setAccessCode((deck as any).accessCode || '');
          setSubject(deck.subject || '');
          if (deck.cards && deck.cards.length > 0) {
            setCards(deck.cards.map((c: any) => ({
              id: c.id,
              wordType: c.wordType || '',
              frontContent: c.frontContent || '',
              backContent: c.backContent || '',
              definitionEn: c.definitionEn || '',
              definitionVi: c.definitionVi || '',
              example: c.example || '',
              imageUrl: c.imageUrl || '',
              phonetic: c.phonetic || '',
              exampleTranslation: c.exampleTranslation || '',
            })));
          }
        } catch {
          setError('Không thể tải bộ từ vựng. Vui lòng thử lại.');
        } finally {
          setFetching(false);
        }
      };
      fetchDeck();
    }
  }, [id]);

  // ── Build payload (same as original) ──
  const buildPayload = useCallback(() => {
    const validCards = cards.filter(c => c.frontContent.trim() && c.backContent.trim());
    return {
      title: title.trim(),
      description: description.trim() || undefined,
      tags: tags.trim() ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
      imageUrl: imageUrl.trim() || undefined,
      visibility,
      accessCode: visibility === 'HIDDEN' ? accessCode.trim() : undefined,
      assignedClassIds: visibility === 'CLASSROOM' ? assignedClassIds : undefined,
      assignedClassFolders: visibility === 'CLASSROOM' ? assignedClassFolders : undefined,
      classFolderId: visibility === 'CLASSROOM' && classIdParam ? assignedClassFolders[classIdParam] : undefined,
      folderId: folderId || undefined,
      deckType: 'VOCABULARY' as const,
      subject: subject.trim() || undefined,
      cards: validCards.map(c => ({
        frontContent: c.frontContent.trim(),
        backContent: c.backContent.trim(),
        wordType: c.wordType.trim() || undefined,
        definitionEn: c.definitionEn.trim() || undefined,
        definitionVi: c.definitionVi.trim() || undefined,
        example: c.example.trim() || undefined,
        imageUrl: c.imageUrl.trim() || undefined,
        phonetic: c.phonetic.trim() || undefined,
        exampleTranslation: c.exampleTranslation.trim() || undefined,
      })),
    };
  }, [title, description, tags, imageUrl, visibility, accessCode, assignedClassIds, assignedClassFolders, classIdParam, folderId, subject, cards]);

  // ── Auto-save ──
  const { status: saveStatus, savedId, savedAt, setSavedId } = useAutoSave({
    data: { title, description, tags, imageUrl, visibility, accessCode, assignedClassIds, folderId, subject, cards },
    delay: 500,
    enabled: !!title.trim(),
    onSave: async (_, existingId) => {
      const payload = buildPayload();
      const effectiveId = existingId || id;
      if (effectiveId) {
        await flashcardApi.updateDeck(effectiveId, payload);
        return effectiveId;
      } else {
        const res = await flashcardApi.createDeck(payload);
        const newId = res.data.id;
        window.history.replaceState(null, '', `/vocabulary/${newId}/edit`);
        return newId;
      }
    },
  });

  useEffect(() => { if (id) setSavedId(id); }, [id, setSavedId]);

  // ── Compute Stepper states ──
  const computeStepStates = useCallback((): StepState[] => {
    return STEPS.map((_, i) => {
      if (showValidation && (stepErrors[i]?.length ?? 0) > 0) return 'error';
      if (i === currentStep) return 'active';
      if (i < currentStep) return 'completed';
      return 'pending';
    });
  }, [currentStep, stepErrors, showValidation]);

  const [isCompactView, setIsCompactView] = useState(false);

  // ── Card handlers ──
  const handleCardChange = (cardId: string, field: keyof VocabDraft, value: string) => {
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, [field]: value } : c));
  };
  const handleAddCard = () => setCards(prev => [...prev, emptyVocab()]);
  const handleDuplicateCard = (cardId: string) => {
    const target = cards.find(c => c.id === cardId);
    if (!target) return;
    const newCard: VocabDraft = {
      ...target,
      id: Date.now().toString() + Math.random(),
    };
    const idx = cards.findIndex(c => c.id === cardId);
    const updated = [...cards];
    updated.splice(idx + 1, 0, newCard);
    setCards(updated);
    toast.success('Đã nhân bản từ vựng!');
  };
  const handleRemoveCard = (cardId: string) => {
    if (cards.length <= 1) return;
    setCards(prev => prev.filter(c => c.id !== cardId));
  };

  // ── AI auto-fill ──
  const handleAutoFill = async (card: VocabDraft) => {
    if (!card.frontContent.trim()) return;
    const word = card.frontContent.trim();
    try {
      const { default: apiInst } = await import('../../services/api');
      const result = await apiInst.post('/vocabulary/ai/auto-fill', { word });
      const data = result.data;
      setCards(prev => prev.map(c => c.id === card.id ? {
        ...c,
        phonetic: data.phonetic || c.phonetic,
        definitionEn: data.definitionEn || c.definitionEn,
        definitionVi: data.definitionVi || c.definitionVi,
        example: data.example || c.example,
        exampleTranslation: data.exampleTranslation || c.exampleTranslation,
        wordType: data.wordType || c.wordType,
        backContent: data.backContent || c.backContent,
      } : c));
    } catch {
      try {
        const res = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        const data = res.data[0];
        const phonetic = data.phonetics?.find((x: any) => x.text)?.text || data.phonetic || '';
        const meaning = data.meanings?.[0];
        const def = meaning?.definitions?.[0];
        const posMap: Record<string, string> = {
          noun: 'Danh từ', verb: 'Động từ', adjective: 'Tính từ', adverb: 'Trạng từ',
          pronoun: 'Đại từ', preposition: 'Giới từ', conjunction: 'Liên từ', interjection: 'Thán từ',
        };
        setCards(prev => prev.map(c => c.id === card.id ? {
          ...c,
          phonetic: phonetic || c.phonetic,
          definitionEn: def?.definition || c.definitionEn,
          example: def?.example || c.example,
          wordType: posMap[meaning?.partOfSpeech] || c.wordType,
        } : c));
        toast.warning('AI API đang lỗi. Hệ thống đã dùng từ điển dự phòng. Bạn vui lòng tự điền nghĩa tiếng Việt nhé!');
      } catch {
        toast.warning('Không tìm thấy từ này trong từ điển. Bạn hãy tự nhập nhé!');
      }
    }
  };

  // ── Image upload ──
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const res = await mediaApi.uploadFile(file, 'uranus_lms');
      setImageUrl(res.url);
      toast.success('Tải ảnh lên thành công!');
    } catch {
      toast.error('Không thể tải ảnh lên.');
    } finally {
      setUploadingImage(false);
    }
  };

  // ── Card image upload ──
  const handleCardImageUpload = async (cardId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.warning('Kích thước ảnh tối đa là 5MB'); return; }
    try {
      setUploadingImage(true);
      const res = await mediaApi.uploadFile(file, 'uranus_lms');
      handleCardChange(cardId, 'imageUrl', res.url);
    } catch {
      toast.error('Không thể tải ảnh lên.');
    } finally {
      setUploadingImage(false);
    }
  };

  // ── Submit ──
  const handleFinish = async () => {
    const errors = validateAll(title, cards);
    setStepErrors(errors);
    setShowValidation(true);

    const hasErrors = Object.values(errors).some(e => e.length > 0);
    if (hasErrors) {
      const firstErrStep = Object.entries(errors).find(([, e]) => e.length > 0);
      if (firstErrStep) setCurrentStep(Number(firstErrStep[0]));
      return;
    }

    setLoading(true);
    try {
      const payload = buildPayload();
      const effectiveId = savedId || id;
      let res;
      if (effectiveId) {
        res = await flashcardApi.updateDeck(effectiveId, payload);
      } else {
        res = await flashcardApi.createDeck(payload);
      }
      toast.success(id ? 'Cập nhật bộ từ vựng thành công!' : 'Tạo bộ từ vựng thành công!');
      if (classIdParam) {
        navigate(`/classes/${classIdParam}/classwork`);
        return;
      }
      navigate(folderId ? `/library/folders/${folderId}` : `/vocabulary`);
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Không thể lưu bộ từ vựng. Vui lòng thử lại.'));
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="animate-spin text-cam" size={32} />
    </div>
  );

  const stepStates = computeStepStates();
  const currentErrors = showValidation ? (stepErrors[currentStep] ?? []) : [];

  return (
    <div className="min-h-screen bg-kem dark:bg-night-page animate-fade-in pb-10 -mx-3 sm:-mx-6 -my-4 sm:-my-6">
      <main className="mx-auto p-4 sm:p-6 pb-20 w-full max-w-[1400px]">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <BackButton to="/vocab" />
          <div>
            <h1 className="text-3xl font-extrabold text-vutru dark:text-white font-heading">
              {id ? 'Cập nhật bộ từ vựng' : 'Tạo bộ từ vựng mới'}
            </h1>
            <p className="text-sm text-vutruNhat mt-0.5">Theo từng bước để tạo bộ từ vựng hoàn chỉnh</p>
          </div>
        </div>

        {/* Stepper card */}
        <div className="bg-white dark:bg-night-surface rounded-2xl border border-gray-100 dark:border-night-border shadow-sm">
          {/* Stepper header */}
          <div className="px-4 sm:px-8 pt-6 pb-4 border-b border-gray-100 dark:border-night-border">
            <Stepper
              steps={STEPS}
              currentStep={currentStep}
              stepStates={stepStates}
              onStepClick={setCurrentStep}
            />
          </div>

          {/* Step content */}
          <div className="px-4 sm:px-8 py-6">
            {error && (
              <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium flex items-center justify-between gap-3">
                <span>{error}</span>
                <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 shrink-0">✕</button>
              </div>
            )}
            {currentErrors.length > 0 && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                {currentErrors.map((e, i) => (
                  <p key={i} className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5">
                    <AlertTriangle size={14} /> {e}
                  </p>
                ))}
              </div>
            )}

            {/* ── Step 0: Basic Info ── */}
            {currentStep === 0 && (
              <div className="space-y-5 animate-fade-in max-w-2xl">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-vutru dark:text-white">Tên bộ từ vựng <span className="text-red-500">*</span></label>
                  <input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="VD: TOEIC Unit 1, Động từ bất quy tắc..."
                    className="w-full text-lg font-bold text-vutru dark:text-white bg-gray-50 dark:bg-night-elevated border border-gray-200 dark:border-night-border py-2.5 px-4 rounded-xl outline-none focus:border-cam focus:ring-1 focus:ring-cam transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-vutru dark:text-white">Mô tả chi tiết</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Thêm mô tả cho bộ từ vựng..."
                    rows={3}
                    className="w-full text-sm font-medium text-vutru dark:text-white bg-gray-50 dark:bg-night-elevated border border-gray-200 dark:border-night-border py-2.5 px-4 rounded-xl outline-none focus:border-cam focus:ring-1 focus:ring-cam transition-colors resize-y"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-vutru dark:text-white">Nhãn</label>
                  <input
                    value={tags}
                    onChange={e => setTags(e.target.value)}
                    placeholder="Nhãn phân cách bằng dấu phẩy (VD: TOEIC, Grammar)"
                    className="w-full text-sm font-medium text-vutru dark:text-white bg-gray-50 dark:bg-night-elevated border border-gray-200 dark:border-night-border py-2.5 px-4 rounded-xl outline-none focus:border-cam focus:ring-1 focus:ring-cam transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-vutru dark:text-white">Môn học</label>
                  <Select
                    value={subject}
                    onChange={v => setSubject(v)}
                    className="mt-1.5 w-full sm:w-72 text-sm font-medium text-vutru dark:text-white bg-gray-50 dark:bg-night-elevated border border-gray-200 dark:border-night-border py-2.5 px-4 rounded-xl outline-none focus:border-cam"
                    options={[{ value: '', label: 'Chọn môn học' }, ...SUBJECTS.map(s => ({ value: s, label: s }))]}
                  />
                </div>
                {/* Cover image */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-gray-50 dark:bg-night-elevated border border-gray-200 dark:border-night-border">
                  <div className="flex items-center gap-4">
                    {imageUrl ? (
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                        <img src={imageUrl} alt="Cover" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setImageUrl('')}
                          className="absolute top-1 right-1 p-1 bg-white/80 rounded-full text-red-500 hover:bg-white transition-colors shadow-sm"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-white border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 shadow-sm">
                        <ImageIcon size={24} />
                      </div>
                    )}
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-bold text-vutru dark:text-white">Ảnh bìa (không bắt buộc)</span>
                      <span className="text-xs text-vutruNhat">Ảnh hiển thị trên trang danh sách từ vựng</span>
                    </div>
                  </div>
                  <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    isLoading={uploadingImage}
                    variant="outline"
                    size="sm"
                    className="bg-white dark:bg-night-elevated"
                    iconLeft={<Upload size={16} />}
                  >
                    {imageUrl ? 'Đổi ảnh' : 'Tải ảnh lên'}
                  </Button>
                </div>
              </div>
            )}

            {/* ── Step 1: Content ── */}
            {currentStep === 1 && (
              <div className="animate-fade-in space-y-6">
                {/* Header Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-night-surface rounded-2xl border border-gray-100 dark:border-night-border shadow-soft">
                  <div className="flex items-center gap-2">
                    <span className="px-3.5 py-1.5 rounded-full bg-camNhat/60 dark:bg-cam/20 text-camDam dark:text-cam font-heading font-extrabold text-xs">
                      {cards.length} từ vựng
                    </span>
                    <span className="text-xs text-vutruNhat dark:text-night-muted hidden sm:inline">
                      Mẹo: Nhấn <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-night-elevated border border-gray-200 dark:border-night-border text-[11px] font-mono font-bold">Ctrl + Enter</kbd> để thêm từ
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View mode toggle */}
                    <div className="flex items-center p-1 bg-gray-100 dark:bg-night-elevated rounded-xl border border-gray-200 dark:border-night-border">
                      <button
                        type="button"
                        onClick={() => setIsCompactView(false)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          !isCompactView
                            ? 'bg-white dark:bg-night-surface text-camDam dark:text-cam shadow-2xs'
                            : 'text-vutruNhat dark:text-night-muted hover:text-vutru'
                        }`}
                        title="Chế độ xem đầy đủ chi tiết"
                      >
                        <LayoutGrid size={14} />
                        <span className="hidden sm:inline">Chi tiết</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCompactView(true)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          isCompactView
                            ? 'bg-white dark:bg-night-surface text-camDam dark:text-cam shadow-2xs'
                            : 'text-vutruNhat dark:text-night-muted hover:text-vutru'
                        }`}
                        title="Chế độ xem bảng thu gọn"
                      >
                        <LayoutList size={14} />
                        <span className="hidden sm:inline">Thu gọn</span>
                      </button>
                    </div>

                    <Button
                      type="button"
                      onClick={handleAddCard}
                      variant="primary"
                      size="sm"
                      iconLeft={<Plus size={16} />}
                    >
                      Thêm từ
                    </Button>
                  </div>
                </div>

                {/* Compact View Table */}
                {isCompactView ? (
                  <div className="bg-white dark:bg-night-surface rounded-2xl border border-gray-100 dark:border-night-border overflow-hidden shadow-soft">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-vutru dark:text-night-text">
                        <thead className="bg-gray-50 dark:bg-night-elevated text-vutruNhat dark:text-night-muted font-bold uppercase tracking-wider border-b border-gray-100 dark:border-night-border">
                          <tr>
                            <th className="p-3 w-12 text-center">#</th>
                            <th className="p-3">Từ tiếng Anh</th>
                            <th className="p-3">Nghĩa tiếng Việt</th>
                            <th className="p-3">Loại từ</th>
                            <th className="p-3">Phiên âm</th>
                            <th className="p-3 text-right">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-night-border font-medium">
                          {cards.map((card, index) => (
                            <tr key={card.id} className="hover:bg-gray-50/80 dark:hover:bg-night-elevated/50 transition-colors">
                              <td className="p-3 text-center font-mono font-bold text-cam">{index + 1}</td>
                              <td className="p-3">
                                <input
                                  type="text"
                                  value={card.frontContent}
                                  onChange={e => handleCardChange(card.id, 'frontContent', e.target.value)}
                                  placeholder="computer..."
                                  className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-night-elevated border border-gray-200 dark:border-night-border rounded-lg outline-none focus:border-cam font-bold text-sm"
                                />
                              </td>
                              <td className="p-3">
                                <input
                                  type="text"
                                  value={card.backContent}
                                  onChange={e => handleCardChange(card.id, 'backContent', e.target.value)}
                                  placeholder="máy tính..."
                                  className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-night-elevated border border-gray-200 dark:border-night-border rounded-lg outline-none focus:border-cam text-sm"
                                />
                              </td>
                              <td className="p-3">
                                <Select
                                  value={card.wordType}
                                  onChange={v => handleCardChange(card.id, 'wordType', v)}
                                  className="w-full px-2 py-1.5 bg-gray-50 dark:bg-night-elevated border border-gray-200 dark:border-night-border rounded-lg outline-none focus:border-cam text-xs"
                                  options={[{ value: '', label: 'Loại từ' }, ...WORD_TYPES.map(t => ({ value: t, label: t }))]}
                                />
                              </td>
                              <td className="p-3">
                                <input
                                  type="text"
                                  value={card.phonetic}
                                  onChange={e => handleCardChange(card.id, 'phonetic', e.target.value)}
                                  placeholder="/kəmˈpjuː.tər/"
                                  className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-night-elevated border border-gray-200 dark:border-night-border rounded-lg outline-none focus:border-cam font-mono text-xs"
                                />
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleAutoFill(card)}
                                    className="p-1.5 text-cam hover:bg-camNhat/50 dark:hover:bg-cam/20 rounded-lg transition-colors"
                                    title="Tự động điền"
                                  >
                                    <Sparkles size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDuplicateCard(card.id)}
                                    className="p-1.5 text-vutruNhat hover:text-cam rounded-lg hover:bg-gray-200 dark:hover:bg-night-border transition-colors"
                                    title="Nhân bản"
                                  >
                                    <Copy size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveCard(card.id)}
                                    disabled={cards.length <= 1}
                                    className="p-1.5 text-gray-400 hover:text-red-500 disabled:opacity-30 rounded-lg hover:bg-red-50 transition-colors"
                                    title="Xóa"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  /* Detailed Cards View */
                  cards.map((card, index) => (
                    <div key={card.id} className="card !p-0 overflow-hidden relative group border border-gray-100 dark:border-night-border rounded-2xl shadow-soft hover:border-cam/30 transition-all">
                      <div className="flex items-center justify-between px-5 py-3 bg-gray-50 dark:bg-night-elevated border-b border-gray-100 dark:border-night-border">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-camDam dark:text-cam flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-cam text-white text-[11px] font-mono flex items-center justify-center font-bold">
                            {index + 1}
                          </span>
                          <span>Từ vựng {index + 1}</span>
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDuplicateCard(card.id)}
                            className="p-1.5 text-vutruNhat hover:text-cam dark:text-night-muted dark:hover:text-cam rounded-lg hover:bg-gray-200 dark:hover:bg-night-border transition-colors"
                            title="Nhân bản từ vựng này"
                          >
                            <Copy size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveCard(card.id)}
                            disabled={cards.length <= 1}
                            className="p-1.5 text-gray-400 hover:text-red-500 disabled:opacity-30 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
                            title="Xóa từ này"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-6">
                        {/* Left: core word fields */}
                        <div className="md:col-span-5 space-y-4">
                          <div className="relative">
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-xs font-bold text-camDam uppercase tracking-wider block">Từ tiếng Anh *</label>
                              <button
                                type="button"
                                onClick={() => handleAutoFill(card)}
                                className="text-xs font-bold text-vutru bg-cam/10 hover:bg-cam/20 px-2.5 py-1 rounded-full flex items-center gap-1 transition-colors"
                                title="Tự động điền phiên âm, định nghĩa và ví dụ tiếng Anh"
                              >
                                <Sparkles size={12} className="text-cam" /> Tự động điền
                              </button>
                            </div>
                            <input
                              type="text"
                              value={card.frontContent}
                              onChange={e => handleCardChange(card.id, 'frontContent', e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                  e.preventDefault();
                                  handleAddCard();
                                }
                              }}
                              placeholder="VD: computer"
                              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-night-elevated border border-gray-200 dark:border-night-border rounded-xl outline-none focus:border-cam focus:ring-2 focus:ring-cam/20 transition-all text-vutru dark:text-white font-bold"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-bold text-camDam uppercase tracking-wider mb-1.5 block">Nghĩa tiếng Việt *</label>
                              <input
                                type="text"
                                value={card.backContent}
                                onChange={e => handleCardChange(card.id, 'backContent', e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                    e.preventDefault();
                                    handleAddCard();
                                  }
                                }}
                                placeholder="VD: máy tính"
                                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-night-elevated border border-gray-200 dark:border-night-border rounded-xl outline-none focus:border-cam focus:ring-2 focus:ring-cam/20 transition-all text-vutru dark:text-white font-medium"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-bold text-vutruNhat uppercase tracking-wider mb-1.5 block">Phiên âm</label>
                              <input
                                type="text"
                                value={card.phonetic}
                                onChange={e => handleCardChange(card.id, 'phonetic', e.target.value)}
                                placeholder="VD: /kəmˈpjuː.tər/"
                                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-night-elevated border border-gray-200 dark:border-night-border rounded-xl outline-none focus:border-cam transition-all text-vutru dark:text-white font-mono text-xs"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-bold text-vutruNhat uppercase tracking-wider mb-1.5 block">Loại từ</label>
                            <Select
                              value={card.wordType}
                              onChange={v => handleCardChange(card.id, 'wordType', v)}
                              className="w-full text-xs font-medium px-3.5 py-2.5 bg-gray-50 dark:bg-night-elevated border border-gray-200 dark:border-night-border rounded-xl outline-none focus:border-cam text-vutru dark:text-white"
                              options={[{ value: '', label: 'Chọn loại từ' }, ...WORD_TYPES.map(t => ({ value: t, label: t }))]}
                            />
                          </div>
                        </div>

                        {/* Right: extended fields */}
                        <div className="md:col-span-7 space-y-4 md:border-l md:border-gray-100 dark:md:border-night-border md:pl-6">
                          <div>
                            <label className="text-xs font-bold text-vutruNhat uppercase tracking-wider mb-1.5 block">Định nghĩa Tiếng Anh</label>
                            <textarea
                              value={card.definitionEn}
                              onChange={e => handleCardChange(card.id, 'definitionEn', e.target.value)}
                              placeholder="This is an electronic machine that stores and processes information..."
                              rows={2}
                              className="w-full px-3.5 py-2 bg-white dark:bg-night-elevated border border-gray-200 dark:border-night-border rounded-xl outline-none focus:border-cam transition-all text-xs text-vutru dark:text-white resize-none"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-vutruNhat uppercase tracking-wider mb-1.5 block">Câu ví dụ</label>
                            <textarea
                              value={card.example}
                              onChange={e => handleCardChange(card.id, 'example', e.target.value)}
                              placeholder="I use my computer for schoolwork every day."
                              rows={2}
                              className="w-full px-3.5 py-2 bg-white dark:bg-night-elevated border border-gray-200 dark:border-night-border rounded-xl outline-none focus:border-cam transition-all text-xs text-vutru dark:text-white italic resize-none mb-3"
                            />
                            <label className="text-xs font-bold text-vutruNhat uppercase tracking-wider mb-1.5 block">Dịch nghĩa câu ví dụ</label>
                            <textarea
                              value={card.exampleTranslation}
                              onChange={e => handleCardChange(card.id, 'exampleTranslation', e.target.value)}
                              placeholder="Tôi sử dụng máy tính để làm bài tập mỗi ngày."
                              rows={2}
                              className="w-full px-3.5 py-2 bg-white dark:bg-night-elevated border border-gray-200 dark:border-night-border rounded-xl outline-none focus:border-cam transition-all text-xs text-vutru dark:text-white resize-none"
                            />
                          </div>
                          {/* Card image */}
                          <div>
                            <label className="text-xs font-bold text-vutruNhat uppercase tracking-wider mb-1.5 block">Hình ảnh minh họa</label>
                            <div className="flex items-center gap-4">
                              {card.imageUrl ? (
                                <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                                  <img src={card.imageUrl} alt="Flashcard" className="w-full h-full object-cover" />
                                  <button
                                    type="button"
                                    onClick={() => handleCardChange(card.id, 'imageUrl', '')}
                                    className="absolute top-1 right-1 p-1 bg-white/80 rounded-full text-red-500 hover:bg-white transition-colors shadow-sm"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              ) : (
                                <div className="w-20 h-20 rounded-xl bg-gray-100 dark:bg-night-elevated flex items-center justify-center text-gray-400 border border-dashed border-gray-300">
                                  <ImageIcon size={24} />
                                </div>
                              )}
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => document.getElementById(`card-image-${card.id}`)?.click()}
                                disabled={uploadingImage}
                                className="bg-white dark:bg-night-elevated text-xs font-bold"
                                iconLeft={<Upload size={14} />}
                              >
                                {card.imageUrl ? 'Đổi ảnh' : 'Tải ảnh lên'}
                              </Button>
                              <input
                                id={`card-image-${card.id}`}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={e => handleCardImageUpload(card.id, e)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}

                <div className="mt-6 flex justify-center">
                  <Button onClick={handleAddCard} variant="outline" className="bg-white dark:bg-night-elevated hover:bg-camNhat border-dashed text-xs font-bold py-3 px-6" iconLeft={<Plus size={18} />}>
                    Thêm từ vựng mới (Ctrl + Enter)
                  </Button>
                </div>
              </div>
            )}

            {/* ── Step 2: Settings ── */}
            {currentStep === 2 && (
              <div className="animate-fade-in max-w-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <Lock size={16} className="text-gray-400" />
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">Quyền truy cập &amp; Bảo mật</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Quyền truy cập</label>
                    <div className="flex flex-col gap-3 mb-6">
                      {([
                        { value: 'PUBLIC', label: 'Công khai trên thư viện', icon: <Globe size={16} /> },
                        { value: 'HIDDEN', label: 'Chỉ người có link / mã (ẩn khỏi thư viện)', icon: <EyeOff size={16} /> },
                        { value: 'CLASSROOM', label: 'Chỉ học sinh trong lớp được giao', icon: <UsersIcon size={16} /> },
                      ] as { value: 'PUBLIC' | 'HIDDEN' | 'CLASSROOM'; label: string; icon: React.ReactNode }[]).map(opt => (
                        <label key={opt.value} className="flex items-center gap-2 cursor-pointer bg-gray-50 hover:bg-gray-100 dark:bg-night-elevated dark:hover:bg-night-surface px-3 py-2 rounded-lg border border-transparent transition-colors w-fit">
                          <input type="radio" name="visibility" checked={visibility === opt.value} onChange={() => setVisibility(opt.value)} className="w-4 h-4 accent-cam" />
                          <span className="text-sm font-medium text-vutru dark:text-white">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                    {visibility === 'CLASSROOM' && (
                      <div className="animate-fade-in space-y-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Giao bộ từ vựng cho lớp học</label>
                          <div className="bg-cam/5 border border-cam/20 rounded-2xl p-4">
                            <div className="text-xs text-vutruNhat dark:text-night-muted mb-3">
                              Bộ từ vựng sau khi {id ? 'lưu' : 'tạo'} sẽ tự động được gán vào lớp học bạn chọn dưới đây.
                            </div>
                            <ClassroomSelector selectedClassIds={assignedClassIds} onChange={setAssignedClassIds} />
                          </div>
                        </div>

                        {assignedClassIds.length > 0 && (
                          <div className="bg-white dark:bg-night-surface border border-gray-200 dark:border-night-border rounded-2xl p-4 space-y-3 shadow-2xs">
                            <label className="flex items-center gap-1.5 text-xs font-bold text-vutru dark:text-night-text uppercase tracking-wide">
                              Gán vào Chủ đề / Thư mục trong Lớp học (Tùy chọn)
                            </label>
                            <p className="text-xs text-vutruNhat dark:text-night-muted">
                              Chọn chủ đề tương ứng trong từng lớp học để bài tập hiển thị gọn gàng trên trang Bài tập (Classwork):
                            </p>

                            <div className="space-y-2.5">
                              {assignedClassIds.map(classId => {
                                const cls = classrooms.find(c => c.id === classId);
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
                                        value={assignedClassFolders[classId] || ''}
                                        onChange={v => setAssignedClassFolders(prev => ({ ...prev, [classId]: v }))}
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
                  <div>
                    {visibility === 'HIDDEN' && (
                      <div className="animate-fade-in">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                          <KeyRound size={14} /> Mật khẩu bảo vệ (Tùy chọn)
                        </label>
                        <input
                          value={accessCode}
                          onChange={e => setAccessCode(e.target.value)}
                          placeholder="Bỏ trống nếu không cần mật khẩu..."
                          className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-night-border bg-white dark:bg-night-elevated text-vutru dark:text-white text-sm font-medium focus:ring-2 focus:ring-cam/20 focus:border-cam outline-none transition-all"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <StepperFooter
              currentStep={currentStep}
              totalSteps={STEPS.length}
              onBack={() => setCurrentStep(s => Math.max(0, s - 1))}
              onNext={() => setCurrentStep(s => Math.min(STEPS.length - 1, s + 1))}
              onFinish={handleFinish}
              isSubmitting={loading}
              finishLabel={id ? 'Lưu thay đổi' : 'Tạo bộ từ vựng'}
              leftSlot={<SaveStatusBadge status={saveStatus} savedAt={savedAt} />}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateVocab;
