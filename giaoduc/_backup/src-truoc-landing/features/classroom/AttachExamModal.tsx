import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import api, { getApiErrorMessage } from '../../services/api';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import { classExamApi, ClassExamResponse } from '../../services/classExamApi';
import classService, { ClassFolder } from '../../services/class.service';
import { useToast } from '../../context/ToastContext';
import { buildFolderTree, flattenTree, indentedLabel } from '../../utils/classFolderTree';
import { useNavigate } from 'react-router-dom';
import { Clock, FileText, CheckCircle2, Folder, Calendar, PlusCircle } from 'lucide-react';
import DeadlinePicker from '../../components/common/DeadlinePicker';
import DateTimePicker from '../../components/common/DateTimePicker';
import { toLocalDatetimeInput, toApiDatetimeString } from '../../utils/dateUtils';

interface AttachExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  onSuccess: () => void;
  editData?: ClassExamResponse | null;
}

interface Exam {
  id: string;
  title: string;
  durationMinutes: number;
  questionCount: number;
  createdAt: string;
}

const AttachExamModal: React.FC<AttachExamModalProps> = ({ isOpen, onClose, classId, onSuccess, editData }) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedExamIds, setSelectedExamIds] = useState<string[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [openTime, setOpenTime] = useState('');
  const [closeTime, setCloseTime] = useState('');
  const [folders, setFolders] = useState<ClassFolder[]>([]);
  
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setSelectedExamIds([editData.examId]);
        setSelectedFolderId(editData.folderId || '');
        // Ưu tiên: dùng closeTime của ClassExam nếu đã set, ngược lại dùng examEndTime của đề thi
        const effectiveClose = editData.closeTime || editData.examEndTime || '';
        const effectiveOpen = editData.openTime || editData.examStartTime || '';
        setOpenTime(toLocalDatetimeInput(effectiveOpen));
        setCloseTime(toLocalDatetimeInput(effectiveClose));
        setExams([{ id: editData.examId, title: editData.examTitle, durationMinutes: editData.durationMinutes, questionCount: 0, createdAt: '' }]);
      } else {
        setSelectedExamIds([]);
        setSelectedFolderId('');
        setOpenTime('');
        setCloseTime('');
      }
      fetchData();
    }
  }, [isOpen, editData]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [examsRes, foldersRes] = await Promise.all([
        !editData ? api.get('/exams/teacher?page=0&size=100') : Promise.resolve({ data: { content: [] } }),
        classService.getClassFolders(classId)
      ]);
      if (!editData) {
        setExams(examsRes.data.content || []);
      }
      setFolders(foldersRes || []);
    } catch (err) {
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedExamIds.length === 0) {
      toast.warning('Vui lòng chọn ít nhất một đề thi');
      return;
    }

    setSubmitting(true);
    try {
      if (editData) {
        await classExamApi.updateClassExam(editData.id, {
          openTime: toApiDatetimeString(openTime),
          closeTime: toApiDatetimeString(closeTime),
          folderId: selectedFolderId || undefined
        });
        toast.success('Đã cập nhật cấu hình đề thi!');
      } else {
        await Promise.all(selectedExamIds.map(examId => 
          classExamApi.linkExamToClassroom(classId, {
            examId,
            openTime: toApiDatetimeString(openTime),
            closeTime: toApiDatetimeString(closeTime),
            folderId: selectedFolderId || undefined
          })
        ));
        toast.success(`Đã gắn ${selectedExamIds.length} đề thi thành công!`);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Có lỗi xảy ra') || (editData ? 'Lỗi khi cập nhật đề thi' : 'Lỗi khi gắn đề thi'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateNew = () => {
    navigate(`/exams/create?classId=${classId}`);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editData ? "Cập nhật cấu hình đề thi" : "Gắn đề thi vào lớp"}>
      <div className="w-[600px] max-w-full p-1 text-vutru dark:text-white">
        {loading ? (
          <LoadingOverlay inline={true} text="Đang tải danh sách đề thi..." />
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Exam Selection List */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-vutru dark:text-white mb-3">
                <FileText className="w-4 h-4 text-camDam" />
                {editData ? "Đề thi đang cấu hình" : "Chọn đề thi"} 
                <span className="text-red-500">*</span>
              </label>
              {exams.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-night-elevated rounded-xl border border-dashed border-gray-300 dark:border-night-border text-center">
                  <FileText className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-sm font-medium text-vutruNhat">Bạn chưa có đề thi nào</p>
                  <button 
                    type="button"
                    onClick={handleCreateNew}
                    className="mt-3 text-sm font-medium text-cam hover:text-camDam transition-colors flex items-center gap-1"
                  >
                    <PlusCircle className="w-4 h-4" /> Tạo đề thi ngay
                  </button>
                </div>
              ) : (
                <div className="max-h-[220px] overflow-y-auto rounded-xl border border-gray-200 dark:border-night-border bg-gray-50/50 dark:bg-night-surface p-2 space-y-2 custom-scrollbar">
                  {exams.map(exam => {
                    const isSelected = selectedExamIds.includes(exam.id);
                    return (
                      <div 
                        key={exam.id} 
                        onClick={() => {
                          if (!editData) {
                            if (isSelected) {
                              setSelectedExamIds(selectedExamIds.filter(id => id !== exam.id));
                            } else {
                              setSelectedExamIds([...selectedExamIds, exam.id]);
                            }
                          }
                        }}
                        className={`
                          relative flex items-center gap-4 p-3 rounded-xl border transition-all duration-200 
                          ${editData ? 'cursor-not-allowed opacity-80' : 'cursor-pointer hover:shadow-sm'}
                          ${isSelected 
                            ? 'bg-camNhat/10 border-cam/30 dark:bg-cam/10 dark:border-cam/40 shadow-sm' 
                            : 'bg-white border-gray-100 dark:bg-night-elevated dark:border-night-border hover:border-cam/30'}
                        `}
                      >
                        <div className={`
                          flex items-center justify-center w-5 h-5 rounded-full border transition-colors shrink-0
                          ${isSelected ? 'bg-cam border-cam text-white' : 'border-gray-300 dark:border-gray-600'}
                          ${editData ? 'opacity-50' : ''}
                        `}>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm truncate text-vutru dark:text-white">
                            {exam.title}
                          </h4>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-vutruNhat">
                            <span className="flex items-center gap-1 bg-gray-100 dark:bg-night-border px-1.5 py-0.5 rounded-md">
                              <Clock className="w-3 h-3" /> {exam.durationMinutes} phút
                            </span>
                            {exam.questionCount > 0 && (
                              <span className="flex items-center gap-1 bg-gray-100 dark:bg-night-border px-1.5 py-0.5 rounded-md">
                                <FileText className="w-3 h-3" /> {exam.questionCount} câu
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Folder Selection */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-vutru dark:text-white mb-2">
                <Folder className="w-4 h-4 text-camDam" />
                Chủ đề / Thư mục <span className="text-xs font-normal text-vutruNhat ml-1">(Không bắt buộc)</span>
              </label>
              <div className="relative">
                <Select
                  value={selectedFolderId}
                  onChange={(v) => setSelectedFolderId(v)}
                  className="w-full bg-white dark:bg-night-elevated border border-gray-200 dark:border-night-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cam/20 focus:border-cam transition-all"
                  options={[
                    { value: '', label: '-- Để trống nếu không thuộc chủ đề nào --' },
                    ...flattenTree(buildFolderTree(folders)).map(folder => ({
                      value: folder.id,
                      label: indentedLabel(folder),
                    })),
                  ]}
                />
              </div>
            </div>

            {/* Time Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Thông báo nếu deadline được lấy từ chính đề thi */}
              {editData?.examEndTime && (
                <div className="col-span-full flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100 text-sm text-blue-700">
                  <svg className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    Đề thi này đã được đặt thời gian kết thúc riêng{' '}
                    <strong>({new Date(editData.examEndTime).toLocaleString('vi-VN')})</strong>.
                    Deadline dưới đây được tự động lấy từ đề thi. Bạn có thể ghi đè nếu muốn thay đổi cho lớp này.
                    <button
                      type="button"
                      onClick={() => navigate(`/exams/${editData.examId}/edit`)}
                      className="ml-2 underline font-semibold hover:text-blue-900 transition-colors"
                    >
                      Chỉnh sửa đề thi
                    </button>
                  </span>
                </div>
              )}

              <div className="bg-gray-50/50 dark:bg-night-surface p-3.5 rounded-xl border border-gray-100 dark:border-night-border">
                <DateTimePicker 
                  value={openTime}
                  onChange={setOpenTime}
                  label="Thời gian mở đề thi"
                  showPresets={false}
                />
              </div>
              
              <div className="bg-gray-50/50 dark:bg-night-surface p-3.5 rounded-xl border border-gray-100 dark:border-night-border">
                <DeadlinePicker
                  value={closeTime}
                  onChange={setCloseTime}
                  label={editData?.examEndTime ? "Thời gian đóng đề thi (Hạn nộp từ đề)" : "Thời gian đóng đề thi (Deadline)"}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center mt-2 pt-5 border-t border-gray-100 dark:border-night-border">
              {!editData ? (
                <button 
                  type="button" 
                  onClick={handleCreateNew}
                  className="group flex items-center gap-1.5 text-sm font-medium text-cam hover:text-camDam transition-colors px-2 py-1.5 rounded-lg hover:bg-cam/5"
                >
                  <PlusCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Tạo đề thi mới
                </button>
              ) : <div></div>}

              <div className="flex gap-3">
                <Button 
                  type="button" 
                  variant="secondary"
                  onClick={onClose} 
                  className="px-5 py-2.5 rounded-xl font-medium"
                >
                  Hủy
                </Button>
                <Button 
                  type="submit" 
                  variant="primary"
                  disabled={selectedExamIds.length === 0}
                  isLoading={submitting}
                  className="px-5 py-2.5 rounded-xl font-medium shadow-md shadow-cam/20"
                >
                  {editData ? 'Lưu thay đổi' : 'Xác nhận gắn đề'}
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};

export default AttachExamModal;
