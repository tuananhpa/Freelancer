import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseApi } from '../../services/courseApi';
import { useToast } from '../../context/ToastContext';
import { BookOpen } from 'lucide-react';

const CreateCourse = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      setSubmitting(true);
      await courseApi.createCourse({
        title,
        description,
        status: 'PUBLISHED', // Auto publish for MVP
      });
      toast.success('Tạo khóa học thành công!');
      navigate('/courses');
    } catch (err) {
      console.error(err);
      toast.error('Có lỗi xảy ra khi tạo khóa học.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-camNhat flex items-center justify-center">
          <BookOpen className="w-6 h-6 text-cam" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-vutru font-heading">Tạo khóa học mới</h1>
          <p className="text-vutruNhat">Nhập thông tin cơ bản cho khóa học của bạn</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-vutru mb-2">Tên khóa học *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-cam focus:ring-2 focus:ring-cam/20 outline-none transition-all text-vutru"
              placeholder="VD: Tiếng Anh giao tiếp cơ bản"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-vutru mb-2">Mô tả chi tiết</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-cam focus:ring-2 focus:ring-cam/20 outline-none transition-all text-vutru h-32 resize-none"
              placeholder="Khóa học này sẽ giúp bạn..."
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/courses')}
              className="px-6 py-3 rounded-xl font-bold text-vutruNhat hover:bg-kem transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 rounded-xl font-bold text-white bg-cam hover:bg-camDam shadow-cam hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50"
            >
              {submitting ? 'Đang tạo...' : 'Tạo khóa học'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCourse;
