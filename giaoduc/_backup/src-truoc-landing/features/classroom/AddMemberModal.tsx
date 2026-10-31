import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import classService from '../../services/class.service';
import Modal from '../../components/ui/Modal';
import { Mail, Shield, UserCheck, GraduationCap, UserPlus, Check } from 'lucide-react';

interface AddMemberModalProps {
  classId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({ classId, isOpen, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'TEACHER' | 'TA' | 'STUDENT'>('STUDENT');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Vui lòng nhập địa chỉ email');
      return;
    }

    try {
      setLoading(true);
      await classService.addMember(classId, email.trim(), role);
      toast.success('Đã thêm thành viên vào lớp học thành công!');
      onSuccess();
      onClose();
      setEmail('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể thêm thành viên. Vui lòng kiểm tra lại email.');
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    {
      id: 'STUDENT' as const,
      label: 'Học sinh',
      icon: <GraduationCap size={16} className="text-blue-500" />,
      desc: 'Tham gia học tập, làm bài tập, làm bài thi và thảo luận trong lớp.',
    },
    {
      id: 'TA' as const,
      label: 'Trợ giảng (TA)',
      icon: <Shield size={16} className="text-purple-500" />,
      desc: 'Hỗ trợ giảng dạy, chấm điểm bài tập tự luận và quản lý bài nộp.',
    },
    {
      id: 'TEACHER' as const,
      label: 'Giáo viên đồng giảng (Co-Teacher)',
      icon: <UserCheck size={16} className="text-cam" />,
      desc: 'Toàn quyền chỉnh sửa lớp, tạo bài tập, đề thi và quản lý thành viên.',
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !loading && onClose()}
      title="Thêm thành viên vào lớp"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="p-5 space-y-5 text-vutru dark:text-night-text">
        <p className="text-xs text-vutruNhat dark:text-night-muted">
          Nhập email tài khoản Điểm Sáng của người dùng để thêm họ vào danh sách thành viên lớp học.
        </p>

        {/* Email Input */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-vutru dark:text-night-text mb-1.5">
            <Mail size={14} className="text-cam" />
            Email tài khoản <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="VD: hocsinh@gmail.com"
            className="w-full px-4 py-2.5 bg-white dark:bg-night-elevated border border-gray-200 dark:border-night-border rounded-xl text-sm font-medium focus:outline-none focus:border-cam focus:ring-2 focus:ring-cam/20 transition-all text-vutru dark:text-night-text"
            required
            autoFocus
          />
        </div>

        {/* Role Select Options */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-vutru dark:text-night-text mb-1.5">
            Chọn vai trò trong lớp
          </label>
          <div className="space-y-2">
            {roleOptions.map((opt) => {
              const isSelected = role === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => setRole(opt.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'border-cam bg-camNhat/20 dark:bg-cam/10 shadow-2xs'
                      : 'border-gray-200 dark:border-night-border bg-white dark:bg-night-elevated hover:border-gray-300 dark:hover:border-night-muted/50'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">{opt.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-bold ${isSelected ? 'text-camDam dark:text-cam' : 'text-vutru dark:text-night-text'}`}>
                        {opt.label}
                      </p>
                      {isSelected && <Check size={16} className="text-cam" />}
                    </div>
                    <p className="text-xs text-vutruNhat dark:text-night-muted mt-0.5">
                      {opt.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-night-border">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-vutruNhat hover:text-vutru dark:text-night-muted dark:hover:text-night-text rounded-xl hover:bg-gray-100 dark:hover:bg-night-elevated transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="px-5 py-2 text-xs font-extrabold text-white bg-cam hover:bg-camDam rounded-xl shadow-soft transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang thêm...</span>
              </>
            ) : (
              <>
                <UserPlus size={14} />
                <span>Thêm thành viên</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddMemberModal;
