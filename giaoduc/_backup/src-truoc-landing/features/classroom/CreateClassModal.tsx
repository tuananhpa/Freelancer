import { getApiErrorMessage } from '../../services/api';
import React, { useState } from 'react';
import classService from '../../services/class.service';
import Alert from '../../components/ui/Alert';
import { uploadFile } from '../../services/api';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import { useToast } from '../../context/ToastContext';
import { CLASS_COVER_PRESETS, getDefaultCoverForSubject } from '../../utils/classThemes';

const SUBJECT_TO_COVER_KEY: Record<string, string> = {
  'Toán học': 'MATH',
  'Vật lý': 'PHYSICS',
  'Hóa học': 'CHEMISTRY',
  'Sinh học': 'BIOLOGY',
  'Ngữ văn': 'LITERATURE',
  'Tiếng Anh': 'ENGLISH',
  'Lịch sử': 'HISTORY',
  'Địa lý': 'HISTORY',
  'Tin học': 'INFORMATICS',
  'Công nghệ': 'INFORMATICS',
};
import { Upload, Check, Image as ImageIcon } from 'lucide-react';

import Portal from '../../components/ui/Portal';
interface CreateClassModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const SUBJECTS = [
  'Toán học', 'Vật lý', 'Hóa học', 'Sinh học',
  'Ngữ văn', 'Tiếng Anh', 'Lịch sử', 'Địa lý',
  'Giáo dục công dân', 'Tin học', 'Công nghệ', 'Khác'
];

