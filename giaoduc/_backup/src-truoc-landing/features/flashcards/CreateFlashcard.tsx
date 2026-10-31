import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link, useLocation, useParams } from 'react-router-dom';
import { CardDraft } from '../../types/flashcard';
import { flashcardApi } from '../../services/flashcardApi';
import { folderApi } from '../../services/folderApi';
import { getApiErrorMessage } from '../../services/api';
import Alert from '../../components/ui/Alert';
import Select from '../../components/ui/Select';
import AutocompleteInput from '../../components/ui/AutocompleteInput';
import ImportModal from './ImportModal';
import Stepper, { StepConfig, StepState } from '../../components/ui/Stepper';
import StepperFooter from '../../components/ui/StepperFooter';
import useAutoSave, { AutoSaveStatus } from '../../hooks/useAutoSave';
import { Folder, KeyRound, Globe, EyeOff, Users as UsersIcon, Lock, Trash2, Sparkles, CheckCircle2, CloudOff, Cloud, Loader2, Copy, Plus, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import CardImageUpload from '../../components/common/CardImageUpload';
import ClassroomSelector from '../../components/common/ClassroomSelector';
import classService, { Classroom, ClassFolder } from '../../services/class.service';
import { useToast } from '../../context/ToastContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type StepErrors = Record<number, string[]>;

const STEPS: StepConfig[] = [
  { id: 'basic', title: 'Thông tin cơ bản', subtitle: 'Tên, mô tả, môn học' },
  { id: 'content', title: 'Nội dung thẻ', subtitle: 'Thêm và chỉnh sửa thẻ' },
  { id: 'settings', title: 'Cài đặt', subtitle: 'Quyền truy cập' },
];

const PREDEFINED_SUBJECTS = [
  "IELTS Academic", "IELTS General", "TOEIC SW", "TOEIC",
  "HSK 1", "HSK 2", "HSK 3", "HSK 4", "HSK 5", "HSK 6",
  "TOPIK I", "TOPIK II", "N5", "N4", "N3", "N2", "N1",
  "Digital SAT", "Tiếng Anh THPTQG", "Toán THPTQG", "Vật lý THPTQG",
  "Hóa học THPTQG", "Sinh học THPTQG", "ACT"
];

const SUBJECTS = ['Tiếng Anh', 'Toán', 'Vật Lý', 'Hóa Học', 'Sinh Học', 'Ngữ Văn', 'KHTN'];

const emptyCard = (): CardDraft => ({
  id: Date.now().toString() + Math.random(),
  frontContent: '',
  backContent: '',
});

// ─── Validation ───────────────────────────────────────────────────────────────

function validateStep(step: number, title: string, cards: CardDraft[]): string[] {
  if (step === 0) {
    const errs: string[] = [];
    if (!title.trim()) errs.push('Tên bộ thẻ là bắt buộc');
    return errs;
  }
  if (step === 1) {
    const valid = cards.filter(c => c.frontContent.trim() && c.backContent.trim());
    if (valid.length === 0) return ['Bộ thẻ cần ít nhất 1 thẻ có cả thuật ngữ và định nghĩa'];
    return [];
  }
  return [];
}

function validateAll(title: string, cards: CardDraft[]): StepErrors {
  return {
    0: validateStep(0, title, cards),
    1: validateStep(1, title, cards),
    2: [],
  };
}

// ─── AutoSave Status Badge ────────────────────────────────────────────────────

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

const CreateFlashcard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const folderIdParam = searchParams.get('folderId');
  const classIdParam = searchParams.get('classId');
  const classFolderIdParam = searchParams.get('classFolderId');
  const [folderId, setFolderId] = useState<string | null>(folderIdParam);
  const [folderName, setFolderName] = useState('');
  const toast = useToast();
  const location = useLocation();
  const duplicateData = location.state?.duplicateData;

  // ── Form State (all managed here, not in children) ──
  const [title, setTitle] = useState(duplicateData ? `${duplicateData.title} (Bản sao)` : '');
  const [description, setDescription] = useState(duplicateData?.description || '');
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
  const [subject, setSubject] = useState(duplicateData?.subject || '');

  const initialCards = duplicateData?.cards?.length > 0
    ? duplicateData.cards.map((c: any) => ({
        id: Date.now().toString() + Math.random(),
        frontContent: c.frontContent,
        backContent: c.backContent,
        imageUrl: c.imageUrl
      }))
    : [emptyCard(), emptyCard()];

  const [cards, setCards] = useState<CardDraft[]>(initialCards);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);
  const [importOpen, setImportOpen] = useState(false);
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
      flashcardApi.getDeckById(id)
        .then(res => {
          const deck = res.data;
          setTitle(deck.title);
          setDescription(deck.description || '');
          setVisibility(deck.visibility || 'PUBLIC');
          setAccessCode(deck.accessCode || '');
          setSubject(deck.subject || '');
          if (deck.cards && deck.cards.length > 0) {
            setCards(deck.cards.map((c: any) => ({
              id: c.id,
              frontContent: c.frontContent,
              backContent: c.backContent,
              imageUrl: c.imageUrl
            })));
          }
        })
        .catch(() => setError('Không thể tải bộ thẻ. Vui lòng thử lại.'))
        .finally(() => setFetching(false));
    } else {
      setFetching(false);
    }
  }, [id]);

  useEffect(() => {
    if (folderIdParam) {
      setFolderId(folderIdParam);
      folderApi.getMyFolders().then((res) => {
        const f = res.data?.content?.find((x: any) => x.id === folderIdParam);
        if (f) setFolderName(f.name);
      });
    }
  }, [folderIdParam]);

  // ── Build payload (same structure as before) ──
  const buildPayload = useCallback(() => {
    const validCards = cards.filter(c => c.frontContent.trim() && c.backContent.trim());
    return {
      title: title.trim(),
      description: description.trim() || undefined,
      visibility,
      accessCode: visibility === 'HIDDEN' ? accessCode.trim() : undefined,
      assignedClassIds: visibility === 'CLASSROOM' ? assignedClassIds : undefined,
      assignedClassFolders: visibility === 'CLASSROOM' ? assignedClassFolders : undefined,
      classFolderId: visibility === 'CLASSROOM' && classIdParam ? assignedClassFolders[classIdParam] : undefined,
      folderId: folderId || undefined,
      deckType: 'FLASHCARD' as const,
      subject: subject.trim() || undefined,
      tags: subject.trim() ? [subject.trim()] : undefined,
      cards: validCards.map(({ frontContent, backContent, imageUrl }) => ({
        frontContent: frontContent.trim(),
        backContent: backContent.trim(),
        imageUrl: imageUrl || undefined,
      })),
    };
  }, [title, description, visibility, accessCode, assignedClassIds, assignedClassFolders, classIdParam, folderId, subject, cards]);

  // ── Auto-save ──
  const { status: saveStatus, savedId, savedAt, setSavedId } = useAutoSave({
    data: { title, description, visibility, accessCode, assignedClassIds, folderId, subject, cards },
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
        window.history.replaceState(null, '', `/flashcards/${newId}/edit`);
        return newId;
      }
    },
  });

  // Seed savedId from existing id (edit mode)
  useEffect(() => {
    if (id) setSavedId(id);
  }, [id, setSavedId]);

  // ── Stepper state derivation ──
  const computeStepStates = useCallback((): StepState[] => {
    return STEPS.map((_, i) => {
      if (showValidation && (stepErrors[i]?.length ?? 0) > 0) return 'error';
      if (i === currentStep) return 'active';
      // Mark completed if user has been there and no errors
      if (i < currentStep) return 'completed';
      return 'pending';
    });
  }, [currentStep, stepErrors, showValidation]);

  // ── Handlers ──
  const handleCardChange = (cardId: string, field: 'frontContent' | 'backContent', value: string) => {
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, [field]: value } : c));
  };
  const handleCardImageChange = (cardId: string, imageUrl: string | null) => {
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, imageUrl } : c));
  };
  const handleAddCard = () => setCards(prev => [...prev, emptyCard()]);
  const handleDuplicateCard = (cardId: string) => {
    const target = cards.find(c => c.id === cardId);
    if (!target) return;
    const newCard: CardDraft = {
      ...target,
      id: Date.now().toString() + Math.random(),
    };
    const idx = cards.findIndex(c => c.id === cardId);
    const updated = [...cards];
    updated.splice(idx + 1, 0, newCard);
    setCards(updated);
    toast.success('Đã nhân bản thẻ!');
  };
  const handleRemoveCard = (cardId: string) => {
    if (cards.length <= 1) return;
    setCards(prev => prev.filter(c => c.id !== cardId));
  };
  const handleImport = (imported: CardDraft[]) => {
    setCards(prev => {
      const hasContent = prev.some(c => c.frontContent.trim() || c.backContent.trim());
      if (!hasContent) return imported;
      return [...prev.filter(c => c.frontContent.trim() || c.backContent.trim()), ...imported];
    });
  };

  const handleFinish = async () => {
    const errors = validateAll(title, cards);
    setStepErrors(errors);
    setShowValidation(true);

    const hasErrors = Object.values(errors).some(e => e.length > 0);
    if (hasErrors) {
      // Jump to first step with errors
      const firstErrStep = Object.entries(errors).find(([, e]) => e.length > 0);
      if (firstErrStep) setCurrentStep(Number(firstErrStep[0]));
      return;
    }

    setLoading(true);
    try {
      const payload = buildPayload();
      const effectiveId = savedId || id;
      if (effectiveId) {
        await flashcardApi.updateDeck(effectiveId, payload);
      } else {
        const res = await flashcardApi.createDeck(payload);
        if (classIdParam) {
          toast.success('Đã tạo và gán bộ thẻ ghi nhớ vào lớp học!');
          navigate(`/classes/${classIdParam}/classwork`);
          return;
        }
        navigate(folderId ? `/library/folders/${folderId}` : `/flashcards/${res.data.id}`);
        return;
      }
      if (classIdParam) {
        toast.success('Đã cập nhật bộ thẻ ghi nhớ trong lớp học!');
        navigate(`/classes/${classIdParam}/classwork`);
        return;
      }
      navigate(folderId ? `/library/folders/${folderId}` : `/flashcards/${effectiveId}`);
    } catch (err: any) {
      setError(getApiErrorMessage(err, id ? 'Không thể cập nhật bộ thẻ.' : 'Không thể tạo bộ thẻ.'));
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-cam" size={32} />
    </div>
  );

  const stepStates = computeStepStates();

  // Collect errors for current step to display inline
  const currentErrors = showValidation ? (stepErrors[currentStep] ?? []) : [];

  return (
    <div className="min-h-screen bg-kem dark:bg-night-page animate-fade-in pb-10 -mx-3 sm:-mx-6 -my-4 sm:-my-6">
      <main className="mx-auto p-4 sm:p-6 pb-20 w-full max-w-[1400px]">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-vutru dark:text-white mb-1">
            {id ? 'Chỉnh sửa bộ thẻ' : 'Tạo bộ thẻ ghi nhớ mới'}
          </h1>
          <p className="text-sm text-vutruNhat">Theo từng bước để tạo bộ thẻ hoàn chỉnh</p>
        </div>

        {/* Header and Stepper */}
        <div className="bg-white dark:bg-night-surface rounded-2xl border border-gray-100 dark:border-night-border shadow-sm px-4 sm:px-8 py-6 mb-6">
          <Stepper
            steps={STEPS}
            currentStep={currentStep}
            stepStates={stepStates}
            onStepClick={setCurrentStep}
          />
        </div>

        {error && <Alert variant="error" className="mb-4">{error}</Alert>}
        {currentErrors.length > 0 && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            {currentErrors.map((e, i) => (
              <p key={i} className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5">
                <AlertTriangle size={15} className="shrink-0 text-red-500" aria-hidden="true" />
                <span>{e}</span>
              </p>
            ))}
          </div>
        )}

        {/* ── Step 0: Basic Info ── */}
        {currentStep === 0 && (
          <section className="bg-white dark:bg-night-surface p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-night-border w-full mb-8 animate-fade-in flex flex-col gap-5">
            <div>
              <label className="text-xs font-bold text-vutruNhat uppercase tracking-wide mb-1.5 block">Tên bộ thẻ <span className="text-red-500">*</span></label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ví dụ: Từ vựng IELTS Band 7"
                className="w-full text-xl font-bold text-vutru dark:text-white bg-gray-50 dark:bg-night-elevated border border-gray-200 dark:border-night-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-cam/20 focus:border-cam transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-vutruNhat uppercase tracking-wide mb-1.5 block">Mô tả</label>
              <input
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Thêm mô tả..."
                className="w-full text-vutru dark:text-white bg-gray-50 dark:bg-night-elevated border border-gray-200 dark:border-night-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-cam/20 focus:border-cam transition-all text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-vutruNhat uppercase tracking-wide mb-1.5 block">Môn học</label>
              <AutocompleteInput
                value={subject}
                onChange={setSubject}
                options={['Toán học', 'Vật lý', 'Hóa học', 'Sinh học', 'Ngữ văn', 'Lịch sử', 'Địa lý', 'Tiếng Anh', 'Tin học', 'GDCD']}
                className="w-full text-vutru dark:text-white bg-gray-50 dark:bg-night-elevated border border-gray-200 dark:border-night-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-cam/20 focus:border-cam transition-all text-sm"
                placeholder="VD: Toán, Ngữ Văn, Tiếng Anh..."
              />
              
              <div className="mt-2 flex flex-wrap gap-1.5">
                {PREDEFINED_SUBJECTS.map(tag => {
                  const currentSubjects = subject ? String(subject).split(',').map((s: string) => s.trim()).filter(Boolean) : [];
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
                        setSubject(newSubjects.join(', '));
                      }}
                      className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${isSelected ? 'bg-cam/10 text-camDam border-cam/30 font-bold' : 'bg-gray-50 dark:bg-night-elevated text-gray-600 dark:text-gray-300 border-gray-200 dark:border-night-border hover:bg-gray-100 dark:hover:bg-night-surface'}`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
            {folderId && folderName && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-camNhat/60 border border-cam/15 text-sm">
                <Folder size={16} className="inline text-cam" />
                <span>Thêm vào folder:</span>
                <Link to={`/library/folders/${folderId}`} className="font-bold text-camDam hover:underline">{folderName}</Link>
              </div>
            )}
          </section>
        )}

        {/* ── Step 1: Content ── */}
        {currentStep === 1 && (
          <section className="bg-white dark:bg-night-surface p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-night-border w-full mb-8 animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-3 border-b border-gray-100 dark:border-night-border">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setImportOpen(true)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-night-elevated dark:hover:bg-night-border text-vutru dark:text-night-text rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5"
                >
                  <Plus size={14} className="text-cam" />
                  <span>Nhập hàng loạt (Quizlet / Excel)</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-vutruNhat dark:text-night-muted font-medium hidden sm:inline">
                  Mẹo: Nhấn <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-night-elevated border border-gray-200 dark:border-night-border text-[11px] font-mono font-bold">Ctrl + Enter</kbd> để thêm thẻ
                </span>
                <span className="px-3 py-1 rounded-full bg-camNhat/60 dark:bg-cam/20 text-camDam dark:text-cam text-xs font-extrabold font-heading">
                  {cards.length} thẻ
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {cards.map((card, index) => (
                <div key={card.id} className="card !p-0 overflow-hidden border border-gray-100 dark:border-night-border rounded-2xl shadow-2xs hover:border-cam/30 transition-all">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-night-elevated border-b border-gray-100 dark:border-night-border">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-camDam dark:text-cam flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-cam text-white text-[11px] font-mono flex items-center justify-center font-bold">
                        {index + 1}
                      </span>
                      <span>Thẻ {index + 1}</span>
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleDuplicateCard(card.id)}
                        className="p-1.5 text-vutruNhat hover:text-cam dark:text-night-muted dark:hover:text-cam rounded-lg hover:bg-gray-200 dark:hover:bg-night-border transition-colors"
                        title="Nhân bản thẻ này"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveCard(card.id)}
                        disabled={cards.length <= 1}
                        className="p-1.5 text-vutruNhat hover:text-red-500 disabled:opacity-30 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
                        title="Xóa thẻ"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-night-border">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-vutruNhat dark:text-night-muted uppercase tracking-wider">
                          Thuật ngữ (Mặt trước)
                        </label>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!card.frontContent.trim()) return;
                            try {
                              const word = card.frontContent.trim();
                              const { default: apiInst } = await import('../../services/api');
                              const result = await apiInst.post('/vocabulary/ai/auto-fill', { word });
                              const data = result.data;
                              handleCardChange(card.id, 'backContent', data.definitionVi || data.backContent || data.definitionEn || card.backContent);
                              toast.success('Đã tự động điền định nghĩa!');
                            } catch {
                              try {
                                const res = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${card.frontContent.trim()}`);
                                const def = res.data[0]?.meanings[0]?.definitions[0];
                                if (def) {
                                  handleCardChange(card.id, 'backContent', def.definition);
                                  toast.success('Đã điền định nghĩa từ điển!');
                                }
                              } catch {
                                toast.warning('Không tìm thấy thuật ngữ này trong từ điển.');
                              }
                            }
                          }}
                          className="text-xs font-bold text-camDam dark:text-cam bg-camNhat/60 dark:bg-cam/20 hover:bg-camNhat dark:hover:bg-cam/30 px-2.5 py-1 rounded-full flex items-center gap-1 transition-colors"
                        >
                          <Sparkles size={12} className="text-cam" /> Tự động điền
                        </button>
                      </div>
                      <textarea
                        value={card.frontContent}
                        onChange={e => handleCardChange(card.id, 'frontContent', e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                            e.preventDefault();
                            handleAddCard();
                          }
                        }}
                        placeholder="Nhập thuật ngữ, câu hỏi hoặc từ vựng..."
                        className="w-full min-h-[80px] resize-none bg-transparent outline-none text-vutru dark:text-white font-medium placeholder:text-gray-300 dark:placeholder:text-night-muted text-sm leading-relaxed"
                      />
                    </div>

                    <div className="p-4 space-y-3">
                      <div>
                        <label className="text-xs font-bold text-vutruNhat dark:text-night-muted uppercase tracking-wider mb-2 block">
                          Định nghĩa (Mặt sau)
                        </label>
                        <textarea
                          value={card.backContent}
                          onChange={e => handleCardChange(card.id, 'backContent', e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                              e.preventDefault();
                              handleAddCard();
                            }
                          }}
                          placeholder="Nhập định nghĩa, câu trả lời hoặc giải thích..."
                          className="w-full min-h-[80px] resize-none bg-transparent outline-none text-vutru dark:text-white font-medium placeholder:text-gray-300 dark:placeholder:text-night-muted text-sm leading-relaxed"
                        />
                      </div>
                      <CardImageUpload imageUrl={card.imageUrl} onChange={url => handleCardImageChange(card.id, url)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center mt-6">
              <button
                type="button"
                onClick={handleAddCard}
                className="px-6 py-3 bg-cam/10 hover:bg-cam/20 dark:bg-cam/20 dark:hover:bg-cam/30 text-camDam dark:text-cam border border-cam/30 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 shadow-2xs active:scale-95"
              >
                <Plus size={18} />
                <span>Thêm thẻ mới</span>
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-white dark:bg-night-elevated text-[11px] font-mono opacity-80">Ctrl + Enter</kbd>
              </button>
            </div>

            <ImportModal isOpen={importOpen} onClose={() => setImportOpen(false)} onImport={handleImport} />
          </section>
        )}

        {/* ── Step 2: Settings ── */}
        {currentStep === 2 && (
          <section className="bg-white dark:bg-night-surface p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-night-border w-full mb-8 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
                <Lock size={16} className="text-gray-400" />
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">Quyền truy cập &amp; Bảo mật</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Quyền truy cập</label>
                  <div className="flex flex-col gap-3">
                    {([
                      { value: 'PUBLIC', label: 'Công khai trên thư viện', icon: <Globe size={16} /> },
                      { value: 'HIDDEN', label: 'Riêng tư (chỉ người có mã/link)', icon: <EyeOff size={16} /> },
                      { value: 'CLASSROOM', label: 'Chỉ học sinh trong lớp được giao', icon: <UsersIcon size={16} /> },
                    ] as { value: 'PUBLIC' | 'HIDDEN' | 'CLASSROOM'; label: string; icon: React.ReactNode }[]).map(opt => (
                      <label key={opt.value} className="flex items-center gap-2 cursor-pointer bg-gray-50 hover:bg-gray-100 dark:bg-night-elevated dark:hover:bg-night-surface px-3 py-2 rounded-lg border border-transparent transition-colors w-fit">
                        <input type="radio" name="visibility" checked={visibility === opt.value} onChange={() => setVisibility(opt.value)} className="w-4 h-4 accent-cam" />
                        <span className="text-sm font-medium text-vutru dark:text-white">{opt.label}</span>
                      </label>
                    ))}
                  </div>

                  {visibility === 'CLASSROOM' && (
                    <div className="mt-4 animate-fade-in space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Giao thẻ cho lớp học</label>
                        <div className="bg-cam/5 border border-cam/20 rounded-2xl p-4">
                          <div className="text-xs text-vutruNhat dark:text-night-muted mb-3">
                            Bộ thẻ sau khi {id ? 'lưu' : 'tạo'} sẽ tự động được gán vào lớp học bạn chọn dưới đây. (Tùy chọn)
                          </div>
                          <ClassroomSelector selectedClassIds={assignedClassIds} onChange={setAssignedClassIds} />
                        </div>
                      </div>

                      {assignedClassIds.length > 0 && (
                        <div className="bg-white dark:bg-night-surface border border-gray-200 dark:border-night-border rounded-2xl p-4 space-y-3 shadow-2xs">
                          <label className="flex items-center gap-1.5 text-xs font-bold text-vutru dark:text-night-text uppercase tracking-wide">
                            <Folder size={14} className="text-cam" />
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
                                      onChange={(v) => setAssignedClassFolders(prev => ({ ...prev, [classId]: v }))}
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
                        className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-night-border bg-white dark:bg-night-elevated text-vutru dark:text-white text-sm focus:ring-2 focus:ring-cam/20 focus:border-cam outline-none transition-all"
                      />
                    </div>
                  )}
                </div>
              </div>
          </section>
        )}

        {/* Footer Navigation */}
        <div className="bg-white dark:bg-night-surface rounded-2xl border border-gray-100 dark:border-night-border shadow-sm px-4 sm:px-8 py-4 mt-6">
          <StepperFooter
            currentStep={currentStep}
            totalSteps={STEPS.length}
            onBack={() => setCurrentStep(s => Math.max(0, s - 1))}
            onNext={() => setCurrentStep(s => Math.min(STEPS.length - 1, s + 1))}
            onFinish={handleFinish}
            isSubmitting={loading}
            finishLabel={id ? 'Lưu thay đổi' : 'Tạo bộ thẻ'}
            leftSlot={<SaveStatusBadge status={saveStatus} savedAt={savedAt} />}
          />
        </div>
      </main>
    </div>
  );
};

export default CreateFlashcard;
