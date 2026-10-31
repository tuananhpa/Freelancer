import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import { resourceApi, ResourceRequest, ResourceType } from '../../services/resourceApi';
import api, { uploadFile } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  FileText, Video, ClipboardList, Presentation, Music, 
  Upload, Link as LinkIcon, Sparkles, CheckCircle, AlertCircle, RotateCw, Plus, X
} from 'lucide-react';

interface UploadResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialType?: ResourceType;
}

/** Mot tep da tai len xong, dang cho dang thanh mot tai nguyen. */
interface StagedFile {
  /** Khoa on dinh cho React - ten tep co the trung nhau. */
  key: string;
  name: string;
  size: number;
  fileUrl: string;
  /** Tieu de rieng, chi dung khi dang nhieu tep cung luc. */
  title: string;
}

/** Moi lan dang toi da bay nhieu tep - de tranh giao vien lo keo ca thu muc vao. */
const MAX_FILES_PER_UPLOAD = 10;
const MAX_FILE_BYTES = 50 * 1024 * 1024;

const stripExtension = (fileName: string) => fileName.replace(/\.[^./\\]+$/, '');

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

interface ExamOption {
  id: string;
  title: string;
  subject?: string;
  grade?: string;
}

export const GRADE_OPTIONS = [
  { value: 'KHOI_1', label: 'Khối 1' },
  { value: 'KHOI_2', label: 'Khối 2' },
  { value: 'KHOI_3', label: 'Khối 3' },
  { value: 'KHOI_4', label: 'Khối 4' },
  { value: 'KHOI_5', label: 'Khối 5' },
  { value: 'KHOI_6', label: 'Khối 6' },
  { value: 'KHOI_7', label: 'Khối 7' },
  { value: 'KHOI_8', label: 'Khối 8' },
  { value: 'KHOI_9', label: 'Khối 9' },
  { value: 'KHOI_10', label: 'Khối 10' },
  { value: 'KHOI_11', label: 'Khối 11' },
  { value: 'KHOI_12', label: 'Khối 12' },
  { value: 'KHAC', label: 'Đại học / Khác' },
];

export const SUBJECT_OPTIONS = [
  { value: 'TOAN', label: 'Toán học' },
  { value: 'VAN', label: 'Ngữ văn' },
  { value: 'TIENG_ANH', label: 'Tiếng Anh' },
  { value: 'VAT_LY', label: 'Vật lý' },
  { value: 'HOA_HOC', label: 'Hóa học' },
  { value: 'SINH_HOC', label: 'Sinh học' },
  { value: 'LICH_SU', label: 'Lịch sử' },
  { value: 'DIA_LY', label: 'Địa lý' },
  { value: 'TIN_HOC', label: 'Tin học' },
  { value: 'GDCD', label: 'GDCD / KT&PL' },
  { value: 'KHTN', label: 'KHTN' },
  { value: 'KHAC', label: 'Môn khác' },
];

export const getSubjectLabel = (sub?: string): string => {
  if (!sub) return '';
  const found = SUBJECT_OPTIONS.find((s) => s.value === sub);
  return found ? found.label : sub;
};

export const getGradeLabel = (gr?: string): string => {
  if (!gr) return '';
  const found = GRADE_OPTIONS.find((g) => g.value === gr);
  if (found) return found.label;
  if (gr.startsWith('KHOI_')) return `Khối ${gr.replace('KHOI_', '')}`;
  if (gr.startsWith('LOP_')) return `Lớp ${gr.replace('LOP_', '')}`;
  return gr;
};



