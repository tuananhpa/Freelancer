import { env } from '@/config/env';
import { http } from '@/services/http/client';

/**
 * Upload ảnh/video. Backend: POST /admin/uploads (multipart, field "file") -> { url }.
 * Ở chế độ mock: trả về object URL tạm (chỉ sống trong phiên trình duyệt).
 */
export const uploadService = {
  async upload(file) {
    if (env.useMock) return { url: URL.createObjectURL(file), name: file.name, mock: true };
    const form = new FormData();
    form.append('file', file);
    return http.post('/admin/uploads', form);
  },
};
