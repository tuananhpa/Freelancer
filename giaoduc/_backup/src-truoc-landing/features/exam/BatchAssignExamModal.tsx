import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import { classExamApi, ClassExamResponse } from '../../services/classExamApi';
import classService, { ClassFolder } from '../../services/class.service';
import { useToast } from '../../context/ToastContext';
import { getApiErrorMessage } from '../../services/api';
import DateTimePicker from '../../components/common/DateTimePicker';

interface BatchAssignExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  examId: string;
  examTitle: string;
  onSuccess?: () => void;
}

const BatchAssignExamModal: React.FC<BatchAssignExamModalProps> = ({ isOpen, onClose, examId, examTitle, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [myClasses, setMyClasses] = useState<any[]>([]);
  const [foldersByClass, setFoldersByClass] = useState<Record<string, ClassFolder[]>>({});
  
  // State for assignments
  const [assignments, setAssignments] = useState<Record<string, { folderId: string, openTime: string, closeTime: string }>>({});
  
  const toast = useToast();

  useEffect(() => {
    if (isOpen && examId) {
      fetchData();
    }
  }, [isOpen, examId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch teacher's classes
      const classesRes = await classService.getMyClasses();
      const classes = classesRes.content || classesRes.data?.content || [];
      setMyClasses(classes);
      
      // 2. Fetch current assignments for this exam
      const currentAssignments = await classExamApi.getClassExamsByExamId(examId);
      
      const initialAssignments: Record<string, { folderId: string, openTime: string, closeTime: string }> = {};
      currentAssignments.forEach((ca: ClassExamResponse) => {
        initialAssignments[ca.classroomId] = {
          folderId: ca.folderId || '',
          openTime: ca.openTime ? ca.openTime.slice(0, 16) : '',
          closeTime: ca.closeTime ? ca.closeTime.slice(0, 16) : ''
        };
      });
      setAssignments(initialAssignments);
      
      // 3. Fetch folders for classes that are currently assigned
      const foldersMap: Record<string, ClassFolder[]> = {};
      await Promise.all(
        currentAssignments.map(async (ca: ClassExamResponse) => {
          try {
            const folders = await classService.getClassFolders(ca.classroomId);
            foldersMap[ca.classroomId] = folders || [];
          } catch (e) {
            foldersMap[ca.classroomId] = [];
          }
        })
      );
      setFoldersByClass(foldersMap);
      
    } catch (err) {
      toast.error('Không thể tải dữ liệu lớp học');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleClass = async (classroomId: string) => {
    if (assignments[classroomId]) {
      // Uncheck
      const newAssignments = { ...assignments };
      delete newAssignments[classroomId];
      setAssignments(newAssignments);
    } else {
      // Check
      setAssignments(prev => ({
        ...prev,
        [classroomId]: { folderId: '', openTime: '', closeTime: '' }
      }));
      
      // Fetch folders if not already fetched
      if (!foldersByClass[classroomId]) {
        try {
          const folders = await classService.getClassFolders(classroomId);
          setFoldersByClass(prev => ({ ...prev, [classroomId]: folders || [] }));
        } catch (e) {}
      }
    }
  };

  const handleUpdateAssignment = (classroomId: string, field: 'folderId' | 'openTime' | 'closeTime', value: string) => {
    setAssignments(prev => ({
      ...prev,
      [classroomId]: {
        ...prev[classroomId],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const payload = Object.entries(assignments).map(([classroomId, data]) => ({
        classroomId,
        folderId: data.folderId || undefined,
        openTime: data.openTime ? new Date(data.openTime).toISOString() : undefined,
        closeTime: data.closeTime ? new Date(data.closeTime).toISOString() : undefined
      }));
      
      await classExamApi.batchSyncClassExams(examId, payload);
      toast.success('Cập nhật giao đề thành công!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Lỗi khi đồng bộ giao đề'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Giao đề thi cho các lớp" maxWidth="2xl">
      <div className="w-full space-y-4 font-body">
        <div>
          <h3 className="font-bold text-vutru dark:text-night-text text-base sm:text-lg">{examTitle}</h3>
          <p className="text-xs sm:text-sm text-vutruNhat dark:text-night-muted">Chọn các lớp học để giao đề thi này</p>
        </div>
        
        {loading ? (
          <LoadingOverlay inline={true} text="Đang tải danh sách lớp…" />
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="max-h-[460px] overflow-y-auto pr-1 flex flex-col gap-3 custom-scrollbar">
              {myClasses.length === 0 ? (
                <div className="text-xs sm:text-sm text-vutruNhat dark:text-night-muted italic text-center py-6 bg-gray-50 dark:bg-night-elevated rounded-2xl border border-dashed border-gray-200 dark:border-night-border">
                  Bạn chưa có lớp học nào.
                </div>
              ) : (
                myClasses.map(cls => {
                  const isAssigned = !!assignments[cls.id];
                  return (
                    <div
                      key={cls.id}
                      className={`border-2 rounded-2xl transition-all ${
                        isAssigned
                          ? 'border-cam bg-cam/5 dark:bg-cam/10 shadow-xs'
                          : 'border-gray-200 dark:border-night-border bg-white dark:bg-night-surface hover:border-gray-300 dark:hover:border-night-border'
                      }`}
                    >
                      <label className="flex items-center gap-3 p-3.5 sm:p-4 cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 text-cam accent-cam rounded border-gray-300 focus:ring-cam"
                          checked={isAssigned}
                          onChange={() => handleToggleClass(cls.id)}
                        />
                        <div className="flex-1 font-bold text-vutru dark:text-night-text text-sm sm:text-base">{cls.name}</div>
                        {cls.academicYear && (
                          <div className="text-xs text-vutruNhat dark:text-night-muted px-2.5 py-1 bg-gray-100 dark:bg-night-elevated rounded-lg font-medium">
                            {cls.academicYear}
                          </div>
                        )}
                      </label>
                      
                      {isAssigned && (
                        <div className="p-3.5 sm:p-4 pt-0 border-t border-cam/20 flex flex-col gap-3.5 animate-fade-in">
                          <div>
                            <label className="block text-xs font-bold text-vutru dark:text-night-text mb-1.5">Chủ đề / Thư mục trong lớp</label>
                            <Select
                              value={assignments[cls.id].folderId}
                              onChange={(v) => handleUpdateAssignment(cls.id, 'folderId', v)}
                              className="w-full p-2.5 border-2 border-gray-200 dark:border-night-border rounded-xl text-xs sm:text-sm bg-white dark:bg-night-surface text-vutru dark:text-night-text focus:border-cam outline-none transition-colors"
                              options={[
                                { value: '', label: '-- Chưa phân loại (Chung) --' },
                                ...(foldersByClass[cls.id]?.map(f => ({ value: f.id, label: f.name })) || []),
                              ]}
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <DateTimePicker
                                label="Thời gian mở (Tùy chọn)"
                                value={assignments[cls.id].openTime}
                                onChange={(val) => handleUpdateAssignment(cls.id, 'openTime', val)}
                                showPresets={false}
                              />
                            </div>
                            <div>
                              <DateTimePicker
                                label="Thời gian đóng (Tùy chọn)"
                                value={assignments[cls.id].closeTime}
                                onChange={(val) => handleUpdateAssignment(cls.id, 'closeTime', val)}
                                showPresets={false}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-100 dark:border-night-border">
              <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
                Hủy
              </Button>
              <Button type="submit" variant="primary" isLoading={submitting}>
                Lưu thay đổi
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};

export default BatchAssignExamModal;
