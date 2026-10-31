import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { discussionApi, Discussion } from '../../services/discussionApi';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import UserAvatar from '../../components/common/UserAvatar';
import { useToast } from '../../context/ToastContext';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import { MessageCircle, Pin, HelpCircle, CheckCircle } from 'lucide-react';

const CourseDiscussions: React.FC = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const toast = useToast();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  useEffect(() => {
    if (courseId) {
      fetchDiscussions();
    }
  }, [courseId, page]);

  const fetchDiscussions = async () => {
    try {
      const data = await discussionApi.getCourseDiscussions(courseId!, page);
      setDiscussions(data.content);
      setTotalPages(data.totalPages);
    } catch (error) {
      toast.error('Không thể tải danh sách thảo luận');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    try {
      await discussionApi.createDiscussion(courseId!, newTitle, newContent);
      toast.success('Đã tạo câu hỏi mới');
      setIsModalOpen(false);
      setNewTitle('');
      setNewContent('');
      fetchDiscussions();
    } catch (error) {
      toast.error('Lỗi khi tạo câu hỏi');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-vutru dark:text-night-text">Hỏi đáp & Thảo luận</h1>
          <p className="text-vutruNhat dark:text-night-muted mt-1">Cộng đồng trao đổi kiến thức khóa học</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>+ Câu hỏi mới</Button>
      </div>

      <div className="space-y-4">
        {discussions.map(discussion => (
          <Link key={discussion.id} to={`/courses/${courseId}/discussions/${discussion.id}`} className="block">
            <Card className="hover:border-cam/50 hover:shadow-md transition-all group">
              <div className="flex gap-4">
                <div className="shrink-0 pt-1">
                  <UserAvatar fullName={discussion.authorName} avatarUrl={discussion.authorAvatar} size="md" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-lg font-bold text-vutru dark:text-night-text group-hover:text-cam transition-colors line-clamp-1 flex items-center">
                      {discussion.isPinned && <Pin size={15} className="text-cam mr-1.5 shrink-0" aria-hidden="true" />}
                      {discussion.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-vutruNhat dark:text-night-muted shrink-0 bg-gray-50 dark:bg-night-elevated px-2.5 py-1 rounded-full text-xs font-bold">
                      <MessageCircle size={14} aria-hidden="true" />
                      <span>{discussion.replyCount}</span>
                    </div>
                  </div>
                  <p className="text-vutruNhat dark:text-night-muted text-sm mt-1 line-clamp-2">{discussion.content}</p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-gray-400 dark:text-night-muted">
                    <span className="font-medium text-gray-500 dark:text-night-text">{discussion.authorName}</span>
                    <span>•</span>
                    <span>{new Date(discussion.createdAt).toLocaleDateString('vi-VN')}</span>
                    {discussion.isResolved && (
                      <>
                        <span>•</span>
                        <span className="text-green-600 dark:text-green-400 font-bold flex items-center gap-1">
                          <CheckCircle size={13} aria-hidden="true" /> Đã giải quyết
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
        {discussions.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-night-surface rounded-2xl border border-dashed border-gray-200 dark:border-night-border">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-gray-100 dark:bg-night-elevated text-vutruNhat dark:text-night-muted flex items-center justify-center">
              <HelpCircle size={24} aria-hidden="true" />
            </div>
            <h3 className="font-bold text-vutru dark:text-night-text">Chưa có câu hỏi nào</h3>
            <p className="text-vutruNhat dark:text-night-muted text-sm mt-1">Hãy là người đầu tiên đặt câu hỏi cho khóa học này</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Đặt câu hỏi mới">
        <form onSubmit={handleCreate} className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-bold text-vutru dark:text-night-text mb-1">Tiêu đề</label>
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="VD: Không hiểu phần React Hooks ở phút 12:00..."
              className="w-full bg-gray-50 dark:bg-night-elevated border border-gray-200 dark:border-night-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-cam/30 focus:border-cam text-vutru dark:text-night-text"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-vutru dark:text-night-text mb-1">Nội dung chi tiết</label>
            <textarea
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              placeholder="Mô tả rõ vấn đề bạn đang gặp phải..."
              className="w-full bg-gray-50 dark:bg-night-elevated border border-gray-200 dark:border-night-border rounded-xl px-4 py-3 min-h-[150px] focus:ring-2 focus:ring-cam/30 focus:border-cam resize-y text-vutru dark:text-night-text"
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-night-border">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button type="submit">Đăng câu hỏi</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CourseDiscussions;
