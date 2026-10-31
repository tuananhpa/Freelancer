import { getApiErrorMessage } from '../../services/api';
import { validateEmailSyntax } from '../../utils/validators';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import AuthShell from '../../components/auth/AuthShell';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    
    const emailError = validateEmailSyntax(email);
    if (emailError) {
      setStatus('error');
      setMessage(emailError);
      return;
    }

    try {
      const response = await api.post('/auth/forgot-password', { email });
      setStatus('success');
      setMessage(response.data.message || 'Vui lòng kiểm tra email của bạn.');
    } catch (err: any) {
      setStatus('error');
      setMessage(getApiErrorMessage(err, 'Có lỗi xảy ra.'));
    }
  };

  return (
    <AuthShell
      title="Quên mật khẩu?"
      subtitle="Nhập email của bạn để nhận link khôi phục"
      footer={
        <Link to="/login" className="text-sm font-medium text-vutruNhat hover:text-cam transition-colors">
          Quay lại đăng nhập
        </Link>
      }
    >
      {status === 'success' ? (
        <div className="text-center">
          <Alert variant="success" className="mb-6">
            {message}
          </Alert>
          <Link to="/login">
            <Button variant="outline" className="w-full">Về trang đăng nhập</Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {status === 'error' && (
            <Alert variant="error" className="mb-6">
              {message}
            </Alert>
          )}

          <Input
            label="Địa chỉ Email"
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="VD: name@domain.com…"
            autoComplete="email"
            spellCheck={false}
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-2"
            isLoading={status === 'loading'}
          >
            Gửi yêu cầu
          </Button>
        </form>
      )}
    </AuthShell>
  );
};

export default ForgotPassword;