const CreateClassModal: React.FC<CreateClassModalProps> = ({ onClose, onSuccess }) => {
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: '',
    subject: SUBJECTS[0],
    description: '',
    thumbnail: getDefaultCoverForSubject(SUBJECT_TO_COVER_KEY[SUBJECTS[0]]),
    teacherId: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [teachers, setTeachers] = useState<any[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const { adminApi } = await import('../../services/adminApi');
        const res = await adminApi.getAllUsers(0, 100, '', 'TEACHER', 'ACTIVE');
        setTeachers(res.content || []);
      } catch (err) {
        console.error('Failed to fetch teachers:', err);
      }
    };
    fetchTeachers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubjectChange = (newSubject: string) => {
    const coverKey = SUBJECT_TO_COVER_KEY[newSubject];
    const defaultCover = getDefaultCoverForSubject(coverKey);
    setFormData({ ...formData, subject: newSubject, thumbnail: defaultCover });
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      setError('');
      const { fileUrl } = await uploadFile(file);
      setFormData((prev: any) => ({ ...prev, thumbnail: fileUrl }));
    } catch (err: any) {
      setError('Lỗi khi tải ảnh lên');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Tên lớp là bắt buộc');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await classService.createClass({
        name: formData.name,
        subject: formData.subject,
        section: formData.description, // map description to section in backend
        thumbnail: formData.thumbnail,
        teacherId: formData.teacherId || undefined
      });
      toast.success('Tạo lớp học thành công!');
      onSuccess();
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Lỗi khi tạo lớp học'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Portal><div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs transition-opacity" aria-hidden="true" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom text-left overflow-hidden transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full bg-white dark:bg-night-surface rounded-3xl shadow-xl border border-gray-100 dark:border-night-border">
          <form onSubmit={handleSubmit}>
            <div className="px-6 pt-6 pb-4">
              <h3 className="text-xl font-heading font-bold text-vutru dark:text-night-text mb-5" id="modal-title">
                Tạo lớp học mới
              </h3>
              
              {error && (
                <Alert variant="error" className="mb-4">
                  {error}
                </Alert>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-vutruNhat dark:text-night-muted mb-1.5">
                    Tên lớp học (Bắt buộc)
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-night-elevated border border-gray-200 dark:border-night-border rounded-xl text-sm focus:border-cam focus:outline-none transition-colors"
                    placeholder="VD: 12A1 • Chuyên đề Toán Vận Dụng Cao"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="teacherId" className="block text-xs font-bold uppercase tracking-wider text-vutruNhat dark:text-night-muted mb-1.5">
                      Giáo viên phụ trách
                    </label>
                    <Select
                      value={formData.teacherId}
                      onChange={(v) => setFormData({ ...formData, teacherId: v })}
                      className="w-full px-3.5 py-2.5 bg-gray-50/50 dark:bg-night-elevated border border-gray-200 dark:border-night-border rounded-xl text-sm focus:border-cam focus:outline-none transition-colors"
                      options={[
                        { value: '', label: '-- Mặc định (Tài khoản của bạn) --' },
                        ...teachers.map(teacher => ({ value: teacher.id, label: `${teacher.fullName} (${teacher.email})` })),
                      ]}
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-xs font-bold uppercase tracking-wider text-vutruNhat dark:text-night-muted mb-1.5">
                      Môn học
                    </label>
                    <Select
                      value={formData.subject}
                      onChange={handleSubjectChange}
                      className="w-full px-3.5 py-2.5 bg-gray-50/50 dark:bg-night-elevated border border-gray-200 dark:border-night-border rounded-xl text-sm focus:border-cam focus:outline-none transition-colors"
                      options={SUBJECTS.map((sub) => ({ value: sub, label: sub }))}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="description" className="block text-xs font-bold uppercase tracking-wider text-vutruNhat dark:text-night-muted mb-1.5">
                    Mô tả / Ca học / Phòng học
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={2}
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-gray-50/50 dark:bg-night-elevated border border-gray-200 dark:border-night-border rounded-xl text-sm focus:border-cam focus:outline-none transition-colors resize-none"
                    placeholder="VD: Tối Thứ 3 & 5 (19:30 - 21:00) • Phòng 201"
                  />
                </div>

                {/* Cover Theme Picker */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-vutruNhat dark:text-night-muted">
                      Chọn ảnh bìa lớp học (Sáng sủa & Rực rỡ)
                    </label>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="text-xs font-bold text-cam hover:text-camDam flex items-center gap-1"
                    >
                      <Upload size={12} strokeWidth={2} />
                      <span>{isUploading ? 'Đang tải...' : 'Tải ảnh từ máy'}</span>
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleThumbnailUpload}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
                    {CLASS_COVER_PRESETS.map((preset) => {
                      const isSelected = formData.thumbnail === preset.url;
                      return (
                        <div
                          key={preset.id}
                          onClick={() => setFormData({ ...formData, thumbnail: preset.url })}
                          className={`relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all group ${
                            isSelected
                              ? 'border-cam ring-2 ring-cam/30 shadow-md scale-[1.02]'
                              : 'border-gray-200 dark:border-night-border hover:border-cam/40 hover:shadow-xs'
                          }`}
                        >
                          <div className="h-16 w-full bg-cover bg-center" style={{ backgroundImage: `url(${preset.url})` }}>
                            <div className="w-full h-full bg-gradient-to-t from-black/55 via-black/15 to-transparent p-1.5 flex flex-col justify-between">
                              <span className="self-start text-[9px] font-bold px-1.5 py-0.2 rounded bg-black/45 text-white backdrop-blur-xs">
                                {preset.subject}
                              </span>
                              {isSelected && (
                                <span className="self-end w-4 h-4 rounded-full bg-cam text-white flex items-center justify-center shadow-xs">
                                  <Check size={10} strokeWidth={3} />
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="p-1.5 bg-white dark:bg-night-surface text-[10px] font-bold text-vutru dark:text-night-text truncate">
                            {preset.name}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 flex flex-col-reverse sm:flex-row sm:justify-end border-t border-gray-100 gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                className="w-full sm:w-auto"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={loading}
                className="w-full sm:w-auto"
              >
                Tạo lớp
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div></Portal>
  );
};

export default CreateClassModal;
