import React, { useState } from 'react';
import { Course } from '../../../services/courseApi';
import { mediaApi } from '../../../services/mediaApi';
import { useToast } from '../../../context/ToastContext';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

interface OverviewTabProps {
  course: Course;
  onChange: (course: Course) => void;
  onSave: (course: Course) => Promise<void>;
  isSaving: boolean;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ course, onChange, onSave, isSaving }) => {
  const toast = useToast();
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await mediaApi.uploadFile(file, 'image');
      onChange({ ...course, thumbnailUrl: res.url });
      toast.success('Tải ảnh đại diện thành công');
    } catch (err) {
      toast.error('Lỗi khi tải ảnh đại diện');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(course);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl mx-auto">
      <Input
        label="Tên khóa học *"
        value={course.title}
        onChange={e => onChange({ ...course, title: e.target.value })}
        placeholder="VD: Nhập môn React 2026..."
        required
      />
      
      <div>
        <label className="block text-sm font-bold text-vutru mb-3">Mô tả khóa học</label>
        <textarea
          value={course.description}
          onChange={e => onChange({ ...course, description: e.target.value })}
          className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 focus:border-cam focus:ring-4 focus:ring-cam/10 outline-none transition-all text-vutru font-medium h-40 resize-none placeholder:text-gray-400"
          placeholder="Giới thiệu về khóa học này..."
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-vutru mb-3">Ảnh bìa (Thumbnail)</label>
        <div className="flex items-center gap-6">
          {course.thumbnailUrl ? (
            <div className="w-48 h-32 rounded-2xl overflow-hidden shadow-md">
              <img src={course.thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-48 h-32 rounded-2xl bg-kem border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 font-medium">
              Chưa có ảnh
            </div>
          )}
          <div>
            <input type="file" accept="image/*" onChange={handleThumbnailUpload} id="thumb-upload" className="hidden" />
            <label htmlFor="thumb-upload" className="px-6 py-2.5 rounded-full font-bold bg-gray-100 text-vutru hover:bg-gray-200 cursor-pointer transition-colors inline-block">
              Chọn ảnh khác
            </label>
          </div>
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <Button type="submit" variant="primary" size="lg" isLoading={isSaving}>
          Lưu thông tin
        </Button>
      </div>
    </form>
  );
};

export default OverviewTab;
