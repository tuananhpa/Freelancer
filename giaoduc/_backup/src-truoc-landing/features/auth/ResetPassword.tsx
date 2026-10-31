import { getApiErrorMessage } from '../../services/api';
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../services/api';
import AuthShell from '../../components/auth/AuthShell';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Không tìm thấy mã khôi phục.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setStatus('error');
      setMessage('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Mật khẩu nhập lại không khớp.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const response = await api.post('/auth/reset-password', { token, newPassword: password });
      setStatus('success');
      setMessage(response.data.message || 'Đặt lại mật khẩu thành công!');
    } catch (err: any) {
      setStatus('error');
      setMessage(getApiErrorMessage(err, 'Có lỗi xảy ra hoặc token đã hết hạn.'));
    }
  };

  if (!token) {
    return (
      <AuthShell title="Đặt lại mật khẩu">
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">✗</div>
          <p className="text-red-600 font-bold mb-6">{message}</p>
          <Link to="/forgot-password">
            <Button variant="primary" className="w-full">Yêu cầu lại link</Button>
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Đặt lại mật khẩu" subtitle="Nhập mật khẩu mới của bạn">
      {status === 'success' ? (
        <div className="text-center">
          <Alert variant="success" className="mb-6">
            {message}
          </Alert>
          <Link to="/login">
            <Button variant="primary" className="w-full">Đến trang Đăng nhập</Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {status === 'error' && (
            <Alert variant="error">
              {message}
            </Alert>
          )}

          <Input
            label="Mật khẩu mới"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <Input
            label="Nhập lại mật khẩu"
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-2"
            isLoading={status === 'loading'}
          >
            Lưu thay đổi
          </Button>
        </form>
      )}
    </AuthShell>
  );
};

export default ResetPassword;
