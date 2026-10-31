import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import classService, { Classroom, ClassPost, ClassPostComment } from '../../services/class.service';
import { useAuth } from '../../context/AuthContext';
import { assignmentApi, Assignment } from '../../services/assignmentApi';
import { classExamApi } from '../../services/classExamApi';
import { Calendar, Clock, ChevronRight } from 'lucide-react';

type UpcomingItem = {
  id: string;
  title: string;
  dueDate: string;
  type: 'ASSIGNMENT' | 'EXAM';
  stats?: { missing: number; completed: number };
};
import { Link } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { uploadFile } from '../../services/api';
import { Paperclip, X, File as FileIcon, Image as ImageIcon, Smile, MapPin, UserPlus, MoreHorizontal, ThumbsUp, MessageCircle, Share2, Globe, ShieldCheck, Star, Edit3, Copy, Upload, Check, Trash2, History, Pencil, BellRing, Flame, Sparkles, CheckCircle2, FileCheck, ArrowRight } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import { useToast } from '../../context/ToastContext';
import UserAvatar from '../../components/common/UserAvatar';
import DeadlineBadge from '../../components/common/DeadlineBadge';
import { CLASS_COVER_PRESETS, getDefaultCoverForSubject } from '../../utils/classThemes';
import { detectSubject } from '../../utils/classTaxonomy';

import Portal from '../../components/ui/Portal';
interface ClassStreamContext {
  classroom: Classroom;
  isTeacher: boolean;
}

const ConfirmModal: React.FC<{ isOpen: boolean; message: string; onConfirm: () => void; onCancel: () => void }> = ({ isOpen, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="Xác nhận">
      <div className="p-4 text-center w-80">
        <p className="text-gray-600 mb-6 text-sm">{message}</p>
        <div className="flex justify-center gap-3">
          <button onClick={onCancel} className="btn btn-vien">Hủy</button>
          <button onClick={() => { onConfirm(); onCancel(); }} className="btn bg-red-500 text-white border-b-4 border-red-700 hover:bg-red-400">Xóa</button>
        </div>
      </div>
    </Modal>
  );
};

