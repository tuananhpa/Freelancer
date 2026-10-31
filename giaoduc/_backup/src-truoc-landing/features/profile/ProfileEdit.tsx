import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import AvatarPicker from '../../components/common/AvatarPicker';
import { profileApi, UserProfile } from '../../services/profileApi';
import { flashcardApi } from '../../services/flashcardApi';
import classService, { Classroom } from '../../services/class.service';
import api, { uploadFile, getApiErrorMessage } from '../../services/api';
import { compressImageFile } from '../../utils/imageUtils';
import { BookOpen, Plus, Users, Loader2 } from 'lucide-react';
import LoadingOverlay from '../../components/ui/LoadingOverlay';

/** Landing-style label: "Tiếng Anh thầy Bùi Đức Hoàng" */
function teacherHonorific(fullName: string): 'thầy' | 'cô' {
  return /\bThị\b/.test(fullName) ? 'cô' : 'thầy';
}

function formatEnrolledClassLabel(cls: Classroom): string {
  const subject = cls.subject?.trim();
  const teacher = cls.teacherName?.trim();
  if (subject && teacher) {
    return `${subject} ${teacherHonorific(teacher)} ${teacher}`;
  }
  return cls.name;
}

const DEFAULT_AVATARS = [
  'https://api.dicebear.com/7.x/notionists/svg?seed=Nala&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Garfield&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Tinkerbell&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Jack&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Avery&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Jessica&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Jude&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Mimi&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Sasha&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam&backgroundColor=ffdfbf',
];

