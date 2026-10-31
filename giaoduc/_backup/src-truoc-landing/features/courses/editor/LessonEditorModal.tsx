import React, { useState } from 'react';
import { Settings, X, Video, Type, Trash2, CheckCircle2 } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Lesson } from '../../../services/courseApi';
import { mediaApi } from '../../../services/mediaApi';
import { useToast } from '../../../context/ToastContext';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import LessonMediaPlayer from '../../../components/common/LessonMediaPlayer';

import Portal from '../../../components/ui/Portal';
interface LessonEditorModalProps {
  lesson: Lesson;
  onClose: () => void;
  onSave: (data: Partial<Lesson>) => Promise<void>;
}

const LessonEditorModal: React.FC<LessonEditorModalProps> = ({ lesson, onClose, onSave }) => {
  const toast = useToast();
  const [title, setTitle] = useState(lesson.title);
  const [content, setContent] = useState(lesson.content || '');
  const [resourceUrl, setResourceUrl] = useState(lesson.resourceUrl || '');
  const [uploading, setUploading] = useState(false);

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const res = await mediaApi.uploadFile(file, 'video');
      setResourceUrl(res.url);
      toast.success('Tải video bài học thành công');
    } catch (err) {
      toast.error('Lỗi khi tải video bài học');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Portal><div className="fixed inset-0 z-50 flex items-center justify-center bg-vutru/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-3xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-kem/50">
          <h2 className="text-xl font-bold text-vutru flex items-center gap-2">
            <Settings className="w-5 h-5 text-cam" /> Chỉnh sửa Bài học
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-vutru bg-white rounded-full shadow-sm">
             <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 space-y-8">
          <Input 
            label="Tên bài học"
            value={title} 
            onChange={e => setTitle(e.target.value)} 
          />

          <div>
            <label className="block text-sm font-bold text-vutru mb-2 flex items-center gap-2">
              <Video className="w-4 h-4" /> Video bài giảng
            </label>
            {resourceUrl ? (
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-video mb-3">
                <LessonMediaPlayer url={resourceUrl} className="w-full h-full object-contain" />
                <button onClick={() => setResourceUrl('')} className="absolute top-3 right-3 bg-red-100 text-red-600 p-2 rounded-full hover:bg-red-200 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="w-full rounded-2xl border-2 border-dashed border-gray-300 p-8 text-center bg-gray-50">
                <Video className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-vutruNhat mb-4">Tải video bài giảng lên Cloudinary</p>
                <input type="file" accept="video/*" onChange={handleVideoUpload} id="video-upload" className="hidden" />
                <label htmlFor="video-upload" className="btn bg-vutru text-white hover:bg-vutru/90 cursor-pointer inline-flex">
                  {uploading ? 'Đang upload...' : 'Chọn Video'}
                </label>
              </div>
            )}
            <Input 
              value={resourceUrl} 
              onChange={e => setResourceUrl(e.target.value)} 
              placeholder="Hoặc dán URL YouTube / Video vào đây..."
              className="mt-3"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-vutru mb-2 flex items-center gap-2">
              <Type className="w-4 h-4" /> Nội dung văn bản
            </label>
            <div className="bg-white rounded-xl overflow-hidden border-2 border-gray-100 focus-within:border-cam focus-within:ring-4 focus-within:ring-cam/10 transition-all">
              <ReactQuill 
                theme="snow" 
                value={content} 
                onChange={setContent} 
                className="h-48 border-none"
              />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <Button onClick={onClose} variant="ghost">
            Hủy
          </Button>
          <Button 
            onClick={() => onSave({ title, content, resourceUrl })}
            variant="primary"
            iconLeft={<CheckCircle2 className="w-5 h-5" />}
          >
            Lưu bài học
          </Button>
        </div>
      </div>
    </div></Portal>
  );
};

export default LessonEditorModal;
