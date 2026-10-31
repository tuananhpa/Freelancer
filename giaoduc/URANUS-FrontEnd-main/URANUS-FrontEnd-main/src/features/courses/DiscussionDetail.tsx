import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { discussionApi, Discussion } from '../../services/discussionApi';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import UserAvatar from '../../components/common/UserAvatar';
import { useToast } from '../../context/ToastContext';
import LoadingOverlay from '../../components/ui/LoadingOverlay';


const DiscussionDetail: React.FC = () => {
  const { id: courseId, discussionId } = useParams<{ id: string, discussionId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    if (discussionId) fetchDiscussion();
  }, [discussionId]);

  const fetchDiscussion = async () => {
    try {
      const data = await discussionApi.getDiscussionDetails(discussionId!);
      setDiscussion(data);
    } catch (error) {
      toast.error('Không thể tải bài thảo luận');
      navigate(`/courses/${courseId}/discussions`);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    try {
      await discussionApi.addReply(discussionId!, replyContent);
      setReplyContent('');
      fetchDiscussion();
      toast.success('Đã gửi câu trả lời');
    } catch (error) {
      toast.error('Gửi câu trả lời thất bại');
    }
  };

  if (!discussion) return <LoadingOverlay text="Đang tải..." />;

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      <button 
        onClick={() => navigate(`/courses/${courseId}/discussions`)}
        className="flex items-center gap-2 text-vutruNhat hover:text-cam font-bold text-sm transition-colors"
      >
        <span>←</span> Quay lại danh sách
      </button>

      <Card className="border-l-4 border-cam">
        <div className="flex gap-4">
          <div className="shrink-0">
            <UserAvatar fullName={discussion.authorName} avatarUrl={discussion.authorAvatar} size="lg" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-extrabold text-vutru mb-2 leading-snug">{discussion.title}</h1>
            <div className="flex items-center gap-3 text-xs text-gray-500 mb-6">
              <span className="font-bold text-vutru">{discussion.authorName}</span>
              <span>•</span>
              <span>{new Date(discussion.createdAt).toLocaleString('vi-VN')}</span>
            </div>
            <div className="prose prose-sm max-w-none text-vutru leading-relaxed whitespace-pre-wrap">
              {discussion.content}
            </div>
          </div>
        </div>
      </Card>

      <div className="pl-12 space-y-4">
        <h3 className="font-bold text-lg text-vutru mb-4">
          {discussion.replies?.length || 0} Câu trả lời
        </h3>
        
        {discussion.replies?.map(reply => (
          <Card key={reply.id} className={`bg-gray-50/50 ${reply.isAcceptedAnswer ? 'border-l-4 border-green-500 bg-green-50/30' : ''}`}>
            <div className="flex gap-4">
              <div className="shrink-0">
                <UserAvatar fullName={reply.authorName} avatarUrl={reply.authorAvatar} size="sm" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-vutru">{reply.authorName}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-400">{new Date(reply.createdAt).toLocaleString('vi-VN')}</span>
                  </div>
                  {reply.isAcceptedAnswer && (
                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1">
                      ✓ Câu trả lời hay nhất
                    </span>
                  )}
                </div>
                <div className="text-sm text-vutru whitespace-pre-wrap leading-relaxed">
                  {reply.content}
                </div>
              </div>
            </div>
          </Card>
        ))}

        <Card className="mt-8 bg-white border-dashed border-gray-300">
          <form onSubmit={handleReply}>
            <label className="block text-sm font-bold text-vutru mb-2">Viết câu trả lời của bạn</label>
            <textarea
              value={replyContent}
              onChange={e => setReplyContent(e.target.value)}
              placeholder="Giúp đỡ bạn học bằng cách trả lời câu hỏi này..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 min-h-[120px] focus:ring-2 focus:ring-cam/30 focus:border-cam resize-y mb-3"
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={!replyContent.trim()}>Gửi câu trả lời</Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default DiscussionDetail;