const ProfileEdit = () => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ exams: 0, flashcards: 0 });
  const [classes, setClasses] = useState<Classroom[]>([]);
  const isStudent = user?.role === 'STUDENT';

  useEffect(() => {
    const load = async () => {
      try {
        const [profileRes, historyRes, decksRes, classesRes] = await Promise.all([
          profileApi.getProfile(),
          api.get('/exams/history').catch(() => ({ data: { content: [], totalElements: 0 } as any })),
          flashcardApi.getMyDecks().catch(() => ({ data: { content: [], totalElements: 0 } as any })),
          classService.getMyClasses().catch(() => null),
        ]);
        const data = profileRes.data;
        setProfile(data);
        setFullName(data.fullName);
        setPhone(data.phone || '');
        setAvatarUrl(data.avatarUrl || '');
        setStats({
          exams: historyRes.data?.totalElements ?? historyRes.data?.content?.length ?? 0,
          flashcards: decksRes.data?.totalElements ?? decksRes.data?.content?.length ?? 0,
        });
        const classList = classesRes?.content || classesRes?.data?.content || [];
        setClasses(Array.isArray(classList) ? classList : []);
      } catch {
        setError('Không thể tải thông tin hồ sơ.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setError('');
    try {
      const dataUrl = await compressImageFile(file);
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const fileToUpload = new File([blob], file.name || 'avatar.jpg', { type: 'image/jpeg' });
      const uploadRes = await uploadFile(fileToUpload);
      const newUrl = uploadRes.fileUrl;
      setAvatarUrl(newUrl);
      updateUser({ avatarUrl: newUrl });

      // Auto save avatar to profile
      await profileApi.updateProfile({
        fullName: (fullName || user?.fullName || '').trim(),
        phone: phone.trim() || undefined,
        avatarUrl: newUrl,
      });
      setSuccess('Đã cập nhật và lưu ảnh đại diện thành công!');
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Không thể tải ảnh đại diện lên server.'));
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleSelectPresetAvatar = async (url: string) => {
    setAvatarUrl(url);
    updateUser({ avatarUrl: url || null });
    try {
      await profileApi.updateProfile({
        fullName: (fullName || user?.fullName || '').trim(),
        phone: phone.trim() || undefined,
        avatarUrl: url || undefined,
      });
      setSuccess('Đã cập nhật ảnh đại diện!');
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const res = await profileApi.updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
      });
      updateUser({
        fullName: res.data.fullName,
        avatarUrl: res.data.avatarUrl || null,
      });
      setProfile(res.data);
      setSuccess('Cập nhật hồ sơ thành công!');
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Không thể cập nhật hồ sơ.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingOverlay text="Đang tải hồ sơ..." />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="card text-center !py-5">
          <p className="text-2xl font-bold text-camDam">{stats.exams}</p>
          <p className="text-xs text-vutruNhat mt-1">Bài thi đã làm</p>
        </div>
        <div className="card text-center !py-5">
          <p className="text-2xl font-bold text-camDam">{stats.flashcards}</p>
          <p className="text-xs text-vutruNhat mt-1">Bộ thẻ ghi nhớ</p>
        </div>
        <div className="card text-center !py-5 col-span-2 sm:col-span-1">
          <p className="text-2xl font-bold text-camDam">
            {profile?.createdAt
              ? new Date(profile.createdAt).toLocaleDateString('vi-VN')
              : '—'}
          </p>
          <p className="text-xs text-vutruNhat mt-1">Ngày tham gia</p>
        </div>
      </div>

      {isStudent && (
        <section className="card space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-vutru">Lớp đã đăng ký</h2>
              <p className="text-sm text-vutruNhat mt-1">
                Các lớp học bạn đang tham gia trên hệ thống.
              </p>
            </div>
            <Link to="/classes" className="btn btn-vien text-sm">
              Xem tất cả lớp
            </Link>
          </div>

          {classes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 px-4 py-8 text-center">
              <BookOpen className="mx-auto mb-3 text-vutruNhat" size={28} />
              <p className="text-sm font-medium text-vutru">Chưa có lớp nào</p>
              <p className="text-xs text-vutruNhat mt-1">
                Tham gia lớp bằng mã mời hoặc đăng ký qua mã học sinh của trung tâm.
              </p>
              <Link to="/classes" className="inline-block mt-4 text-sm font-semibold text-camDam hover:underline">
                Đi tới Lớp học
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {classes.map((cls) => (
                <li key={cls.id}>
                  <Link
                    to={`/classes/${cls.id}`}
                    className="flex items-start gap-3 py-3.5 -mx-1 px-1 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className={`w-11 h-11 rounded-xl shrink-0 bg-cover bg-center flex items-center justify-center text-white font-bold text-sm overflow-hidden ${
                        cls.thumbnail ? '' : 'bg-cam'
                      }`}
                      style={cls.thumbnail ? { backgroundImage: `url(${cls.thumbnail})` } : undefined}
                    >
                      {!cls.thumbnail && (cls.name?.charAt(0) || 'L').toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-vutru truncate">
                        {formatEnrolledClassLabel(cls)}
                      </p>
                      <p className="text-xs text-vutruNhat/80 mt-1 flex items-center gap-1">
                        <Users size={12} />
                        {cls.memberCount ?? 0} thành viên
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <form onSubmit={handleSubmit} className="card space-y-6">
        <h2 className="text-xl font-bold text-vutru">Thông tin cá nhân</h2>

        {success && (
          <div className="px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
            {success}
          </div>
        )}
        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 border-b border-gray-100">
          <AvatarPicker
            fullName={fullName || user?.fullName || 'Người dùng'}
            avatarUrl={avatarUrl || null}
            onAvatarChange={(newUrl) => handleSelectPresetAvatar(newUrl)}
            size="xl"
          />
          <div className="flex-1 w-full text-center sm:text-left">
            <p className="text-sm font-semibold text-vutru mb-2">Ảnh hồ sơ</p>
            
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start items-center">
              <button
                type="button"
                onClick={() => handleSelectPresetAvatar('')}
                className={`w-10 h-10 rounded-full border-2 transition-all overflow-hidden bg-gray-100 flex items-center justify-center text-vutru font-bold hover:bg-gray-200 shrink-0 ${
                  !avatarUrl ? 'border-cam ring-2 ring-cam/30 ring-offset-1 scale-110 z-10' : 'border-transparent'
                }`}
                title="Avatar mặc định"
              >
                {(fullName || user?.fullName || 'N').charAt(0).toUpperCase()}
              </button>
              {DEFAULT_AVATARS.map((url) => {
                const isSelected = avatarUrl === url;
                return (
                  <button
                    key={url}
                    type="button"
                    onClick={() => handleSelectPresetAvatar(url)}
                    className={`w-10 h-10 rounded-full border-2 transition-all overflow-hidden hover:opacity-90 shrink-0 ${
                      isSelected ? 'border-cam ring-2 ring-cam/30 ring-offset-1 scale-110 z-10' : 'border-transparent hover:scale-110'
                    }`}
                    title="Chọn avatar"
                  >
                    <img src={url} alt="Avatar" className="w-full h-full object-cover" />
                  </button>
                );
              })}
              
              <label
                htmlFor="avatar-upload-input"
                className={`w-10 h-10 rounded-full border-2 border-dashed border-gray-300 transition-all bg-white hover:border-cam hover:text-cam flex items-center justify-center text-gray-400 shrink-0 cursor-pointer hover:scale-110 mb-0 ${uploadingAvatar ? 'opacity-50 pointer-events-none' : ''}`}
                title="Tải ảnh lên từ máy tính"
              >
                {uploadingAvatar ? <Loader2 size={18} className="animate-spin text-cam" /> : <Plus size={18} />}
              </label>

              <input
                id="avatar-upload-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarFileSelect}
                disabled={uploadingAvatar}
              />
            </div>
            
            <p className="text-xs text-vutruNhat mt-4">
              Chọn ảnh có sẵn ở trên, hoặc bấm dấu cộng để tải ảnh của riêng bạn lên (tự động lưu vào hệ thống).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-vutru mb-2">Họ và tên</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cam/30 focus:border-cam"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-vutru mb-2">Email</label>
            <input
              type="email"
              value={profile?.email || user?.email || ''}
              disabled
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-vutruNhat cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-vutru mb-2">Số điện thoại</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0912 345 678"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cam/30 focus:border-cam"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-vutru mb-2">Phương thức đăng nhập</label>
            <input
              type="text"
              value={profile?.authProvider === 'GOOGLE' ? 'Google' : 'Email & Mật khẩu'}
              disabled
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-vutruNhat cursor-not-allowed"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <Button type="submit" isLoading={saving} className="w-full sm:w-auto">
            Lưu thay đổi
          </Button>
          <Link to="/profile/security" className="btn btn-vien">
            Đổi mật khẩu
          </Link>
        </div>
      </form>
    </div>
  );
};

export default ProfileEdit;