const RESOURCE_TYPES: { type: ResourceType; label: string; icon: React.ReactNode; desc: string }[] = [
  { type: 'VIDEO', label: 'Bài giảng Video', icon: <Video size={18} />, desc: 'Nhúng link YouTube' },
  { type: 'DOCUMENT', label: 'Tài liệu tham khảo', icon: <FileText size={18} />, desc: 'Upload file PDF, Word' },
  { type: 'AUDIO', label: 'File nghe / Luyện nghe', icon: <Music size={18} />, desc: 'Upload MP3 & gán đề thi' },
  { type: 'SLIDE', label: 'Slide Powerpoint', icon: <Presentation size={18} />, desc: 'File PPTX, PDF' },
  { type: 'EXAM', label: 'Đề thi, Bài tập', icon: <ClipboardList size={18} />, desc: 'Đề thi trắc nghiệm / tự luận' },
];

const UploadResourceModal: React.FC<UploadResourceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialType = 'VIDEO',
}) => {
  const { user } = useAuth();
  const toast = useToast();

  const [resourceType, setResourceType] = useState<ResourceType>(initialType);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [grade, setGrade] = useState('KHOI_12');
  const [subject, setSubject] = useState('TOAN');
  
  // Tên giáo viên / Người soạn (Trợ giảng có thể nhập tên Giáo viên phụ trách)
  const [authorName, setAuthorName] = useState('');
  
  const [externalUrl, setExternalUrl] = useState('');
  // Danh sach tep da tai len. Chon nhieu tep thi moi tep thanh mot tai nguyen
  // rieng trong kho - mot bai nghe la mot hoc lieu doc lap.
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  
  // Dành cho Audio: đính kèm đề thi hoặc transcript
  const [attachedExamId, setAttachedExamId] = useState<string>('');
  const [audioTranscript, setAudioTranscript] = useState('');
  const [availableExams, setAvailableExams] = useState<ExamOption[]>([]);
  
  const [learningOutcomes, setLearningOutcomes] = useState('');
  const [writingPrompt, setWritingPrompt] = useState('');
  const [tags, setTags] = useState('');
  
  const [uploadingFile, setUploadingFile] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setResourceType(initialType);
      setTitle('');
      setDescription('');
      setGrade('KHOI_12');
      setSubject(initialType === 'AUDIO' ? 'TIENG_ANH' : 'TOAN');
      setAuthorName(user?.fullName || '');
      setExternalUrl('');
      setFiles([]);
      setUploadProgress(null);
      setAttachedExamId('');
      setAudioTranscript('');
      setLearningOutcomes('');
      setWritingPrompt('');
      setTags('');

      // Load teacher's exams
      loadTeacherData();
    }
  }, [isOpen, initialType, user]);

  const loadTeacherData = async () => {
    try {
      const examsRes = await api.get('/exams/teacher?page=0&size=100').catch(() => ({ data: { content: [] } }));
      setAvailableExams(examsRes.data.content || []);
    } catch {
      // Non-critical
    }
  };

  const removeFile = (key: string) => setFiles((prev) => prev.filter((f) => f.key !== key));

  const renameFile = (key: string, value: string) =>
    setFiles((prev) => prev.map((f) => (f.key === key ? { ...f, title: value } : f)));

  /**
   * @param allowMultiple Bai nghe / tai lieu cho chon nhieu tep mot luc; rieng
   *                      luong De thi van la mot tep, vi no gan voi mot de duy nhat.
   */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, allowMultiple = false) => {
    const picked = Array.from(e.target.files ?? []);
    // Xoa gia tri de chon lai dung tep vua bo van kich hoat onChange.
    e.target.value = '';
    if (picked.length === 0) return;

    const room = allowMultiple ? MAX_FILES_PER_UPLOAD - files.length : 1;
    if (room <= 0) {
      toast.warning(`Mỗi lần đăng tối đa ${MAX_FILES_PER_UPLOAD} tệp. Hãy đăng đợt này trước.`);
      return;
    }
    if (picked.length > room) {
      toast.warning(`Chỉ nhận ${room} tệp đầu tiên, tối đa ${MAX_FILES_PER_UPLOAD} tệp mỗi lần.`);
    }

    const accepted = picked.slice(0, room).filter((f) => {
      if (f.size > MAX_FILE_BYTES) {
        toast.error(`"${f.name}" nặng ${formatFileSize(f.size)}, vượt giới hạn 50MB.`);
        return false;
      }
      return true;
    });
    if (accepted.length === 0) return;

    setUploadingFile(true);
    let succeeded = 0;
    // Tai tuan tu: nhieu tep audio cung luc de nghen duong truyen, va tai tung
    // tep thi mot tep hong khong keo do nhung tep con lai.
    for (let i = 0; i < accepted.length; i++) {
      const file = accepted[i];
      setUploadProgress({ done: i, total: accepted.length });
      try {
        const result = await uploadFile(file);
        const entry: StagedFile = {
          key: `${file.name}-${file.size}-${Date.now()}-${i}`,
          name: file.name,
          size: file.size,
          fileUrl: result.fileUrl,
          title: stripExtension(file.name),
        };
        setFiles((prev) => (allowMultiple ? [...prev, entry] : [entry]));
        succeeded++;
      } catch (err: any) {
        toast.error(`Không tải lên được "${file.name}": ` + (err.response?.data?.message || err.message));
      }
    }
    setUploadProgress(null);
    setUploadingFile(false);

    if (succeeded === 1) toast.success('Tải file lên thành công!');
    else if (succeeded > 1) toast.success(`Đã tải lên ${succeeded} tệp.`);
  };

  const isBatch = files.length > 1;

  /**
   * Dang mot tep: lay tieu de o o chinh.
   * Dang nhieu tep: moi tep co tieu de rieng, o chinh tro thanh tien to chung
   * ("Listening KET 2024" + "Part 1" -> "Listening KET 2024 - Part 1").
   */
  const resourceTitleFor = (file: StagedFile | null) => {
    const prefix = title.trim();
    if (!isBatch) return prefix || stripExtension(file?.name ?? '');
    const own = file ? (file.title.trim() || stripExtension(file.name)) : '';
    return prefix ? `${prefix} - ${own}` : own;
  };

  const buildPayload = (file: StagedFile | null): ResourceRequest => ({
    title: resourceTitleFor(file),
    description: description.trim() || undefined,
    resourceType,
    grade,
    subject,
    authorName: authorName.trim() || user?.fullName || 'Giáo viên',
    fileUrl: file?.fileUrl || undefined,
    externalUrl: externalUrl.trim() || undefined,
    fileName: file?.name || undefined,
    fileSize: file?.size,
    fileFormat: file ? file.name.split('.').pop()?.toLowerCase() : (resourceType === 'VIDEO' ? 'youtube' : undefined),
    attachedExamId: attachedExamId || undefined,
    audioTranscript: audioTranscript.trim() || undefined,
    learningOutcomes: learningOutcomes.trim() || undefined,
    writingPrompt: writingPrompt.trim() || undefined,
    tags: tags.trim() || undefined,
    isPublic: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Dang nhieu tep thi tieu de chung khong bat buoc - moi tep tu co tieu de.
    if (!isBatch && !title.trim()) {
      toast.warning('Vui lòng nhập tiêu đề tài nguyên');
      return;
    }
    if (isBatch && files.some((f) => !f.title.trim() && !stripExtension(f.name))) {
      toast.warning('Mỗi tệp cần một tiêu đề');
      return;
    }

    if (resourceType === 'VIDEO' && !externalUrl.trim()) {
      toast.warning('Vui lòng nhập link video YouTube');
      return;
    }

    if (['DOCUMENT', 'AUDIO', 'SLIDE'].includes(resourceType) && files.length === 0 && !externalUrl.trim()) {
      toast.warning('Vui lòng upload tệp tài liệu hoặc nhập đường dẫn');
      return;
    }

    // Khong co tep nao (video / link ngoai) thi van dang mot tai nguyen.
    const targets: (StagedFile | null)[] = files.length > 0 ? files : [null];

    setSubmitting(true);
    const createdKeys: string[] = [];
    const failures: string[] = [];
    try {
      for (const file of targets) {
        try {
          await resourceApi.createResource(buildPayload(file));
          if (file) createdKeys.push(file.key);
        } catch (err: any) {
          failures.push(`${file?.name ?? 'tài nguyên'}: ${err.response?.data?.message || err.message}`);
        }
      }

      const created = targets.length - failures.length;
      if (created > 0) {
        toast.success(
          created === 1
            ? 'Đã đăng tài nguyên vào Kho học liệu thành công!'
            : `Đã đăng ${created} tài nguyên vào Kho học liệu!`
        );
        onSuccess();
      }

      if (failures.length > 0) {
        // Giu modal mo va bo di nhung tep da dang, de bam lai la chi thu lai
        // phan that bai chu khong tao ban trung.
        setFiles((prev) => prev.filter((f) => !createdKeys.includes(f.key)));
        toast.error(`Không đăng được ${failures.length} tệp. ${failures[0]}`);
        return;
      }

      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Đóng góp học liệu & tài nguyên số" maxWidth="3xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Chọn loại tài nguyên */}
        <div>
          <label className="block text-xs font-bold text-vutruNhat dark:text-night-muted uppercase tracking-wider mb-2">
            Loại tài nguyên <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {RESOURCE_TYPES.map((t) => (
              <button
                key={t.type}
                type="button"
                onClick={() => {
                  setResourceType(t.type);
                  if (t.type === 'AUDIO') setSubject('TIENG_ANH');
                }}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                  resourceType === t.type
                    ? 'border-cam bg-cam/10 text-cam font-bold shadow-xs'
                    : 'border-gray-100 dark:border-night-border bg-gray-50/50 dark:bg-night-elevated text-vutru dark:text-night-text hover:border-gray-300'
                }`}
              >
                <div className={resourceType === t.type ? 'text-cam' : 'text-gray-500'}>{t.icon}</div>
                <span className="text-xs">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tiêu đề & Tác giả */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-vutruNhat dark:text-night-muted uppercase tracking-wider mb-1">
              {isBatch ? 'Tiền tố chung cho các tệp' : 'Tiêu đề tài nguyên'}{' '}
              {!isBatch && <span className="text-red-500">*</span>}
              {isBatch && <span className="normal-case font-normal">(tùy chọn)</span>}
            </label>
            <input
              type="text"
              /* Dang nhieu tep thi tieu de nam o tung tep, o nay chi la tien to. */
              required={!isBatch}
              placeholder={
                isBatch
                  ? 'VD: Listening KET 2024 (để trống nếu giữ nguyên tên tệp)'
                  : 'VD: Lớp 12 TSA Online - Bài 1: Nội quy và Vector không gian'
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-night-border bg-white dark:bg-night-surface text-sm text-vutru dark:text-night-text focus:ring-2 focus:ring-cam outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-vutruNhat dark:text-night-muted uppercase tracking-wider mb-1">
              Người soạn / Giáo viên
            </label>
            <input
              type="text"
              placeholder="VD: Thầy Dương Xuân Tuyên"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-night-border bg-white dark:bg-night-surface text-sm text-vutru dark:text-night-text focus:ring-2 focus:ring-cam outline-none"
            />
            <p className="text-[10px] text-vutruNhat dark:text-night-muted mt-1">Trợ giảng có thể nhập tên Giáo viên</p>
          </div>
        </div>

        {/* Khối lớp & Môn học */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-vutruNhat dark:text-night-muted uppercase tracking-wider mb-1">
              Khối lớp <span className="text-red-500">*</span>
            </label>
            <Select
              value={grade}
              onChange={(v) => setGrade(v)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-night-border bg-white dark:bg-night-surface text-sm text-vutru dark:text-night-text focus:ring-2 focus:ring-cam outline-none"
              options={GRADE_OPTIONS}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-vutruNhat dark:text-night-muted uppercase tracking-wider mb-1">
              Môn học <span className="text-red-500">*</span>
            </label>
            <Select
              value={subject}
              onChange={(v) => setSubject(v)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-night-border bg-white dark:bg-night-surface text-sm text-vutru dark:text-night-text focus:ring-2 focus:ring-cam outline-none"
              options={SUBJECT_OPTIONS}
            />
          </div>
        </div>

        {/* Nguồn nội dung (File Upload hoặc Link YouTube) */}
        <div className="p-4 rounded-2xl bg-gray-50/70 dark:bg-night-elevated border border-gray-100 dark:border-night-border space-y-3">
          <h4 className="text-xs font-bold text-vutru dark:text-night-text uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={14} className="text-cam" /> Nguồn tệp & Đường dẫn
          </h4>

          {/* Tùy chọn dành riêng cho ĐỀ THI, BÀI TẬP (EXAM) */}
          {resourceType === 'EXAM' && (
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-vutru dark:text-night-text">
                    📝 Chọn Đề thi từ ngân hàng đề thi ĐIỂM SÁNG (Khuyên dùng)
                  </label>
                  <a
                    href="/exams/create"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-bold text-cam hover:text-camDam flex items-center gap-1"
                  >
                    + Tạo đề mới trên hệ thống
                  </a>
                </div>
                <Select
                  value={attachedExamId}
                  onChange={(exId) => {
                    setAttachedExamId(exId);
                    const selected = availableExams.find((x) => x.id === exId);
                    if (selected && !title) {
                      setTitle(selected.title);
                    }
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-night-border bg-white dark:bg-night-surface text-xs text-vutru dark:text-night-text focus:ring-2 focus:ring-cam outline-none"
                  options={[
                    { value: '', label: '-- Chọn đề thi có sẵn từ danh sách của bạn --' },
                    ...availableExams.map((ex) => ({ value: ex.id, label: `${ex.title} ${ex.grade ? `(${ex.grade})` : ''}` })),
                  ]}
                />
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                  💡 Đề thi đưa vào Kho học liệu sẽ ở chế độ tự do luyện tập (không bắt buộc deadline), học sinh có thể vào ôn luyện và chấm điểm bất kỳ lúc nào.
                </p>
              </div>

              {/* Hoặc upload đề thi dạng PDF */}
              <div className="pt-2 border-t border-gray-200 dark:border-night-border">
                <label className="block text-xs font-semibold text-vutruNhat dark:text-night-muted mb-2">
                  Hoặc Tải lên file đề thi PDF / Word DOCX (nếu chưa tạo đề trên hệ thống)
                </label>
                <div className="flex items-center gap-3">
                  <label className="btn btn-phu cursor-pointer text-xs font-bold flex items-center gap-2">
                    <Upload size={15} />
                    {uploadingFile ? 'Đang tải lên...' : 'Chọn file PDF/DOCX'}
                    <input
                      type="file"
                      className="hidden"
                      disabled={uploadingFile}
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleFileUpload(e, false)}
                    />
                  </label>

                  {files[0] && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/40 truncate max-w-xs">
                      <CheckCircle size={14} className="shrink-0" />
                      <span className="truncate">{files[0].name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Nguồn nội dung cho VIDEO */}
          {resourceType === 'VIDEO' && (
            <div>
              <label className="block text-xs font-semibold text-vutruNhat dark:text-night-muted mb-1">
                Đường dẫn Video YouTube <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="url"
                  required
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-night-border bg-white dark:bg-night-surface text-sm text-vutru dark:text-night-text focus:ring-2 focus:ring-cam outline-none"
                />
                <LinkIcon size={16} className="absolute left-3 top-3.5 text-gray-400" />
              </div>
            </div>
          )}

          {/* Nguồn nội dung cho DOCUMENT, SLIDE, AUDIO */}
          {['DOCUMENT', 'SLIDE', 'AUDIO'].includes(resourceType) && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-vutruNhat dark:text-night-muted">
                Tải lên tệp ({resourceType === 'AUDIO' ? 'MP3, M4A, WAV' : 'PDF, DOCX, PPTX'})
                <span className="ml-1 font-normal">— chọn được nhiều tệp một lúc, tối đa {MAX_FILES_PER_UPLOAD}</span>
              </label>

              <div className="flex flex-wrap items-center gap-3">
                <label className="btn btn-phu cursor-pointer text-xs font-bold flex items-center gap-2">
                  <Upload size={15} />
                  {uploadingFile
                    ? uploadProgress
                      ? `Đang tải ${uploadProgress.done + 1}/${uploadProgress.total}...`
                      : 'Đang tải lên...'
                    : files.length > 0
                      ? 'Thêm tệp khác'
                      : 'Chọn file từ máy tính'}
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    disabled={uploadingFile}
                    accept={
                      resourceType === 'AUDIO'
                        ? 'audio/mp3,audio/wav,audio/m4a,audio/mpeg'
                        : '.pdf,.doc,.docx,.ppt,.pptx'
                    }
                    onChange={(e) => handleFileUpload(e, true)}
                  />
                </label>

                {files.length > 0 && (
                  <span className="text-xs font-semibold text-vutruNhat dark:text-night-muted">
                    {files.length} tệp · sẽ tạo {files.length} tài nguyên riêng
                  </span>
                )}
              </div>

              {files.length > 0 && (
                <ul className="space-y-2">
                  {files.map((f) => (
                    <li
                      key={f.key}
                      className="flex items-start gap-2 rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2"
                    >
                      <CheckCircle size={14} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                            {f.name}
                          </span>
                          <span className="shrink-0 text-[10px] font-medium text-emerald-700/70 dark:text-emerald-400/70">
                            {formatFileSize(f.size)}
                          </span>
                        </div>
                        {/* Mot tep thi dung o tieu de chinh phia tren; nhieu tep
                            moi can dat ten rieng cho tung tai nguyen. */}
                        {isBatch && (
                          <input
                            type="text"
                            value={f.title}
                            onChange={(e) => renameFile(f.key, e.target.value)}
                            placeholder="Tiêu đề riêng cho tệp này"
                            className="mt-1.5 w-full rounded-lg border border-emerald-200 dark:border-emerald-800/40 bg-white dark:bg-night-surface px-2 py-1 text-xs text-vutru dark:text-night-text outline-none focus:ring-2 focus:ring-cam"
                          />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(f.key)}
                        aria-label={`Bỏ tệp ${f.name}`}
                        className="mt-0.5 shrink-0 rounded-lg p-1 text-emerald-700/70 dark:text-emerald-400/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 hover:text-red-500"
                      >
                        <X size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {isBatch && (
                <p className="text-[11px] text-vutruNhat dark:text-night-muted">
                  Ô <span className="font-semibold">Tiêu đề tài nguyên</span> phía trên sẽ thành tiền tố chung cho cả {files.length} tệp. Để trống nếu muốn giữ nguyên tên từng tệp.
                </p>
              )}

              {/* Hoặc link ngoài */}
              <div className="pt-2">
                <input
                  type="url"
                  placeholder="Hoặc dán URL liên kết ngoài (Google Drive, Canva, Slide URL...)"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-night-border bg-white dark:bg-night-surface text-xs text-vutru dark:text-night-text focus:ring-2 focus:ring-cam outline-none"
                />
              </div>
            </div>
          )}

          {/* Tùy chọn nâng cao dành cho Bài Nghe AUDIO */}
          {resourceType === 'AUDIO' && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-night-border space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-vutru dark:text-night-text">
                    🎯 Đính kèm Đề thi trắc nghiệm làm kèm bài nghe (Tùy chọn)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={loadTeacherData}
                      className="text-[11px] font-semibold text-vutruNhat dark:text-night-muted hover:text-vutru flex items-center gap-1"
                      title="Làm mới danh sách đề"
                    >
                      <RotateCw size={11} /> Làm mới
                    </button>
                    <a
                      href="/exams/create"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-bold text-cam hover:text-camDam flex items-center gap-1 bg-cam/10 px-2 py-0.5 rounded-lg border border-cam/20"
                    >
                      <Plus size={12} /> Tạo đề thi mới
                    </a>
                  </div>
                </div>
                <Select
                  value={attachedExamId}
                  onChange={(v) => setAttachedExamId(v)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-night-border bg-white dark:bg-night-surface text-xs text-vutru dark:text-night-text focus:ring-2 focus:ring-cam outline-none"
                  options={[
                    { value: '', label: '-- Không đính kèm đề thi --' },
                    ...availableExams.map((ex) => ({ value: ex.id, label: `${ex.title} ${ex.grade ? `(${ex.grade})` : ''}` })),
                  ]}
                />
                <p className="text-[10px] text-vutruNhat dark:text-night-muted mt-1">
                  Học sinh sẽ vừa nghe audio vừa làm phiếu trắc nghiệm trực tiếp bên dưới.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-vutruNhat dark:text-night-muted mb-1">
                  Lời thoại bài nghe / Audio Transcript (Tùy chọn)
                </label>
                <textarea
                  rows={2}
                  placeholder="Nhập transcript đoạn hội thoại..."
                  value={audioTranscript}
                  onChange={(e) => setAudioTranscript(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-night-border bg-white dark:bg-night-surface text-xs text-vutru dark:text-night-text focus:ring-2 focus:ring-cam outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Đề bài viết (tùy chọn) - học sinh sẽ gõ bài và nộp, giáo viên chấm tay */}
        <div>
          <label className="block text-xs font-bold text-vutruNhat dark:text-night-muted uppercase tracking-wider mb-1">
            ✍️ Đề bài viết (Tùy chọn)
          </label>
          <textarea
            rows={3}
            placeholder="VD: Viết đoạn văn (150-200 từ) trình bày quan điểm của em về..."
            value={writingPrompt}
            onChange={(e) => setWritingPrompt(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-night-border bg-white dark:bg-night-surface text-xs text-vutru dark:text-night-text focus:ring-2 focus:ring-cam outline-none"
          />
          <p className="text-[10px] text-vutruNhat dark:text-night-muted mt-1">
            Nếu điền, học sinh sẽ thấy khung soạn bài ngay trong trang tài liệu để gõ và nộp bài. Bạn tự chấm điểm + nhận xét thủ công, không dùng AI.
          </p>
        </div>

        {/* Yêu cầu cần đạt & Thẻ tag */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-vutruNhat dark:text-night-muted uppercase tracking-wider mb-1">
              Yêu cầu cần đạt (Mục tiêu học tập)
            </label>
            <textarea
              rows={2}
              placeholder="- Nắm vững công thức...&#10;- Giải quyết bài toán thực tế..."
              value={learningOutcomes}
              onChange={(e) => setLearningOutcomes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-night-border bg-white dark:bg-night-surface text-xs text-vutru dark:text-night-text focus:ring-2 focus:ring-cam outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-vutruNhat dark:text-night-muted uppercase tracking-wider mb-1">
              Thẻ từ khóa / Tags
            </label>
            <input
              type="text"
              placeholder="#toan12 #tsa #vector #onthi"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-night-border bg-white dark:bg-night-surface text-xs text-vutru dark:text-night-text focus:ring-2 focus:ring-cam outline-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-night-border">
          <Button variant="ghost" type="button" onClick={onClose} disabled={submitting}>
            Hủy
          </Button>
          <Button variant="primary" type="submit" isLoading={submitting || uploadingFile}>
            Đăng vào Kho học liệu
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default UploadResourceModal;
