import React, { useState, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { resourceApi, ContentResource, ResourceSubmission } from '../../services/resourceApi';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { 
  ArrowLeft, Heart, Bookmark, Share2, QrCode, Play, Pause, RotateCcw, RotateCw, 
  Volume2, VolumeX, Eye, User, Calendar, CheckCircle2, 
  HelpCircle, ExternalLink, GraduationCap, Copy, Sparkles, Video, FileText, Music, Presentation, ClipboardList, ShieldAlert, PenLine
} from 'lucide-react';
import { getSubjectLabel, getGradeLabel } from './UploadResourceModal';

const ResourceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isTeacher, isAdmin, isTeachingAssistant, isOffice } = useAuth();
  const toast = useToast();

  const [resource, setResource] = useState<ContentResource | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  // Audio Player state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Attached Exam state (for interactive listening quiz)
  const [attachedExamData, setAttachedExamData] = useState<any | null>(null);
  const [loadingExam, setLoadingExam] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);

  // Writing prompt submission state
  const [mySubmission, setMySubmission] = useState<ResourceSubmission | null>(null);
  const [writingDraft, setWritingDraft] = useState('');
  const [submittingWriting, setSubmittingWriting] = useState(false);
  const [allSubmissions, setAllSubmissions] = useState<ResourceSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [gradeScore, setGradeScore] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [savingGrade, setSavingGrade] = useState(false);

  useEffect(() => {
    if (id) {
      loadResource(id);
    }
  }, [id]);

  const loadResource = async (resId: string) => {
    setLoading(true);
    try {
      const res = await resourceApi.getResourceById(resId);
      setResource(res.data);

      // If audio has an attached exam, fetch its preview
      if (res.data.attachedExamId) {
        fetchAttachedExam(res.data.attachedExamId, resId);
      }

      if (res.data.writingPrompt) {
        loadWritingData(resId, res.data);
      }
    } catch {
      toast.error('Không thể tải thông tin học liệu');
    } finally {
      setLoading(false);
    }
  };

  const canGradeResource = (res: ContentResource) => {
    if (!user) return false;
    if (isAdmin || isOffice) return true;
    return res.uploaderId === user.id;
  };

  const loadWritingData = async (resId: string, res: ContentResource) => {
    if (!user) return;
    try {
      const mine = await resourceApi.getMySubmission(resId);
      setMySubmission(mine.data || null);
      if (mine.data) setWritingDraft(mine.data.content);
    } catch {
      // No submission yet - non-critical
    }
    if (canGradeResource(res)) {
      setLoadingSubmissions(true);
      try {
        const subs = await resourceApi.getSubmissions(resId);
        setAllSubmissions(subs.data || []);
      } catch {
        // Non-critical
      } finally {
        setLoadingSubmissions(false);
      }
    }
  };

  const handleSubmitWriting = async () => {
    if (!id || !writingDraft.trim()) return;
    setSubmittingWriting(true);
    try {
      const res = await resourceApi.submitWriting(id, writingDraft.trim());
      setMySubmission(res.data);
      toast.success('Đã nộp bài viết thành công!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể nộp bài viết');
    } finally {
      setSubmittingWriting(false);
    }
  };

  const handleStartGrading = (sub: ResourceSubmission) => {
    setGradingId(sub.id);
    setGradeScore(sub.score != null ? String(sub.score) : '');
    setGradeFeedback(sub.feedback || '');
  };

  const handleSaveGrade = async () => {
    if (!gradingId) return;
    const scoreNum = parseFloat(gradeScore);
    if (isNaN(scoreNum)) {
      toast.error('Vui lòng nhập điểm hợp lệ');
      return;
    }
    setSavingGrade(true);
    try {
      const res = await resourceApi.gradeSubmission(gradingId, scoreNum, gradeFeedback.trim() || undefined);
      setAllSubmissions((prev) => prev.map((s) => (s.id === gradingId ? res.data : s)));
      setGradingId(null);
      toast.success('Đã lưu điểm và nhận xét!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể lưu điểm');
    } finally {
      setSavingGrade(false);
    }
  };

  const fetchAttachedExam = async (examId: string, resourceId: string) => {
    setLoadingExam(true);
    try {
      const res = await api.get(`/exams/${examId}`, { params: { libraryResourceId: resourceId } });
      setAttachedExamData(res.data);
    } catch {
      // Non-critical
    } finally {
      setLoadingExam(false);
    }
  };

  const handleLike = async () => {
    if (!resource) return;
    if (!user) {
      toast.warning('Vui lòng đăng nhập để thích tài liệu');
      return;
    }
    try {
      const res = await resourceApi.toggleLike(resource.id);
      const isLiked = res.data.liked;
      setResource((prev) =>
        prev
          ? {
              ...prev,
              isLiked,
              likeCount: prev.likeCount + (isLiked ? 1 : -1),
            }
          : null
      );
      if (isLiked) toast.success('Đã thích tài liệu');
    } catch {
      toast.error('Không thể thực hiện thao tác');
    }
  };

  const handleToggleBookmark = async () => {
    if (!resource) return;
    if (!user) {
      toast.warning('Vui lòng đăng nhập để lưu tài liệu');
      return;
    }
    try {
      const res = await resourceApi.toggleBookmark(resource.id);
      const isBookmarked = res.data.bookmarked;
      setResource((prev) =>
        prev
          ? {
              ...prev,
              isBookmarked,
              bookmarkCount: prev.bookmarkCount + (isBookmarked ? 1 : -1),
            }
          : null
      );
      if (isBookmarked) {
        toast.success('Đã lưu tài liệu vào kho của bạn!');
      } else {
        toast.info('Đã bỏ lưu tài liệu');
      }
    } catch {
      toast.error('Không thể thực hiện thao tác');
    }
  };

  const handleShareCopy = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Đã sao chép liên kết chia sẻ!');
  };

  // Audio Handlers
  const togglePlayAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const skipAudio = (seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
  };

  const changePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Extract YouTube embed URL
  const getYouTubeEmbedUrl = (url?: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-gray-400">
        <div className="w-10 h-10 border-3 border-cam border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium">Đang tải học liệu...</p>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="text-center py-24 bg-white dark:bg-night-surface rounded-3xl border border-gray-100 dark:border-night-border">
        <ShieldAlert size={48} className="mx-auto text-amber-500 mb-3" />
        <h2 className="text-xl font-bold text-vutru dark:text-night-text mb-2">Không tìm thấy tài nguyên</h2>
        <p className="text-sm text-vutruNhat dark:text-night-muted mb-6">Tài liệu này có thể đã bị xóa hoặc không tồn tại.</p>
        <button onClick={() => navigate('/library')} className="btn btn-chinh">
          Quay lại Thư viện
        </button>
      </div>
    );
  }

  const embedYouTube = getYouTubeEmbedUrl(resource.externalUrl);
  const shareUrl = window.location.href;
  const isTeacherOrStaff = isTeacher || isAdmin || isTeachingAssistant || isOffice || 
    ['TEACHER', 'TEACHING_ASSISTANT', 'ADMIN', 'OFFICE', 'STAFF', 'ROLE_TEACHER', 'ROLE_ADMIN', 'ROLE_TEACHING_ASSISTANT', 'ROLE_OFFICE', 'ROLE_STAFF'].includes(user?.role || '');

  return (
    <div className="animate-fade-in pb-12">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <button
          onClick={() => navigate('/library')}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-vutruNhat dark:text-night-muted hover:text-cam transition-colors"
        >
          <ArrowLeft size={16} /> Quay lại Kho học liệu
        </button>

        <div className="flex items-center gap-2">
          {isTeacherOrStaff && (
            <Link
              to="/assignments"
              className="btn btn-phu !py-1.5 !px-3 text-xs font-bold flex items-center gap-1.5"
            >
              <GraduationCap size={14} className="text-cam" /> Giao cho lớp học
            </Link>
          )}
        </div>
      </div>

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ══════════════════════════════════════════════════════════════════
            LEFT COLUMN (4 cols): Information, Metadata & Actions
        ══════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-night-surface rounded-3xl border border-gray-100 dark:border-night-border p-5 sm:p-6 shadow-soft space-y-5">
            {/* Header: Title & Subject */}
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-cam/10 text-cam border border-cam/20">
                  {getGradeLabel(resource.grade)} · {getSubjectLabel(resource.subject)}
                </span>
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
                  {resource.resourceType === 'VIDEO' ? '🎥 Video bài giảng' :
                   resource.resourceType === 'AUDIO' ? '🎧 File nghe & đề' :
                   resource.resourceType === 'EXAM' ? '📝 Đề thi' :
                   resource.resourceType === 'SLIDE' ? '📊 Slide bài giảng' : '📖 Tài liệu tham khảo'}
                </span>
              </div>

              <h1 className="text-base sm:text-lg font-heading font-bold text-vutru dark:text-night-text leading-snug">
                {resource.title}
              </h1>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-night-border">

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleLike}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    resource.isLiked
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 text-rose-600'
                      : 'border-gray-200 dark:border-night-border hover:bg-gray-50 text-vutru dark:text-night-text'
                  }`}
                >
                  <Heart size={15} className={resource.isLiked ? 'fill-rose-500 text-rose-500' : ''} />
                  <span>{resource.isLiked ? 'Đã thích' : 'Thích'} ({resource.likeCount})</span>
                </button>

                <button
                  onClick={handleToggleBookmark}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    resource.isBookmarked
                      ? 'bg-cam/10 border-cam/30 text-cam'
                      : 'border-gray-200 dark:border-night-border hover:bg-gray-50 text-vutru dark:text-night-text'
                  }`}
                >
                  <Bookmark size={15} className={resource.isBookmarked ? 'fill-cam text-cam' : ''} />
                  <span>{resource.isBookmarked ? 'Đã lưu' : 'Lưu kho'} ({resource.bookmarkCount})</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleShareCopy}
                  className="p-2 rounded-xl border border-gray-200 dark:border-night-border text-xs font-semibold text-vutruNhat hover:text-vutru dark:hover:text-night-text flex items-center justify-center gap-1.5"
                >
                  <Copy size={13} /> Copy link
                </button>
                <button
                  onClick={() => setQrModalOpen(true)}
                  className="p-2 rounded-xl border border-gray-200 dark:border-night-border text-xs font-semibold text-vutruNhat hover:text-vutru dark:hover:text-night-text flex items-center justify-center gap-1.5"
                >
                  <QrCode size={13} /> Mã QR
                </button>
              </div>
            </div>

            {/* Metadata Information List */}
            <div className="space-y-2.5 pt-2 border-t border-gray-100 dark:border-night-border text-xs">
              <div className="flex items-center justify-between text-vutruNhat dark:text-night-muted">
                <span className="flex items-center gap-1.5">
                  <User size={13} className="text-cam" /> Người soạn / Giáo viên:
                </span>
                <span className="font-bold text-vutru dark:text-night-text">{resource.authorName}</span>
              </div>

              {resource.uploaderName && resource.uploaderName !== resource.authorName && (
                <div className="flex items-center justify-between text-vutruNhat dark:text-night-muted">
                  <span className="flex items-center gap-1.5">
                    <Share2 size={13} /> Người đăng tải:
                  </span>
                  <span className="font-semibold text-vutru dark:text-night-text">{resource.uploaderName}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-vutruNhat dark:text-night-muted">
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} /> Ngày đăng:
                </span>
                <span className="font-medium">{new Date(resource.createdAt).toLocaleDateString('vi-VN')}</span>
              </div>

              <div className="flex items-center justify-between text-vutruNhat dark:text-night-muted">
                <span className="flex items-center gap-1.5">
                  <Eye size={13} /> Lượt xem:
                </span>
                <span className="font-bold text-vutru dark:text-night-text">{resource.viewCount.toLocaleString()}</span>
              </div>
            </div>

            {/* Learning Outcomes (Yêu cầu cần đạt) */}
            {resource.learningOutcomes && (
              <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 space-y-1.5">
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-cam" /> Yêu cầu cần đạt
                </h4>
                <p className="text-xs text-amber-950 dark:text-amber-200/90 whitespace-pre-line leading-relaxed">
                  {resource.learningOutcomes}
                </p>
              </div>
            )}

            {/* Description & Tags */}
            {resource.description && (
              <div className="text-xs text-vutruNhat dark:text-night-muted whitespace-pre-line leading-relaxed">
                {resource.description}
              </div>
            )}

            {resource.tags && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {resource.tags.split(' ').map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 dark:bg-night-elevated text-vutruNhat dark:text-night-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>


        {/* ══════════════════════════════════════════════════════════════════
            RIGHT COLUMN (8 cols): Adaptive Dynamic Player / Viewer
        ══════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-8 space-y-4">
          {/* 1. VIDEO PLAYER (YouTube Embed / MP4) */}
          {resource.resourceType === 'VIDEO' && (
            <div className="bg-black rounded-3xl overflow-hidden shadow-soft border border-gray-200 dark:border-night-border aspect-video">
              {embedYouTube ? (
                <iframe
                  src={embedYouTube}
                  title={resource.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              ) : resource.fileUrl ? (
                <video src={resource.fileUrl} controls className="w-full h-full" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white/70">
                  <Video size={48} className="mb-2" />
                  <p className="text-sm">Video trực tuyến</p>
                </div>
              )}
            </div>
          )}

          {/* 2. AUDIO PLAYER WITH INTERACTIVE EXAM (Bài nghe & Đề thi đính kèm) */}
          {resource.resourceType === 'AUDIO' && (
            <div className="space-y-4">
              {/* Sticky Header Audio Player */}
              <div className="sticky top-4 z-20 bg-white/95 dark:bg-night-surface/95 backdrop-blur-md rounded-3xl border border-cam/30 shadow-soft p-4 sm:p-5">
                <audio
                  ref={audioRef}
                  src={resource.fileUrl || resource.externalUrl}
                  onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
                  onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
                  onEnded={() => setIsPlaying(false)}
                />

                <div className="flex flex-col gap-3">
                  {/* Top: Title & Controls */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-cam text-white flex items-center justify-center shrink-0">
                        <Music size={18} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs sm:text-sm font-bold text-vutru dark:text-night-text truncate">
                          {resource.title}
                        </h3>
                        <p className="text-[11px] text-vutruNhat dark:text-night-muted">
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </p>
                      </div>
                    </div>

                    {/* Speed Selector Buttons */}
                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-night-elevated p-1 rounded-xl shrink-0">
                      {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => changePlaybackRate(rate)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold transition-all ${
                            playbackRate === rate
                              ? 'bg-cam text-white shadow-2xs'
                              : 'text-vutruNhat dark:text-night-muted hover:text-vutru'
                          }`}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Waveform / Timeline Slider */}
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={duration || 100}
                      value={currentTime}
                      onChange={handleSeek}
                      className="w-full h-1.5 bg-gray-200 dark:bg-night-elevated rounded-lg appearance-none cursor-pointer accent-cam"
                    />
                  </div>

                  {/* Bottom Buttons: Tua 5s, Play, Mute */}
                  <div className="flex items-center justify-center gap-4">
                    <button
                      type="button"
                      onClick={() => skipAudio(-5)}
                      className="p-2 rounded-xl text-vutruNhat hover:text-vutru dark:hover:text-night-text transition-all hover:bg-gray-100 dark:hover:bg-night-elevated flex items-center gap-1 text-xs font-bold"
                      title="Lùi 5 giây"
                    >
                      <RotateCcw size={16} /> -5s
                    </button>

                    <button
                      type="button"
                      onClick={togglePlayAudio}
                      className="w-11 h-11 rounded-full bg-cam hover:bg-camDam text-white flex items-center justify-center shadow-soft active:scale-95 transition-all"
                    >
                      {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => skipAudio(5)}
                      className="p-2 rounded-xl text-vutruNhat hover:text-vutru dark:hover:text-night-text transition-all hover:bg-gray-100 dark:hover:bg-night-elevated flex items-center gap-1 text-xs font-bold"
                      title="Tiến 5 giây"
                    >
                      +5s <RotateCw size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Interactive Exam Attached Section (Đề thi đi kèm bài nghe) */}
              {attachedExamData && (
                <div className="bg-white dark:bg-night-surface rounded-3xl border border-gray-100 dark:border-night-border p-5 sm:p-6 shadow-soft space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-night-border">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                        <ClipboardList size={14} />
                      </div>
                      <h3 className="font-heading text-sm sm:text-base font-bold text-vutru dark:text-night-text">
                        Phiếu làm bài trắc nghiệm kèm theo
                      </h3>
                    </div>

                    <Link
                      to={`/exams/take/${attachedExamData.id}?libraryResourceId=${resource.id}`}
                      className="text-xs font-bold text-cam hover:text-camDam flex items-center gap-1"
                    >
                      Làm ở chế độ thi đầy đủ <ExternalLink size={12} />
                    </Link>
                  </div>

                  {attachedExamData.examType === 'ANSWER_SHEET' ? (
                    // Đề dạng "Phiếu trả lời": nội dung câu hỏi thật nằm trong file PDF/audio đính kèm,
                    // không phải trong database - nen khong the xem truoc tung cau o day.
                    <div className="text-center py-6 px-4 rounded-2xl bg-gray-50/60 dark:bg-night-elevated/40 border border-gray-100 dark:border-night-border space-y-2">
                      <p className="text-xs sm:text-sm text-vutruNhat dark:text-night-muted">
                        Đề này có <strong className="text-vutru dark:text-night-text">{attachedExamData.questions?.length || 0} câu</strong>, nội dung đề nằm trong file đính kèm ở trên. Vui lòng làm bài ở chế độ thi đầy đủ để xem đề và tô đáp án.
                      </p>
                      <Link
                        to={`/exams/take/${attachedExamData.id}?libraryResourceId=${resource.id}`}
                        className="btn btn-chinh !inline-flex text-xs font-bold items-center gap-1.5 mt-1"
                      >
                        <Play size={13} /> Làm bài ngay
                      </Link>
                    </div>
                  ) : (
                    <>
                      {/* Question items list */}
                      <div className="space-y-4">
                        {attachedExamData.questions?.map((q: any, qIndex: number) => (
                          <div
                            key={q.id || qIndex}
                            className="p-4 rounded-2xl bg-gray-50/60 dark:bg-night-elevated/40 border border-gray-100 dark:border-night-border space-y-3"
                          >
                            <div className="flex items-start gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white dark:bg-cam text-xs font-bold shrink-0">
                                Câu {qIndex + 1}
                              </span>
                              <div
                                className="text-xs sm:text-sm font-semibold text-vutru dark:text-night-text tiptap-content"
                                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(q.content || q.questionText || '') }}
                              />
                            </div>

                            {q.questionType === 'SHORT_ANSWER' || q.questionType === 'ESSAY' ? (
                              <div className="pt-1">
                                <input
                                  type="text"
                                  disabled
                                  placeholder="Câu hỏi tự luận / trả lời ngắn"
                                  className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-night-border bg-white dark:bg-night-surface text-xs text-vutruNhat dark:text-night-muted"
                                />
                                {showResult && (
                                  <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-700 text-xs font-bold">
                                    Đáp án đúng: {q.options?.find((o: any) => o.isCorrect)?.content || q.correctAnswer || '—'}
                                  </div>
                                )}
                              </div>
                            ) : (
                              /* Options */
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                {q.options?.map((opt: any, optIndex: number) => {
                                  const optionLabel = String.fromCharCode(65 + optIndex);
                                  const isSelected = selectedAnswers[q.id] === optionLabel || selectedAnswers[q.id] === opt.id;
                                  const isCorrect = opt.isCorrect || q.correctAnswer === optionLabel;

                                  return (
                                    <button
                                      key={opt.id || optIndex}
                                      type="button"
                                      onClick={() => setSelectedAnswers((prev) => ({ ...prev, [q.id]: optionLabel }))}
                                      className={`p-2.5 rounded-xl border text-left text-xs font-medium flex items-center gap-2.5 transition-all ${
                                        showResult && isCorrect
                                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-700 font-bold'
                                          : showResult && isSelected && !isCorrect
                                          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-700'
                                          : isSelected
                                          ? 'bg-cam/10 border-cam text-cam font-bold'
                                          : 'bg-white dark:bg-night-surface border-gray-200 dark:border-night-border text-vutru dark:text-night-text hover:border-gray-300'
                                      }`}
                                    >
                                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                        isSelected ? 'bg-cam text-white' : 'bg-gray-100 dark:bg-night-elevated text-gray-500'
                                      }`}>
                                        {optionLabel}
                                      </span>
                                      <span className="truncate tiptap-content" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(opt.content || opt.text || '') }} />
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Submit / Check button */}
                      <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-night-border">
                        <button
                          type="button"
                          onClick={() => setShowResult(!showResult)}
                          className="btn btn-chinh text-xs font-bold"
                        >
                          {showResult ? 'Ẩn đáp án' : 'Kiểm tra kết quả'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Audio Transcript (if available) */}
              {resource.audioTranscript && (
                <div className="bg-white dark:bg-night-surface rounded-3xl border border-gray-100 dark:border-night-border p-5 sm:p-6 shadow-soft space-y-3">
                  <h4 className="text-xs font-bold text-vutru dark:text-night-text uppercase tracking-wider">
                    📜 Lời thoại bài nghe (Transcript)
                  </h4>
                  <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-night-elevated text-xs text-vutruNhat dark:text-night-muted whitespace-pre-line leading-relaxed">
                    {resource.audioTranscript}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. EXAM PRACTICE VIEWER (Đề thi, bài tập tự do không deadline) */}
          {resource.resourceType === 'EXAM' && (
            <div className="space-y-4">
              {attachedExamData ? (
                <div className="bg-white dark:bg-night-surface rounded-3xl border border-gray-100 dark:border-night-border p-5 sm:p-6 shadow-soft space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 dark:border-night-border gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                        <ClipboardList size={18} />
                      </div>
                      <div>
                        <h3 className="font-heading text-sm sm:text-base font-bold text-vutru dark:text-night-text">
                          Phiếu làm bài trắc nghiệm tự luyện
                        </h3>
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <Sparkles size={12} /> Đề luyện tập mở · Tự do ôn tập & không giới hạn thời gian
                        </p>
                      </div>
                    </div>

                    <Link
                      to={`/exams/take/${attachedExamData.id}?libraryResourceId=${resource.id}`}
                      className="btn btn-chinh !py-1.5 !px-3 text-xs font-bold flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <Play size={13} /> Làm ở chế độ thi có bấm giờ
                    </Link>
                  </div>

                  {attachedExamData.examType === 'ANSWER_SHEET' ? (
                    // Đề dạng "Phiếu trả lời": nội dung câu hỏi thật nằm trong file PDF/audio đính kèm,
                    // không phải trong database - nen khong the xem truoc tung cau o day.
                    <div className="text-center py-6 px-4 rounded-2xl bg-gray-50/60 dark:bg-night-elevated/40 border border-gray-100 dark:border-night-border space-y-2">
                      <p className="text-xs sm:text-sm text-vutruNhat dark:text-night-muted">
                        Đề này có <strong className="text-vutru dark:text-night-text">{attachedExamData.questions?.length || 0} câu</strong>, nội dung đề nằm trong file đính kèm ở trên. Vui lòng làm bài ở chế độ thi đầy đủ để xem đề và tô đáp án.
                      </p>
                      <Link
                        to={`/exams/take/${attachedExamData.id}?libraryResourceId=${resource.id}`}
                        className="btn btn-chinh !inline-flex text-xs font-bold items-center gap-1.5 mt-1"
                      >
                        <Play size={13} /> Làm bài ngay
                      </Link>
                    </div>
                  ) : (
                    <>
                      {/* Questions list */}
                      <div className="space-y-4">
                        {attachedExamData.questions?.map((q: any, qIndex: number) => (
                          <div
                            key={q.id || qIndex}
                            className="p-4 rounded-2xl bg-gray-50/60 dark:bg-night-elevated/40 border border-gray-100 dark:border-night-border space-y-3"
                          >
                            <div className="flex items-start gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white dark:bg-cam text-xs font-bold shrink-0">
                                Câu {qIndex + 1}
                              </span>
                              <div
                                className="text-xs sm:text-sm font-semibold text-vutru dark:text-night-text tiptap-content"
                                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(q.content || q.questionText || '') }}
                              />
                            </div>

                            {q.questionType === 'SHORT_ANSWER' || q.questionType === 'ESSAY' ? (
                              <div className="pt-1">
                                <input
                                  type="text"
                                  disabled
                                  placeholder="Câu hỏi tự luận / trả lời ngắn"
                                  className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-night-border bg-white dark:bg-night-surface text-xs text-vutruNhat dark:text-night-muted"
                                />
                                {showResult && (
                                  <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-700 text-xs font-bold">
                                    Đáp án đúng: {q.options?.find((o: any) => o.isCorrect)?.content || q.correctAnswer || '—'}
                                  </div>
                                )}
                              </div>
                            ) : (
                              /* Options */
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                {q.options?.map((opt: any, optIndex: number) => {
                                  const optionLabel = String.fromCharCode(65 + optIndex);
                                  const isSelected = selectedAnswers[q.id] === optionLabel || selectedAnswers[q.id] === opt.id;
                                  const isCorrect = opt.isCorrect || q.correctAnswer === optionLabel;

                                  return (
                                    <button
                                      key={opt.id || optIndex}
                                      type="button"
                                      onClick={() => setSelectedAnswers((prev) => ({ ...prev, [q.id]: optionLabel }))}
                                      className={`p-2.5 rounded-xl border text-left text-xs font-medium flex items-center gap-2.5 transition-all ${
                                        showResult && isCorrect
                                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-700 font-bold'
                                          : showResult && isSelected && !isCorrect
                                          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-700'
                                          : isSelected
                                          ? 'bg-cam/10 border-cam text-cam font-bold'
                                          : 'bg-white dark:bg-night-surface border-gray-200 dark:border-night-border text-vutru dark:text-night-text hover:border-gray-300'
                                      }`}
                                    >
                                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                        isSelected ? 'bg-cam text-white' : 'bg-gray-100 dark:bg-night-elevated text-gray-500'
                                      }`}>
                                        {optionLabel}
                                      </span>
                                      <span className="truncate tiptap-content" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(opt.content || opt.text || '') }} />
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Submit / Check button */}
                      <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-night-border">
                        <button
                          type="button"
                          onClick={() => setShowResult(!showResult)}
                          className="btn btn-chinh text-xs font-bold"
                        >
                          {showResult ? 'Ẩn đáp án' : 'Kiểm tra đáp án & Giải thích'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : resource.fileUrl && resource.fileUrl.endsWith('.pdf') ? (
                <div className="w-full h-[700px] rounded-2xl overflow-hidden border border-gray-200 dark:border-night-border bg-white dark:bg-night-surface">
                  <iframe
                    src={`${resource.fileUrl}#toolbar=0`}
                    title={resource.title}
                    className="w-full h-full border-0"
                  />
                </div>
              ) : (
                <div className="p-12 text-center bg-white dark:bg-night-surface rounded-3xl border border-dashed border-gray-200 dark:border-night-border">
                  <ClipboardList size={40} className="mx-auto text-amber-500 mb-2" />
                  <p className="text-sm font-semibold text-vutru dark:text-night-text">Đề thi ôn tập tự do</p>
                  <p className="text-xs text-vutruNhat dark:text-night-muted mt-1">Đề thi đã được đăng tải vào Kho học liệu</p>
                </div>
              )}
            </div>
          )}

          {/* 4. DOCUMENT / PDF / SLIDE VIEWER */}
          {['DOCUMENT', 'SLIDE'].includes(resource.resourceType) && (
            <div className="bg-white dark:bg-night-surface rounded-3xl border border-gray-100 dark:border-night-border p-5 sm:p-6 shadow-soft space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-night-border">
                <h3 className="font-heading text-sm sm:text-base font-bold text-vutru dark:text-night-text flex items-center gap-2">
                  <FileText size={18} className="text-cam" /> Trình xem tài liệu trực tuyến
                </h3>
              </div>

              {resource.fileUrl && resource.fileUrl.endsWith('.pdf') ? (
                <div className="w-full h-[700px] rounded-2xl overflow-hidden border border-gray-200 dark:border-night-border">
                  <iframe
                    src={`${resource.fileUrl}#toolbar=0`}
                    title={resource.title}
                    className="w-full h-full border-0"
                  />
                </div>
              ) : resource.externalUrl ? (
                <div className="w-full h-[600px] rounded-2xl overflow-hidden border border-gray-200 dark:border-night-border">
                  <iframe
                    src={resource.externalUrl}
                    title={resource.title}
                    className="w-full h-full border-0"
                  />
                </div>
              ) : (
                <div className="p-12 text-center bg-gray-50 dark:bg-night-elevated rounded-2xl border border-dashed border-gray-200 dark:border-night-border">
                  <FileText size={40} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm font-semibold text-vutru dark:text-night-text">Tài liệu đã được tải lên</p>
                  <p className="text-xs text-vutruNhat dark:text-night-muted mt-1">Định dạng tệp: {resource.fileFormat || 'Tài liệu'}</p>
                </div>
              )}
            </div>
          )}

          {/* 5. WRITING PROMPT - học sinh gõ bài viết và nộp, giáo viên chấm tay */}
          {resource.writingPrompt && (
            <div className="bg-white dark:bg-night-surface rounded-3xl border border-gray-100 dark:border-night-border p-5 sm:p-6 shadow-soft space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-night-border">
                <div className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0">
                  <PenLine size={18} />
                </div>
                <h3 className="font-heading text-sm sm:text-base font-bold text-vutru dark:text-night-text">
                  Đề bài viết
                </h3>
              </div>

              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-night-elevated text-sm text-vutru dark:text-night-text whitespace-pre-line leading-relaxed">
                {resource.writingPrompt}
              </div>

              {!canGradeResource(resource) && (
                <div className="space-y-3">
                  <textarea
                    rows={8}
                    placeholder="Gõ bài viết của bạn vào đây..."
                    value={writingDraft}
                    onChange={(e) => setWritingDraft(e.target.value)}
                    disabled={submittingWriting}
                    className="w-full p-3.5 rounded-2xl border border-gray-200 dark:border-night-border bg-white dark:bg-night-surface text-sm text-vutru dark:text-night-text focus:ring-2 focus:ring-cam outline-none resize-y"
                  />

                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs">
                      {mySubmission?.status === 'GRADED' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold">
                          <CheckCircle2 size={12} /> Đã chấm: {mySubmission.score} điểm
                        </span>
                      ) : mySubmission ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-bold">
                          Đã nộp · Chờ chấm
                        </span>
                      ) : (
                        <span className="text-vutruNhat dark:text-night-muted">Chưa nộp bài</span>
                      )}
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSubmitWriting}
                      isLoading={submittingWriting}
                      disabled={!writingDraft.trim()}
                    >
                      {mySubmission ? 'Nộp lại' : 'Nộp bài'}
                    </Button>
                  </div>

                  {mySubmission?.status === 'GRADED' && mySubmission.feedback && (
                    <div className="p-3.5 rounded-2xl bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900 text-sm text-vutru dark:text-night-text">
                      <p className="text-xs font-bold text-violet-600 dark:text-violet-400 mb-1">Nhận xét của giáo viên</p>
                      {mySubmission.feedback}
                    </div>
                  )}
                </div>
              )}

              {canGradeResource(resource) && (
                <div className="space-y-3 pt-1">
                  <h4 className="text-xs font-bold text-vutruNhat dark:text-night-muted uppercase tracking-wider">
                    Bài nộp của học sinh ({allSubmissions.length})
                  </h4>
                  {loadingSubmissions ? (
                    <p className="text-xs text-vutruNhat dark:text-night-muted">Đang tải...</p>
                  ) : allSubmissions.length === 0 ? (
                    <p className="text-xs text-vutruNhat dark:text-night-muted">Chưa có học sinh nào nộp bài.</p>
                  ) : (
                    allSubmissions.map((sub) => (
                      <div key={sub.id} className="p-4 rounded-2xl bg-gray-50/60 dark:bg-night-elevated/40 border border-gray-100 dark:border-night-border space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-vutru dark:text-night-text">{sub.studentName}</span>
                            {sub.status === 'GRADED' ? (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                                Đã chấm: {sub.score}đ
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 text-[10px] font-bold">
                                Chờ chấm
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-vutruNhat dark:text-night-muted">
                            {new Date(sub.submittedAt).toLocaleString('vi-VN')}
                          </span>
                        </div>

                        <div className="text-sm text-vutru dark:text-night-text whitespace-pre-line p-3 rounded-xl bg-white dark:bg-night-surface border border-gray-100 dark:border-night-border">
                          {sub.content}
                        </div>

                        {gradingId === sub.id ? (
                          <div className="space-y-2 pt-1">
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                step="0.1"
                                placeholder="Điểm"
                                value={gradeScore}
                                onChange={(e) => setGradeScore(e.target.value)}
                                className="w-24 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-night-border bg-white dark:bg-night-surface text-sm text-vutru dark:text-night-text focus:ring-2 focus:ring-cam outline-none"
                              />
                              <input
                                type="text"
                                placeholder="Nhận xét (tùy chọn)"
                                value={gradeFeedback}
                                onChange={(e) => setGradeFeedback(e.target.value)}
                                className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-night-border bg-white dark:bg-night-surface text-sm text-vutru dark:text-night-text focus:ring-2 focus:ring-cam outline-none"
                              />
                            </div>
                            <div className="flex items-center gap-2 justify-end">
                              <Button variant="ghost" size="sm" onClick={() => setGradingId(null)} disabled={savingGrade}>
                                Hủy
                              </Button>
                              <Button variant="primary" size="sm" onClick={handleSaveGrade} isLoading={savingGrade}>
                                Lưu điểm
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-end">
                            <Button variant="outline" size="sm" onClick={() => handleStartGrading(sub)}>
                              {sub.status === 'GRADED' ? 'Sửa điểm' : 'Chấm bài'}
                            </Button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* QR Code Share Modal */}
      <Modal isOpen={qrModalOpen} onClose={() => setQrModalOpen(false)} title="Mã QR chia sẻ tài liệu" maxWidth="sm">
        <div className="text-center space-y-4 py-2">
          <div className="p-4 bg-white rounded-2xl border border-gray-200 inline-block shadow-xs">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`}
              alt="QR Code"
              className="w-48 h-48 mx-auto"
            />
          </div>
          <p className="text-xs text-vutruNhat dark:text-night-muted">
            Quét mã để mở và xem học liệu này trên thiết bị di động
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default ResourceDetailPage;
