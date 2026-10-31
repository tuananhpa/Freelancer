import { getApiErrorMessage } from '../../services/api';
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import AuthShell from '../../components/auth/AuthShell';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('expired') === 'true') {
      setError('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.');
      navigate('/login', { replace: true });
    }
  }, [location, navigate]);

  const handleSubmit = async (e?: React.FormEvent, demo?: { email: string; password: string }) => {
    e?.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const identifier_ = demo?.email ?? identifier;
      const password_ = demo?.password ?? password;
      const isEmail = identifier_.includes('@');
      const cleanIdentifier = identifier_.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
      const payload = isEmail
        ? { email: cleanIdentifier, password: password_ }
        : { studentCode: cleanIdentifier.replace(/\s+/g, ''), username: cleanIdentifier, password: password_ };
      const response = await api.post('/auth/login', payload);
      login(response.data.accessToken, response.data.user);
      
      const from = location.state?.from?.pathname + (location.state?.from?.search || '') || '/dashboard';
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Đăng nhập thất bại. Vui lòng kiểm tra lại.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title="Chào mừng trở lại" subtitle="Đăng nhập bằng tên đăng nhập, email hoặc mã học sinh."
      footer={
        <p className="text-vutruNhat">
          Chưa có tài khoản? Liên hệ quản trị viên nhà trường để được cấp.
        </p>
      }
    >
      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Tên đăng nhập, email hoặc mã học sinh"
          id="identifier"
          name="identifier"
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="VD: Admin, email@truong.edu.vn hoặc HS0001"
          autoComplete="username"
          spellCheck={false}
          required
        />

        <div>
          <Input
            label="Mật khẩu"
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
          <div className="flex justify-end mt-2">
            <Link to="/forgot-password" className="text-xs sm:text-sm text-cam font-bold hover:text-camDam transition-colors focus-visible:ring-2 focus-visible:ring-cam rounded outline-none">
              Quên mật khẩu?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full mt-2"
          isLoading={isLoading}
        >
          Đăng nhập
        </Button>
      </form>

    </AuthShell>
  );
};

export default Login;
