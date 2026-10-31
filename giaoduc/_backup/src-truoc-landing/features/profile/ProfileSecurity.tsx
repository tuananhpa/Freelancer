import { getApiErrorMessage } from '../../services/api';
import React, { useEffect, useState } from 'react';
import { profileApi } from '../../services/profileApi';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import LoadingOverlay from '../../components/ui/LoadingOverlay';


const ProfileSecurity = () => {
  const [authProvider, setAuthProvider] = useState<'LOCAL' | 'GOOGLE'>('LOCAL');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    profileApi.getProfile()
      .then((res) => setAuthProvider(res.data.authProvider))
      .catch(() => setError('Không thể tải thông tin tài khoản.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu nhập lại không khớp.');
      return;
    }

    setSaving(true);
    try {
      await profileApi.changePassword({ currentPassword, newPassword });
      setSuccess('Đổi mật khẩu thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Không thể đổi mật khẩu.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingOverlay text="Đang tải..." />;
  }

  if (authProvider === 'GOOGLE') {
    return (
      <div className="card">
        <h2 className="text-xl font-bold text-vutru mb-4">Bảo mật tài khoản</h2>
        <div className="flex items-start gap-4 p-5 rounded-xl bg-camNhat/60 border border-cam/15">
          <span className="text-3xl">🔐</span>
          <div>
            <p className="font-semibold text-vutru mb-1">Tài khoản Google</p>
            <p className="text-sm text-vutruNhat">
              Bạn đăng nhập bằng Google nên không thể đổi mật khẩu tại đây.
              Vui lòng quản lý mật khẩu qua tài khoản Google của bạn.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-6">
      <div>
        <h2 className="text-xl font-bold text-vutru mb-1">Đổi mật khẩu</h2>
        <p className="text-sm text-vutruNhat">Cập nhật mật khẩu để bảo vệ tài khoản của bạn</p>
      </div>

      {success && (
        <Alert variant="success">{success}</Alert>
      )}
      {error && (
        <Alert variant="error">{error}</Alert>
      )}

      <div className="space-y-4 max-w-md">
        <Input
          label="Mật khẩu hiện tại"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
        <Input
          label="Mật khẩu mới"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={6}
        />
        <Input
          label="Nhập lại mật khẩu mới"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>

      <Button type="submit" isLoading={saving}>
        Cập nhật mật khẩu
      </Button>
    </form>
  );
};

export default ProfileSecurity;
