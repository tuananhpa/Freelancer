import { getApiErrorMessage } from '../../services/api';
import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../services/api';
import AuthShell from '../../components/auth/AuthShell';
import Button from '../../components/ui/Button';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Không tìm thấy mã xác thực.');
      return;
    }

    const verify = async () => {
      try {
        const response = await api.post(`/auth/verify?token=${token}`);
        setStatus('success');
        setMessage(response.data.message || 'Xác thực email thành công!');
      } catch (err: any) {
        setStatus('error');
        setMessage(getApiErrorMessage(err, 'Xác thực thất bại hoặc token đã hết hạn.'));
      }
    };

    verify();
  }, [token]);

  return (
    <AuthShell title="Xác thực Email">
      {status === 'loading' && (
        <p className="text-center text-vutruNhat">Đang xác thực tài khoản của bạn. Vui lòng chờ...</p>
      )}

      {status === 'success' && (
        <div className="text-center">
          <div className="text-green-500 text-5xl mb-4">✓</div>
          <p className="text-green-600 font-bold mb-6">{message}</p>
          <Link to="/login">
            <Button variant="primary" className="w-full">Tiếp tục đăng nhập</Button>
          </Link>
        </div>
      )}

      {status === 'error' && (
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">✗</div>
          <p className="text-red-600 font-bold mb-6">{message}</p>
          <Link to="/login">
            <Button variant="outline" className="w-full">Về trang đăng nhập</Button>
          </Link>
        </div>
      )}
    </AuthShell>
  );
};

export default VerifyEmail;