const getRelativeTimeVn = (dateString: string) => {
  const diff = Date.now() - new Date(dateString).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút`;
  if (hours < 24) return `${hours} giờ`;
  if (days < 7) return `${days} ngày`;
  return new Date(dateString).toLocaleDateString('vi-VN');
};

const CommentItem: React.FC<{
  comment: ClassPostComment;
  classId: string;
  postId: string;
  level?: number;
  onRefresh: () => void;
  onReply: (parentId: string, authorName: string) => void;
}> = ({ comment, classId, postId, level = 0, onRefresh, onReply }) => {
  const { user } = useAuth();
  const isTeacher = useOutletContext<ClassStreamContext>().isTeacher;
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showMenu, setShowMenu] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const isOwner = user?.id === comment.authorId;
  const canEdit = isOwner || user?.role === 'ADMIN';
  const canDelete = isOwner || isTeacher || user?.role === 'ADMIN';

  const handleLike = async () => {
    try {
      await classService.toggleLikeComment(classId, postId, comment.id);
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = async () => {
    if (!editContent.trim()) return;
    try {
      await classService.updatePostComment(classId, postId, comment.id, editContent);
      setIsEditing(false);
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async () => {
    try {
      await classService.deletePostComment(classId, postId, comment.id);
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="mt-3 relative">
      <ConfirmModal 
        isOpen={showConfirmDelete} 
        message="Bạn có chắc chắn muốn xóa bình luận này không?" 
        onConfirm={handleDelete} 
        onCancel={() => setShowConfirmDelete(false)} 
      />
      <div className="flex gap-2 group relative z-10">
        <UserAvatar
          fullName={comment.authorName}
          avatarUrl={comment.authorAvatar}
          size="sm"
          className="w-8 h-8 font-bold shrink-0 text-xs shadow-2xs mt-1"
        />
        <div className="flex flex-col flex-1">
          <div className="flex items-center gap-2">
            {isEditing ? (
              <div className="flex-1">
                <input
                  type="text"
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-cam"
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleEdit();
                    if (e.key === 'Escape') {
                      setIsEditing(false);
                      setEditContent(comment.content);
                    }
                  }}
                />
                <div className="text-[10px] text-gray-400 mt-1">Nhấn Enter để lưu, Esc để hủy</div>
              </div>
            ) : (
              <div className="relative inline-block max-w-[calc(100%-2.5rem)]">
                <div className="bg-gray-100 dark:bg-night-elevated rounded-2xl px-3 py-2 inline-block">
                  <p className="text-[13px] font-bold text-vutru dark:text-night-text leading-tight mb-0.5">{comment.authorName}</p>
                  <p className="text-[14px] text-vutru dark:text-night-text leading-snug break-words">{comment.content}</p>
                </div>
                {comment.likeCount && comment.likeCount > 0 ? (
                  <div className="absolute right-0 bottom-0 translate-x-1/2 translate-y-1/3 bg-white dark:bg-night-surface shadow-sm border border-gray-100 dark:border-night-border rounded-full px-1.5 py-0.5 flex items-center gap-1 text-[11px] text-vutruNhat dark:text-night-muted z-10 font-bold">
                    <div className="bg-blue-600 rounded-full w-3.5 h-3.5 flex items-center justify-center">
                      <ThumbsUp className="w-2 h-2 fill-white text-white" />
                    </div>
                    <span>{comment.likeCount}</span>
                  </div>
                ) : null}
              </div>
            )}

            {/* Menu Button */}
            {!isEditing && (canEdit || canDelete) && (
              <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                    <div className="absolute left-full top-0 ml-1 bg-white border border-gray-100 shadow-lg rounded-lg py-1 w-32 z-20">
                      {canEdit && <button onClick={() => { setIsEditing(true); setShowMenu(false); }} className="w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-gray-50 text-gray-700">Chỉnh sửa</button>}
                      {canDelete && <button onClick={() => { setShowConfirmDelete(true); setShowMenu(false); }} className="w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-gray-50 text-red-600">Xóa</button>}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {!isEditing && (
            <div className="flex items-center gap-3 mt-1 ml-3 text-[12px] font-bold text-vutruNhat">
              <span className="font-normal hover:underline cursor-pointer" title={new Date(comment.createdAt).toLocaleString('vi-VN')}>
                {getRelativeTimeVn(comment.createdAt)}
              </span>
              <button 
                onClick={handleLike} 
                className={`hover:underline ${comment.isLikedByCurrentUser ? 'text-blue-600' : ''}`}
              >
                Thích
              </button>
              <button 
                onClick={() => onReply(comment.id, comment.authorName)}
                className="hover:underline"
              >
                Phản hồi
              </button>
            </div>
          )}
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="relative ml-4 pl-6 mt-1">
          {/* Vertical connecting line */}
          <div className="absolute left-0 top-0 bottom-4 w-[2px] bg-gray-100 dark:bg-night-border" />
          
          {comment.replies.map((reply, idx) => (
            <div key={reply.id} className="relative">
              {/* Curved line connecting to each reply */}
              <div className="absolute -left-6 top-5 w-5 h-6 border-l-[2px] border-b-[2px] border-gray-100 dark:border-night-border rounded-bl-xl" />
              <CommentItem 
                comment={reply} 
                classId={classId} 
                postId={postId} 
                level={level + 1}
                onRefresh={onRefresh}
                onReply={onReply}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const PostComments: React.FC<{ classId: string; postId: string }> = ({ classId, postId }) => {
  const [comments, setComments] = useState<ClassPostComment[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string, name: string } | null>(null);
  const { user } = useAuth();

  const fetchComments = () => {
    classService.getPostComments(classId, postId)
      .then((res) => setComments(res.data || res || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchComments();
  }, [classId, postId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await classService.addPostComment(classId, postId, text.trim(), replyTo?.id);
      setText('');
      setReplyTo(null);
      fetchComments();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-6 pt-4 border-t border-gray-100">
      {loading ? (
        <p className="text-xs text-gray-400">Đang tải bình luận...</p>
      ) : (
        <div className="space-y-1 mb-4">
          {comments.map((c) => (
            <CommentItem 
              key={c.id} 
              comment={c} 
              classId={classId} 
              postId={postId}
              onRefresh={fetchComments}
              onReply={(id, name) => {
                setReplyTo({ id, name });
                const input = document.getElementById(`comment-input-${postId}`);
                if (input) input.focus();
              }}
            />
          ))}
        </div>
      )}
      <div className="mt-2 relative">
        {replyTo && (
          <div className="flex items-center justify-between bg-gray-100 dark:bg-night-elevated rounded-t-xl px-3.5 py-1.5 text-xs text-vutru dark:text-night-text mb-[-1px]">
            <span>Đang trả lời <strong>{replyTo.name}</strong></span>
            <button onClick={() => setReplyTo(null)} className="hover:text-cam">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <form onSubmit={submit} className={`flex gap-3 items-center ${replyTo ? 'bg-white dark:bg-night-surface border border-gray-200 dark:border-night-border rounded-b-xl p-2' : ''}`}>
          {!replyTo && (
            <UserAvatar
              fullName={user?.fullName || ''}
              avatarUrl={user?.avatarUrl}
              size="sm"
              className="w-8 h-8 font-bold shrink-0 text-xs shadow-2xs"
            />
          )}
          <input
            id={`comment-input-${postId}`}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={replyTo ? "Viết câu trả lời..." : "Thêm nhận xét lớp học..."}
            className={`flex-1 text-xs sm:text-sm outline-none transition-all ${
              !replyTo 
                ? 'bg-gray-50 dark:bg-night-elevated border border-gray-200 dark:border-night-border rounded-full px-4 py-2 text-vutru dark:text-night-text focus:border-cam focus:bg-white dark:focus:bg-night-surface' 
                : 'px-2 py-1 bg-transparent text-vutru dark:text-night-text'
            }`}
          />
          <button
            type="submit"
            disabled={!text.trim() || submitting}
            className="text-xs sm:text-sm font-bold text-camDam dark:text-cam disabled:opacity-40 hover:underline px-2"
          >
            Gửi
          </button>
        </form>
      </div>
    </div>
  );
};

const ClassStream: React.FC = () => {
  const { classroom, isTeacher } = useOutletContext<ClassStreamContext>();
  const toast = useToast();
  const [posts, setPosts] = useState<ClassPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [upcomingClasswork, setUpcomingClasswork] = useState<UpcomingItem[]>([]);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);

  // Facebook-style Photo Viewer state
  const [selectedPostForViewer, setSelectedPostForViewer] = useState<ClassPost | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  
  const [isThumbnailModalOpen, setIsThumbnailModalOpen] = useState(false);
  const [thumbnailInput, setThumbnailInput] = useState('');
  const [thumbnailTab, setThumbnailTab] = useState<'presets' | 'upload'>('presets');
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [isSavingThumbnail, setIsSavingThumbnail] = useState(false);
  const thumbnailFileInputRef = React.useRef<HTMLInputElement>(null);

  const [isEditInfoModalOpen, setIsEditInfoModalOpen] = useState(false);
  const [editInfoForm, setEditInfoForm] = useState({ name: '', subject: '', section: '', description: '', room: '' });
  const [isSavingInfo, setIsSavingInfo] = useState(false);

  const handleThumbnailFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Kích thước ảnh quá lớn (Tối đa 10MB)');
      return;
    }

    setIsUploadingThumbnail(true);
    try {
      const res = await uploadFile(file);
      setThumbnailInput(res.fileUrl);
      toast.success('Đã tải ảnh lên thành công!');
    } catch (err) {
      toast.error('Lỗi khi tải ảnh lên');
      console.error(err);
    } finally {
      setIsUploadingThumbnail(false);
      if (thumbnailFileInputRef.current) thumbnailFileInputRef.current.value = '';
    }
  };

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenDropdownId(null);
    };
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const { user } = useAuth();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingFile(true);
    try {
      const res = await uploadFile(file);
      setAttachments(prev => [...prev, res.fileUrl]);
    } catch (err) {
      console.error('Lỗi tải tệp:', err);
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const fetchUpcoming = async () => {
    try {
      const [assignRes, examRes, gradebookRes] = await Promise.all([
        assignmentApi.getAssignmentsByClassroom(classroom.id, 0, 10).catch(() => ({ data: { content: [] } })),
        classExamApi.getClassExams(classroom.id).catch(() => []),
        classService.getGradebook(classroom.id).catch(() => null),
      ]);
      const assigns = (assignRes as any)?.data?.content || (assignRes as any)?.content || [];
      const exams = Array.isArray(examRes) ? examRes : (examRes as any)?.data || [];

      const now = new Date();
      const myStudent = gradebookRes?.students?.find((s: any) => s.studentId === user?.id);

      // Filter for uncompleted items only for students
      const pendingAssigns = assigns.filter((a: any) => {
        if (!a.dueDate || new Date(a.dueDate) <= now) return false;
        if (!isTeacher && myStudent) {
          const sub = myStudent.grades?.[a.id];
          if (sub && (sub.status === 'TURNED_IN' || sub.status === 'GRADED' || sub.score != null)) {
            return false; // Student has already completed/submitted this assignment
          }
        }
        return true;
      });

      const pendingExams = exams.filter((e: any) => {
        const close = e.closeTime || e.examEndTime;
        if (!close || new Date(close) <= now) return false;
        if (!isTeacher && myStudent) {
          const res = myStudent.grades?.[e.examId] || myStudent.grades?.[e.id];
          if (res && (res.status === 'TURNED_IN' || res.status === 'GRADED' || res.score != null)) {
            return false; // Student has already taken this exam
          }
        }
        return true;
      });

      const unified: UpcomingItem[] = [
        ...pendingAssigns.map((a: any) => ({
          id: a.id,
          title: a.title,
          dueDate: a.dueDate,
          type: 'ASSIGNMENT' as const,
        })),
        ...pendingExams.map((e: any) => ({
          id: e.examId || e.id,
          title: e.examTitle,
          dueDate: e.closeTime || e.examEndTime,
          type: 'EXAM' as const,
        })),
      ];

      const upcoming = unified
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 4)
        .map((item) => {
          if (isTeacher && gradebookRes) {
            let missingCount = 0;
            let completedCount = 0;
            gradebookRes.students.forEach((s: any) => {
              const sub = s.grades?.[item.id];
              if (!sub || sub.status === 'ASSIGNED' || sub.status === 'MISSING') {
                missingCount++;
              } else {
                completedCount++;
              }
            });
            return { ...item, stats: { missing: missingCount, completed: completedCount } };
          }
          return item;
        });

      setUpcomingClasswork(upcoming);
    } catch (err) {
      console.error('Error fetching upcoming:', err);
    }
  };

  const fetchPosts = async () => {
    try {
      const data = await classService.getClassPosts(classroom.id);
      setPosts(data?.content || data?.data?.content || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchUpcoming();
  }, [classroom.id]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    setIsPosting(true);
    try {
      if (editingPostId) {
        await classService.updatePost(classroom.id, editingPostId, { content: newPostContent, attachments });
      } else {
        await classService.createPost(classroom.id, { content: newPostContent, attachments });
      }
      setNewPostContent('');
      setAttachments([]);
      setEditingPostId(null);
      setIsCreatePostOpen(false);
      fetchPosts();
    } catch (error) {
      console.error('Error creating/updating post:', error);
    } finally {
      setIsPosting(false);
    }
  };

  const handleEditClick = (post: ClassPost) => {
    setEditingPostId(post.id);
    setNewPostContent(post.content);
    setAttachments(post.attachments || []);
    setIsCreatePostOpen(true);
    setOpenDropdownId(null);
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;
    try {
      await classService.deletePost(classroom.id, postToDelete);
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      const updatedPost = await classService.toggleLikePost(classroom.id, postId);
      setPosts(prev => prev.map(p => p.id === postId ? updatedPost : p));
      if (selectedPostForViewer?.id === postId) {
        setSelectedPostForViewer(updatedPost);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const focusCommentInput = (postId: string) => {
    const input = document.getElementById(`comment-input-${postId}`);
    if (input) {
      input.focus();
    }
  };

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-vutruNhat uppercase tracking-wider">Mã lớp</h2>
            {isTeacher && (
              <button 
                onClick={() => setIsInviteModalOpen(true)}
                className="text-sm font-medium text-camDam hover:text-cam transition-colors"
              >
                Mời
              </button>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-mono text-camDam font-bold tracking-widest">{classroom.inviteCode}</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(classroom.inviteCode);
                toast.success('Đã sao chép mã lớp học thành công!');
              }}
              className="p-2 text-vutruNhat hover:text-camDam hover:bg-camNhat/40 dark:hover:bg-night-elevated rounded-lg transition-colors"
              title="Sao chép mã lớp"
            >
              <Copy className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mini Calendar / Upcoming Events */}
        <div className="card p-4 sm:p-5 bg-white dark:bg-night-surface rounded-2xl border border-gray-100 dark:border-night-border shadow-soft">
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-gray-100 dark:border-night-border">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-camNhat/60 dark:bg-cam/20 flex items-center justify-center text-cam">
                <Flame className="w-4 h-4 text-cam animate-pulse" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-vutru dark:text-night-text uppercase tracking-wider">
                  {isTeacher ? 'Tiến độ hạn nộp' : 'Sắp đến hạn'}
                </h2>
                <p className="text-[11px] text-vutruNhat dark:text-night-muted">
                  {upcomingClasswork.length > 0
                    ? `${upcomingClasswork.length} bài tập & đề thi`
                    : 'Không có bài tập cần làm'}
                </p>
              </div>
            </div>

            {upcomingClasswork.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cam/10 text-camDam dark:bg-cam/20 dark:text-cam">
                {upcomingClasswork.length}
              </span>
            )}
          </div>
          
          {upcomingClasswork.length === 0 ? (
            <div className="py-5 px-3 text-center rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-dashed border-emerald-200/60 dark:border-emerald-800/40 my-1">
              <div className="w-9 h-9 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Đã xong tất cả nhiệm vụ!</p>
              <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">Không có bài tập nào sắp đến hạn.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {upcomingClasswork.map((item) => {
                const isExam = item.type === 'EXAM';

                return (
                  <Link
                    key={`${item.type}-${item.id}`}
                    to={`/classes/${classroom.id}/classwork`}
                    className="group block p-3 rounded-xl bg-gray-50/70 dark:bg-night-elevated/40 hover:bg-white dark:hover:bg-night-surface border border-gray-100 dark:border-night-border hover:border-cam/40 dark:hover:border-cam/40 transition-all shadow-xs hover:shadow-soft"
                  >
                    {/* Top Row: Type Badge + Urgency Badge */}
                    <div className="flex items-center justify-between gap-1.5 mb-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isExam
                            ? 'bg-purple-100/90 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                            : 'bg-blue-100/90 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                        }`}
                      >
                        {isExam ? <FileCheck className="w-3 h-3" /> : <FileIcon className="w-3 h-3" />}
                        {isExam ? 'Đề thi' : 'Bài tập'}
                      </span>

                      <DeadlineBadge deadline={item.dueDate} variant="compact" />
                    </div>

                    {/* Title */}
                    <h3 className="text-xs sm:text-[13px] font-bold text-vutru dark:text-night-text group-hover:text-cam transition-colors line-clamp-2 leading-snug">
                      {item.title}
                    </h3>

                    {/* Action Link */}
                    <div className="flex items-center justify-end mt-2 pt-2 border-t border-gray-100 dark:border-night-border/80 text-[11px]">
                      <span className="font-bold text-cam group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 text-[11px] shrink-0">
                        {isTeacher ? 'Xem chi tiết' : 'Làm ngay'} <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>

                    {/* Teacher Live Submission Progress */}
                    {isTeacher && item.stats && (
                      <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-dashed border-gray-200 dark:border-night-border">
                        <div className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 text-[10px] font-bold">
                          Đã làm: {item.stats.completed}
                        </div>
                        <div
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            item.stats.missing > 0
                              ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300'
                              : 'bg-gray-50 text-gray-500 dark:bg-night-elevated dark:text-night-muted'
                          }`}
                        >
                          Chưa nộp: {item.stats.missing}
                        </div>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          <Link 
            to={`/classes/${classroom.id}/classwork`}
            className="mt-3 pt-2.5 border-t border-gray-100 dark:border-night-border flex items-center justify-center text-xs text-cam font-bold hover:text-camDam transition-colors group"
          >
            Xem tất cả bài tập & đề thi
            <ChevronRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-6">
        <div 
          className="h-48 rounded-3xl bg-cover bg-center relative overflow-hidden shadow-md group"
          style={{ backgroundImage: `url(${classroom.thumbnail || getDefaultCoverForSubject(detectSubject(classroom))})` }}
        >
          {/* Luminous Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
          
          {isTeacher && (
            <button 
              onClick={() => {
                setThumbnailInput(classroom.thumbnail || '');
                setIsThumbnailModalOpen(true);
              }}
              className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors opacity-0 group-hover:opacity-100 z-10 border border-white/20"
            >
              <ImageIcon size={16} />
              Đổi ảnh bìa
            </button>
          )}

          <div className="absolute bottom-6 left-8 text-white z-10 flex items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                {classroom.name}
                {isTeacher && (
                  <button 
                    onClick={() => {
                      setEditInfoForm({
                        name: classroom.name || '',
                        subject: classroom.subject || '',
                        section: classroom.section || '',
                        description: classroom.description || '',
                        room: classroom.room || ''
                      });
                      setIsEditInfoModalOpen(true);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-white/20 rounded-lg backdrop-blur-sm"
                    title="Chỉnh sửa thông tin"
                  >
                    <Edit3 size={20} />
                  </button>
                )}
              </h1>
              <p className="text-gray-200 text-lg">{classroom.subject} {classroom.room ? `• ${classroom.room}` : ''}</p>
            </div>
          </div>
        </div>

        {isTeacher && (
          <>
            <div 
              className="card p-4 transition-all hover:-translate-y-1 cursor-pointer"
              onClick={() => {
                setEditingPostId(null);
                setNewPostContent('');
                setAttachments([]);
                setIsCreatePostOpen(true);
              }}
            >
              <div className="flex gap-4 items-center">
                <UserAvatar
                  fullName={user?.fullName || ''}
                  avatarUrl={user?.avatarUrl}
                  size="md"
                  className="w-10 h-10 font-bold flex-shrink-0 shadow-xs"
                />
                <div className="flex-1 bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200 rounded-full px-4 py-3 text-gray-500 select-none">
                  Thông báo cho lớp học của bạn...
                </div>
              </div>
            </div>

            <Modal
              isOpen={isCreatePostOpen}
              onClose={() => {
                setIsCreatePostOpen(false);
                setEditingPostId(null);
                setNewPostContent('');
                setAttachments([]);
              }}
              title={editingPostId ? "Chỉnh sửa bài đăng" : "Tạo bài đăng"}
              maxWidth="2xl"
            >
              <form onSubmit={handleCreatePost} className="flex flex-col gap-4">
                {/* User Info Header like Facebook */}
                <div className="flex items-center gap-3">
                  <UserAvatar
                    fullName={user?.fullName || ''}
                    avatarUrl={user?.avatarUrl}
                    size="md"
                    className="w-10 h-10 font-bold flex-shrink-0 shadow-xs"
                  />
                  <div>
                    <p className="font-semibold text-gray-800">{user?.fullName}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                        Lớp học
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl overflow-hidden">
                  <ReactQuill
                    value={newPostContent}
                    onChange={setNewPostContent}
                    placeholder="Bạn muốn viết gì..."
                    theme="snow"
                    className="border-none [&_.ql-toolbar]:border-none [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-gray-100 [&_.ql-container]:border-none [&_.ql-editor]:px-2 [&_.ql-editor]:min-h-[120px] [&_.ql-editor]:text-base [&_.ql-editor.ql-blank::before]:text-gray-400 [&_.ql-editor.ql-blank::before]:text-base"
                  />
                </div>

                {/* Attachments Preview */}
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-2 mb-2">
                    {attachments.map((url, idx) => {
                      const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)$/i);
                      return isImage ? (
                        <div key={idx} className="relative group w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
                          <img src={url} alt="preview" className="w-full h-auto max-h-[400px] object-contain" />
                          <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              className="flex items-center gap-1 px-3 py-1.5 bg-white/90 hover:bg-white text-gray-800 text-sm font-semibold rounded-lg shadow-sm transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                              Chỉnh sửa
                            </button>
                          </div>
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => removeAttachment(idx)}
                              className="p-2 bg-white/90 hover:bg-gray-100 text-gray-700 rounded-full shadow-sm transition-colors"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div key={idx} className="relative group border border-gray-200 rounded-lg p-2 flex items-center gap-2 pr-8 bg-gray-50 w-full">
                          <FileIcon className="w-6 h-6 text-vutru shrink-0" />
                          <a href={url} target="_blank" rel="noreferrer" className="text-sm font-medium text-gray-700 hover:underline">
                            Tệp đính kèm {idx + 1}
                          </a>
                          <button
                            type="button"
                            onClick={() => removeAttachment(idx)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-gray-200 hover:bg-red-100 text-gray-600 hover:text-red-500 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add to your post section */}
                <div className="flex items-center justify-between border border-gray-300 rounded-lg p-3 mt-4 shadow-sm">
                  <span className="font-semibold text-gray-700">Thêm vào bài viết</span>
                  <div className="flex gap-2">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      className="hidden" 
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingFile}
                      className="p-2 text-green-500 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                      title="Ảnh/Video/Tệp"
                    >
                      <ImageIcon className="w-6 h-6" />
                    </button>
                    <button type="button" className="p-2 text-blue-500 hover:bg-gray-100 rounded-full transition-colors" title="Gắn thẻ">
                      <UserPlus className="w-6 h-6" />
                    </button>
                    <button type="button" className="p-2 text-red-500 hover:bg-gray-100 rounded-full transition-colors" title="Vị trí">
                      <MapPin className="w-6 h-6" />
                    </button>
                    <button type="button" className="p-2 text-yellow-500 hover:bg-gray-100 rounded-full transition-colors" title="Cảm xúc">
                      <Smile className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPosting || uploadingFile || (!newPostContent.trim() && attachments.length === 0)}
                  className="w-full mt-2 btn btn-chinh py-3 text-base font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPosting ? 'Đang đăng...' : 'Đăng'}
                </button>
              </form>
            </Modal>
          </>
        )}

        {loading && <LoadingOverlay text="Đang tải bảng tin lớp học..." />}

        {posts.length === 0 && !loading ? (
          <div className="text-center py-16 card">
            <p className="text-gray-500 font-medium">Đây là nơi bạn giao tiếp với lớp học</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {posts.map((post) => {
              const isPostTeacher = post.authorId === classroom.teacherId;
              
              // Helper for time ago
              const getTimeAgo = (dateString: string) => {
                const date = new Date(dateString);
                const now = new Date();
                const diffMs = now.getTime() - date.getTime();
                const diffSec = Math.floor(diffMs / 1000);
                const diffMin = Math.floor(diffSec / 60);
                const diffHour = Math.floor(diffMin / 60);
                const diffDay = Math.floor(diffHour / 24);
                
                if (diffMin < 1) return 'Vừa xong';
                if (diffMin < 60) return `${diffMin} phút`;
                if (diffHour < 24) return `${diffHour} giờ`;
                if (diffDay < 7) return `${diffDay} ngày`;
                return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
              };

              const postImages = post.attachments?.filter(url => url.match(/\.(jpeg|jpg|gif|png|webp)$/i)) || [];
              const postDocs = post.attachments?.filter(url => !url.match(/\.(jpeg|jpg|gif|png|webp)$/i)) || [];

              const handleShare = () => {
                const url = `${window.location.origin}/classes/${classroom.id}?post=${post.id}`;
                navigator.clipboard.writeText(url);
                toast.success('Đã sao chép liên kết bài viết!');
              };

              return (
              <div key={post.id} className="card p-0 overflow-hidden bg-white dark:bg-night-surface border border-gray-100 dark:border-night-border rounded-2xl shadow-soft">
                <div className="p-6 pb-2">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        fullName={post.authorName}
                        avatarUrl={post.authorAvatar}
                        size="md"
                        className="w-10 h-10 font-bold text-lg shrink-0 shadow-xs"
                      />
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-heading font-bold text-[15px] text-vutru dark:text-night-text leading-tight">{post.authorName}</h3>
                          {isPostTeacher ? (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-full text-[11px] font-bold">
                              <ShieldCheck className="w-3 h-3" />
                              Giáo viên
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-full text-[11px] font-bold">
                              <Star className="w-3 h-3 fill-amber-400" />
                              Học sinh
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[12px] text-vutruNhat dark:text-night-muted mt-0.5">
                          <span className="hover:underline cursor-pointer">{getTimeAgo(post.createdAt)}</span>
                          <span>•</span>
                          <Globe className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                    <div className="relative font-body">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdownId(openDropdownId === post.id ? null : post.id);
                        }}
                        aria-label="Tùy chọn bài viết"
                        aria-expanded={openDropdownId === post.id}
                        aria-haspopup="menu"
                        className="w-9 h-9 rounded-full hover:bg-gray-100 dark:hover:bg-night-elevated flex items-center justify-center text-vutruNhat dark:text-night-muted transition-colors focus-visible:ring-2 focus-visible:ring-cam outline-none"
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                      {openDropdownId === post.id && (
                        <div
                          role="menu"
                          className="absolute right-0 mt-1 w-52 bg-white dark:bg-night-surface rounded-2xl shadow-soft border border-gray-100 dark:border-night-border p-1.5 z-20 animate-fade-in space-y-0.5"
                          onClick={e => e.stopPropagation()}
                        >
                          {(user?.id === post.authorId || isTeacher || user?.role === 'ADMIN') && (
                            <>
                              <button
                                role="menuitem"
                                onClick={() => handleEditClick(post)}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-night-elevated text-vutru dark:text-night-text text-xs sm:text-sm font-medium transition-colors group"
                              >
                                <Pencil size={15} className="text-vutruNhat dark:text-night-muted group-hover:text-cam transition-colors" />
                                <span>Chỉnh sửa bài viết</span>
                              </button>
                              <button
                                role="menuitem"
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-night-elevated text-vutru dark:text-night-text text-xs sm:text-sm font-medium transition-colors group"
                                onClick={() => toast.info('Lịch sử chỉnh sửa đang được phát triển')}
                              >
                                <History size={15} className="text-vutruNhat dark:text-night-muted group-hover:text-cam transition-colors" />
                                <span>Lịch sử chỉnh sửa</span>
                              </button>
                              <div className="my-1 border-t border-gray-100 dark:border-night-border" />
                              <button
                                role="menuitem"
                                onClick={() => setPostToDelete(post.id)}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 text-xs sm:text-sm font-medium transition-colors group"
                              >
                                <Trash2 size={15} className="group-hover:text-rose-600 transition-colors" />
                                <span>Xóa bài viết</span>
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-[15px] leading-relaxed text-vutru dark:text-night-text prose prose-sm dark:prose-invert max-w-none mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_p:last-child]:mb-0" dangerouslySetInnerHTML={{ __html: post.content }} />
                </div>
                
                {/* Images Facebook Grid */}
                {postImages.length > 0 && (
                  <div className={`grid gap-0.5 bg-white ${postImages.length === 1 ? 'grid-cols-1' : postImages.length === 2 ? 'grid-cols-2 aspect-[2/1]' : postImages.length === 3 ? 'grid-cols-2 aspect-square' : 'grid-cols-2 aspect-square'}`}>
                    {postImages.slice(0, 4).map((url, idx) => {
                      let itemClass = "relative overflow-hidden block w-full border border-gray-100 bg-gray-50";
                      let imgClass = "w-full object-cover hover:opacity-95 transition-opacity object-center";
                      
                      if (postImages.length === 1) {
                        itemClass += " max-h-[550px] flex items-center justify-center";
                        imgClass += " max-h-[550px] object-contain"; // Use object-contain to show full image without cropping
                      } else {
                        itemClass += " h-full";
                        imgClass += " h-full";
                      }
                      
                      if (postImages.length === 3) {
                        if (idx === 0) itemClass += " row-span-2"; // First image takes full height of left column
                      }
                      
                      const isLastWithOverlay = idx === 3 && postImages.length > 4;

                      return (
                        <a key={idx} href={url} onClick={(e) => {
                          e.preventDefault();
                          setSelectedPostForViewer(post);
                          setSelectedImageIndex(idx);
                        }} className={itemClass}>
                          <img src={url} alt="attachment" className={imgClass} />
                          {isLastWithOverlay && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center hover:bg-black/50 transition-colors cursor-pointer">
                              <span className="text-3xl font-semibold text-white">+{postImages.length - 4}</span>
                            </div>
                          )}
                        </a>
                      );
                    })}
                  </div>
                )}

                {/* Documents list */}
                {postDocs.length > 0 && (
                  <div className="px-6 py-2 flex flex-col gap-2 bg-gray-50/50">
                    {postDocs.map((url, idx) => (
                      <a key={idx} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 hover:border-cam hover:shadow-sm transition-all group">
                        <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
                          <FileIcon className="w-5 h-5 text-gray-500 group-hover:text-camDam transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-camDam transition-colors">Tài liệu đính kèm {idx + 1}</p>
                          <p className="text-xs text-gray-500 uppercase">Document</p>
                        </div>
                      </a>
                    ))}
                  </div>
                )}

                {/* Actions & Comments */}
                <div className="px-6 pb-6">
                  {/* Action Buttons */}
                  <div className="flex items-center justify-between border-t border-gray-100 pt-3 mb-3">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => handleLikePost(post.id)}
                        className={`flex items-center gap-1.5 transition-colors font-medium text-sm ${post.isLikedByCurrentUser ? 'text-blue-600' : 'text-gray-500 hover:text-camDam'}`}
                      >
                        <ThumbsUp className={`w-4 h-4 ${post.isLikedByCurrentUser ? 'fill-blue-600' : ''}`} />
                        Thích {post.likeCount && post.likeCount > 0 ? `(${post.likeCount})` : ''}
                      </button>
                      <button 
                        onClick={() => focusCommentInput(post.id)}
                        className="flex items-center gap-1.5 text-gray-500 hover:text-camDam transition-colors font-medium text-sm"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Bình luận {post.commentCount && post.commentCount > 0 ? `(${post.commentCount})` : ''}
                      </button>
                    </div>
                    <button onClick={handleShare} className="flex items-center gap-1.5 text-gray-500 hover:text-camDam transition-colors font-medium text-sm">
                      <Share2 className="w-4 h-4" />
                      Chia sẻ
                    </button>
                  </div>

                  <div className="mt-3">
                    <PostComments classId={classroom.id} postId={post.id} />
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Mời tham gia lớp học"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mã lớp</label>
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                readOnly 
                value={classroom.inviteCode}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 font-mono"
              />
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(classroom.inviteCode);
                  toast.success('Đã sao chép mã lớp!');
                }}
                className="btn btn-phu px-4 py-2 text-xs font-bold"
              >
                Sao chép
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Đường liên kết mời</label>
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                readOnly 
                value={`${window.location.origin}/dashboard?joinCode=${classroom.inviteCode}`}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 text-sm truncate"
              />
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/dashboard?joinCode=${classroom.inviteCode}`);
                  toast.success('Đã sao chép liên kết mời!');
                }}
                className="btn btn-phu px-4 py-2 text-xs font-bold"
              >
                Sao chép
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Facebook Photo Viewer Modal */}
      {selectedPostForViewer && (() => {
        const postImages = selectedPostForViewer.attachments?.filter(url => url.match(/\.(jpeg|jpg|gif|png|webp)$/i)) || [];
        const isPostTeacher = selectedPostForViewer.authorId === classroom.teacherId;
        
        return (
          <Portal><div className="fixed inset-0 z-[100] flex bg-black/95 backdrop-blur-sm">
            {/* Left side: Image Viewer */}
            <div className="flex-1 relative flex items-center justify-center">
              <button 
                onClick={() => setSelectedPostForViewer(null)}
                className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center z-10 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {selectedImageIndex > 0 && (
                <button 
                  onClick={() => setSelectedImageIndex(selectedImageIndex - 1)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center z-10 transition-colors"
                >
                  <ChevronRight className="w-8 h-8 rotate-180" />
                </button>
              )}

              {selectedImageIndex < postImages.length - 1 && (
                <button 
                  onClick={() => setSelectedImageIndex(selectedImageIndex + 1)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center z-10 transition-colors"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              )}

              <img 
                src={postImages[selectedImageIndex]} 
                alt="viewer" 
                className="max-h-screen max-w-full object-contain select-none" 
              />
            </div>

            {/* Right side: Post Details & Comments */}
            <div className="w-[360px] bg-white h-full flex flex-col overflow-y-auto">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <UserAvatar
                    fullName={selectedPostForViewer.authorName}
                    avatarUrl={selectedPostForViewer.authorAvatar}
                    size="md"
                    className="w-10 h-10 font-bold text-lg shrink-0 shadow-xs"
                  />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-semibold text-[15px] text-gray-900 leading-tight">{selectedPostForViewer.authorName}</h3>
                      {isPostTeacher ? (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[11px] font-semibold">
                          <ShieldCheck className="w-3 h-3" />
                          Giáo viên
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-50 text-yellow-600 rounded text-[11px] font-semibold">
                          <Star className="w-3 h-3 fill-yellow-400" />
                          Học sinh
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[13px] text-gray-500 mt-0.5">
                      <span>{new Date(selectedPostForViewer.createdAt).toLocaleDateString('vi-VN')}</span>
                      <span>•</span>
                      <Globe className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
                <div className="text-[15px] leading-relaxed text-gray-900 prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_p:last-child]:mb-0" dangerouslySetInnerHTML={{ __html: selectedPostForViewer.content }} />
                
                <div className="flex items-center justify-between border-t border-gray-200 mt-4 pt-2">
                  <button 
                    onClick={() => handleLikePost(selectedPostForViewer.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded transition-colors font-medium text-[15px] ${selectedPostForViewer.isLikedByCurrentUser ? 'text-blue-600 hover:bg-blue-50' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <ThumbsUp className={`w-5 h-5 ${selectedPostForViewer.isLikedByCurrentUser ? 'fill-blue-600' : ''}`} />
                    Thích {selectedPostForViewer.likeCount && selectedPostForViewer.likeCount > 0 ? `(${selectedPostForViewer.likeCount})` : ''}
                  </button>
                  <button 
                    onClick={() => focusCommentInput(selectedPostForViewer.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-1.5 rounded hover:bg-gray-100 text-gray-600 font-medium text-[15px] transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Bình luận {selectedPostForViewer.commentCount && selectedPostForViewer.commentCount > 0 ? `(${selectedPostForViewer.commentCount})` : ''}
                  </button>
                </div>
              </div>
              <div className="p-4 flex-1">
                <PostComments classId={classroom.id} postId={selectedPostForViewer.id} />
              </div>
            </div>
          </div></Portal>
        );
      })()}

      <Modal 
        isOpen={isThumbnailModalOpen} 
        onClose={() => !isSavingThumbnail && setIsThumbnailModalOpen(false)} 
        title="Cài đặt ảnh bìa lớp học"
        maxWidth="2xl"
      >
        <div className="p-5 space-y-4 text-vutru dark:text-night-text font-body">
          {/* Tab Switcher */}
          <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-night-elevated rounded-xl border border-gray-200 dark:border-night-border">
            <button
              type="button"
              onClick={() => setThumbnailTab('presets')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                thumbnailTab === 'presets'
                  ? 'bg-white dark:bg-night-surface text-cam shadow-2xs'
                  : 'text-vutruNhat dark:text-night-muted hover:text-vutru'
              }`}
            >
              Bộ ảnh bìa theo Môn học ({CLASS_COVER_PRESETS.length} mẫu có sẵn)
            </button>
            <button
              type="button"
              onClick={() => setThumbnailTab('upload')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                thumbnailTab === 'upload'
                  ? 'bg-white dark:bg-night-surface text-cam shadow-2xs'
                  : 'text-vutruNhat dark:text-night-muted hover:text-vutru'
              }`}
            >
              Tải ảnh từ máy / Dán URL
            </button>
          </div>

          {/* TAB 1: PRESET GALLERY */}
          {thumbnailTab === 'presets' && (
            <div className="space-y-2">
              <p className="text-xs text-vutruNhat dark:text-night-muted">
                Chọn ảnh bìa học thuật chuẩn chất lượng cao phù hợp với môn học của lớp:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                {CLASS_COVER_PRESETS.map((preset) => {
                  const isSelected = thumbnailInput === preset.url;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => setThumbnailInput(preset.url)}
                      className={`relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all group ${
                        isSelected
                          ? 'border-cam ring-2 ring-cam/30 shadow-md scale-[1.02]'
                          : 'border-gray-200 dark:border-night-border hover:border-cam/50 hover:shadow-sm'
                      }`}
                    >
                      <div className="h-20 w-full bg-cover bg-center" style={{ backgroundImage: `url(${preset.url})` }}>
                        <div className="w-full h-full bg-gradient-to-t from-black/55 via-black/15 to-transparent p-2 flex flex-col justify-between">
                          <span className="self-start text-[10px] font-bold px-1.5 py-0.2 rounded bg-black/45 text-white backdrop-blur-xs">
                            {preset.subject}
                          </span>
                          {isSelected && (
                            <span className="self-end w-5 h-5 rounded-full bg-cam text-white flex items-center justify-center shadow-xs">
                              <Check size={12} strokeWidth={3} />
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="p-2 bg-white dark:bg-night-surface text-[11px] font-bold text-vutru dark:text-night-text truncate">
                        {preset.name}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOM UPLOAD */}
          {thumbnailTab === 'upload' && (
            <div className="space-y-4">
              <p className="text-xs text-vutruNhat dark:text-night-muted">
                Tải lên hình ảnh từ thiết bị của bạn hoặc nhập đường dẫn (URL) ảnh bìa lớp học:
              </p>

              {/* Hidden File Input */}
              <input
                type="file"
                ref={thumbnailFileInputRef}
                onChange={handleThumbnailFileUpload}
                accept="image/*"
                className="hidden"
              />

              {/* Upload Drop Zone */}
              <div
                onClick={() => !isUploadingThumbnail && thumbnailFileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 ${
                  isUploadingThumbnail
                    ? 'border-cam/40 bg-camNhat/10 dark:bg-cam/5 cursor-wait'
                    : 'border-gray-200 dark:border-night-border hover:border-cam dark:hover:border-cam hover:bg-camNhat/10 dark:hover:bg-cam/5'
                }`}
              >
                {isUploadingThumbnail ? (
                  <div className="flex flex-col items-center gap-2 py-2">
                    <div className="w-7 h-7 border-3 border-cam border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-bold text-cam">Đang tải ảnh lên...</span>
                  </div>
                ) : (
                  <>
                    <div className="w-11 h-11 rounded-2xl bg-camNhat/50 dark:bg-cam/20 flex items-center justify-center text-cam">
                      <Upload size={22} strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-vutru dark:text-night-text">
                        Bấm để tải ảnh lên từ thiết bị
                      </p>
                      <p className="text-[11px] text-vutruNhat dark:text-night-muted mt-0.5">
                        Hỗ trợ PNG, JPG, WEBP, GIF (Tối đa 10MB)
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* URL Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-vutru dark:text-night-text">
                  Hoặc dán trực tiếp đường dẫn URL ảnh
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={thumbnailInput}
                  onChange={(e) => setThumbnailInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-night-elevated border border-gray-200 dark:border-night-border rounded-xl text-xs sm:text-sm text-vutru dark:text-night-text focus:outline-none focus:border-cam focus:ring-2 focus:ring-cam/20 transition-all font-medium"
                />
              </div>
            </div>
          )}

          {/* Live Preview Bar */}
          {thumbnailInput && (
            <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-night-border">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-vutruNhat dark:text-night-muted">
                <span>Xem trước ảnh bìa lớp</span>
                <button
                  type="button"
                  onClick={() => setThumbnailInput('')}
                  className="text-rose-500 hover:underline flex items-center gap-0.5 lowercase font-normal"
                >
                  <X size={12} /> Bỏ chọn ảnh
                </button>
              </div>
              <div className="relative w-full h-28 rounded-xl overflow-hidden border border-gray-200 dark:border-night-border group shadow-2xs">
                <img
                  src={thumbnailInput}
                  alt="Xem trước ảnh bìa"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent p-3 flex items-end">
                  <span className="text-white text-xs font-bold drop-shadow-sm">{classroom.name}</span>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-night-border">
            <button
              type="button"
              disabled={isSavingThumbnail}
              onClick={() => setIsThumbnailModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-vutruNhat hover:text-vutru dark:text-night-muted dark:hover:text-night-text rounded-xl hover:bg-gray-100 dark:hover:bg-night-elevated transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={isSavingThumbnail || isUploadingThumbnail}
              className="px-5 py-2 text-xs font-extrabold text-white bg-cam hover:bg-camDam rounded-xl shadow-soft transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={async () => {
                setIsSavingThumbnail(true);
                try {
                  await classService.updateClassThumbnail(classroom.id, thumbnailInput);
                  toast.success('Đã cập nhật ảnh bìa lớp học thành công!');
                  setIsThumbnailModalOpen(false);
                  window.location.reload();
                } catch (e) {
                  toast.error('Có lỗi xảy ra khi cập nhật ảnh bìa.');
                } finally {
                  setIsSavingThumbnail(false);
                }
              }}
            >
              {isSavingThumbnail ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Lưu thay đổi</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={isEditInfoModalOpen} 
        onClose={() => !isSavingInfo && setIsEditInfoModalOpen(false)} 
        title="Chỉnh sửa thông tin lớp học"
        maxWidth="lg"
      >
        <div className="p-5 w-full space-y-4 text-vutru dark:text-night-text">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-vutru dark:text-night-text mb-1.5">
              Tên lớp học <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={editInfoForm.name}
              onChange={(e) => setEditInfoForm({ ...editInfoForm, name: e.target.value })}
              placeholder="VD: TIẾNG ANH 10 - ÔN THI THPT"
              className="w-full px-4 py-2.5 bg-white dark:bg-night-elevated border border-gray-200 dark:border-night-border rounded-xl text-sm font-semibold focus:outline-none focus:border-cam focus:ring-2 focus:ring-cam/20 transition-all text-vutru dark:text-night-text"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-vutru dark:text-night-text mb-1.5">
                Môn học
              </label>
              <input
                type="text"
                value={editInfoForm.subject}
                onChange={(e) => setEditInfoForm({ ...editInfoForm, subject: e.target.value })}
                placeholder="VD: Tiếng Anh"
                className="w-full px-4 py-2.5 bg-white dark:bg-night-elevated border border-gray-200 dark:border-night-border rounded-xl text-sm font-medium focus:outline-none focus:border-cam focus:ring-2 focus:ring-cam/20 transition-all text-vutru dark:text-night-text"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-vutru dark:text-night-text mb-1.5">
                Khóa / Năm học
              </label>
              <input
                type="text"
                value={editInfoForm.section}
                onChange={(e) => setEditInfoForm({ ...editInfoForm, section: e.target.value })}
                placeholder="VD: 2026 - 2027"
                className="w-full px-4 py-2.5 bg-white dark:bg-night-elevated border border-gray-200 dark:border-night-border rounded-xl text-sm font-medium focus:outline-none focus:border-cam focus:ring-2 focus:ring-cam/20 transition-all text-vutru dark:text-night-text"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-vutru dark:text-night-text mb-1.5">
              Phòng học / Địa điểm
            </label>
            <input
              type="text"
              value={editInfoForm.room}
              onChange={(e) => setEditInfoForm({ ...editInfoForm, room: e.target.value })}
              placeholder="VD: Phòng A204 hoặc Trực tuyến qua Google Meet"
              className="w-full px-4 py-2.5 bg-white dark:bg-night-elevated border border-gray-200 dark:border-night-border rounded-xl text-sm font-medium focus:outline-none focus:border-cam focus:ring-2 focus:ring-cam/20 transition-all text-vutru dark:text-night-text"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-vutru dark:text-night-text mb-1.5">
              Mô tả lớp học
            </label>
            <textarea
              rows={3}
              value={editInfoForm.description}
              onChange={(e) => setEditInfoForm({ ...editInfoForm, description: e.target.value })}
              placeholder="Nhập thông tin giới thiệu, mục tiêu học tập hoặc quy định chung của lớp học..."
              className="w-full px-4 py-2.5 bg-white dark:bg-night-elevated border border-gray-200 dark:border-night-border rounded-xl text-sm font-medium focus:outline-none focus:border-cam focus:ring-2 focus:ring-cam/20 transition-all text-vutru dark:text-night-text resize-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-night-border">
            <button
              type="button"
              disabled={isSavingInfo}
              onClick={() => setIsEditInfoModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-vutruNhat hover:text-vutru dark:text-night-muted dark:hover:text-night-text rounded-xl hover:bg-gray-100 dark:hover:bg-night-elevated transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={!editInfoForm.name.trim() || isSavingInfo}
              className="px-5 py-2 text-xs font-extrabold text-white bg-cam hover:bg-camDam rounded-xl shadow-soft transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={async () => {
                setIsSavingInfo(true);
                try {
                  await classService.updateClassInfo(classroom.id, editInfoForm);
                  toast.success('Đã cập nhật thông tin lớp học thành công!');
                  setIsEditInfoModalOpen(false);
                  window.location.reload();
                } catch (e) {
                  toast.error('Có lỗi xảy ra khi cập nhật thông tin lớp học.');
                } finally {
                  setIsSavingInfo(false);
                }
              }}
            >
              {isSavingInfo ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Lưu thay đổi</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default ClassStream;
