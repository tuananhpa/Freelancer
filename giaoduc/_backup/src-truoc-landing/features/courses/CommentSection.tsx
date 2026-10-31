import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Send, User, MessageSquare } from 'lucide-react';

interface Comment {
  id: string;
  content: string;
  authorName: string;
  authorRole: string;
  createdAt: string;
  replies: Comment[];
}

interface CommentNodeProps {
  comment: Comment;
  isReply?: boolean;
  replyingTo: string | null;
  onToggleReply: (id: string) => void;
  replyContent: string;
  onReplyContentChange: (val: string) => void;
  onSubmitReply: (e: React.FormEvent, parentId: string) => void;
  submitting: boolean;
}

const CommentNode: React.FC<CommentNodeProps> = ({
  comment,
  isReply = false,
  replyingTo,
  onToggleReply,
  replyContent,
  onReplyContentChange,
  onSubmitReply,
  submitting,
}) => (
  <div className={`flex gap-3 ${isReply ? 'ml-10 mt-3' : 'mt-6'}`}>
    <div className="w-10 h-10 rounded-full bg-camNhat flex items-center justify-center text-cam shrink-0">
      <User size={20} />
    </div>
    <div className="flex-1">
      <div className="bg-gray-50 dark:bg-night-surface rounded-2xl p-4 border border-gray-100 dark:border-night-border">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-vutru">{comment.authorName}</span>
            {comment.authorRole === 'TEACHER' && (
              <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold">GIÁO VIÊN</span>
            )}
            {comment.authorRole === 'TEACHING_ASSISTANT' && (
              <span className="bg-teal-100 text-teal-700 text-[10px] px-2 py-0.5 rounded-full font-bold">TRỢ GIẢNG</span>
            )}
          </div>
          <span className="text-xs text-vutruNhat">{new Date(comment.createdAt).toLocaleDateString()}</span>
        </div>
        <p className="text-vutru text-sm whitespace-pre-wrap">{comment.content}</p>
      </div>

      {!isReply && (
        <div className="mt-2 ml-2">
          <button
            onClick={() => onToggleReply(comment.id)}
            className="text-xs font-bold text-vutruNhat hover:text-cam transition-colors"
          >
            Phản hồi
          </button>

          {replyingTo === comment.id && (
            <form onSubmit={(e) => onSubmitReply(e, comment.id)} className="mt-3 flex gap-2">
              <input
                type="text"
                placeholder={`Phản hồi ${comment.authorName}...`}
                className="flex-1 text-sm bg-white border border-gray-200 rounded-full px-4 py-2 outline-none focus:border-orange-400"
                value={replyContent}
                onChange={(e) => onReplyContentChange(e.target.value)}
                autoFocus
              />
              <button type="submit" disabled={!replyContent.trim() || submitting} className="bg-cam text-white rounded-full p-2 disabled:opacity-50 hover:brightness-110 transition-all">
                <Send size={16} />
              </button>
            </form>
          )}
        </div>
      )}

      {/* Replies */}
      {comment.replies?.map(reply => (
        <CommentNode
          key={reply.id}
          comment={reply}
          isReply={true}
          replyingTo={replyingTo}
          onToggleReply={onToggleReply}
          replyContent={replyContent}
          onReplyContentChange={onReplyContentChange}
          onSubmitReply={onSubmitReply}
          submitting={submitting}
        />
      ))}
    </div>
  </div>
);

export const CommentSection = ({ lessonId }: { lessonId: string }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = async () => {
    try {
      const res = await api.get(`/lessons/${lessonId}/comments?size=50`);
      setComments(res.data.content);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (lessonId) fetchComments();
  }, [lessonId]);

  const handleSubmit = async (e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault();
    const content = parentId ? replyContent : newComment;
    if (!content.trim()) return;

    try {
      setSubmitting(true);
      await api.post(`/lessons/${lessonId}/comments`, { content, parentId });
      if (parentId) {
        setReplyContent('');
        setReplyingTo(null);
      } else {
        setNewComment('');
      }
      fetchComments();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleReply = (id: string) => {
    setReplyingTo(prev => (prev === id ? null : id));
  };

  return (
    <div className="bg-white dark:bg-night-surface rounded-3xl shadow-sm border border-gray-100 dark:border-night-border p-6 md:p-8 mt-8">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="text-cam" />
        <h2 className="text-xl font-bold text-vutru">Hỏi đáp & Thảo luận ({comments.length})</h2>
      </div>

      <form onSubmit={(e) => handleSubmit(e, null)} className="flex gap-3 mb-8">
        <div className="w-10 h-10 rounded-full bg-cam flex items-center justify-center text-white shrink-0 shadow-md">
          <span className="font-bold text-lg">{user?.fullName?.charAt(0)}</span>
        </div>
        <div className="flex-1 relative">
          <textarea
            placeholder="Bạn có câu hỏi gì về bài học này không?"
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:border-orange-400 focus:bg-white transition-colors min-h-[80px] resize-none pr-12 text-sm"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <button 
            type="submit" 
            disabled={!newComment.trim() || submitting}
            className="absolute bottom-3 right-3 bg-cam text-white p-2 rounded-xl hover:brightness-110 disabled:opacity-50 disabled:hover:brightness-100 transition-all shadow-md"
          >
            <Send size={18} />
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {comments.map(comment => (
          <CommentNode
            key={comment.id}
            comment={comment}
            replyingTo={replyingTo}
            onToggleReply={handleToggleReply}
            replyContent={replyContent}
            onReplyContentChange={setReplyContent}
            onSubmitReply={handleSubmit}
            submitting={submitting}
          />
        ))}
        {comments.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <p>Chưa có bình luận nào. Hãy là người đầu tiên đặt câu hỏi!</p>
          </div>
        )}
      </div>
    </div>
  );
};
