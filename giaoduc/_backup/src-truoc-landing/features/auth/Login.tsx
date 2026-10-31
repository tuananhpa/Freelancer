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
        : { studentCode: cleanIdentifier.replace(/\s+/g, ''), password: password_ };
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
      title="Đăng Nhập Hệ Thống"
      footer={
        <p className="text-vutruNhat">
          Chưa có tài khoản?{' '}
          <Link to="/register" state={{ from: location.state?.from }} className="text-cam font-bold hover:text-camDam transition-colors">
            Đăng ký ngay
          </Link>
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
          label="Email hoặc mã số học viên"
          id="identifier"
          name="identifier"
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="VD: email@uranus.edu.vn hoặc 25110194"
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

      {import.meta.env.VITE_DEMO === 'true' && (
        <div className="mt-6 rounded-2xl border-2 border-dashed border-cam/30 bg-camNhat/40 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-camDam mb-3">Bản demo · vào nhanh bằng tài khoản mẫu</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Giáo viên', email: 'giaovien@demo.local', icon: '👩‍🏫' },
              { label: 'Học sinh', email: 'hocsinh@demo.local', icon: '🎒' },
              { label: 'Quản trị', email: 'admin@demo.local', icon: '🛡️' },
            ].map((a) => (
              <button
                key={a.email}
                type="button"
                disabled={isLoading}
                onClick={() => handleSubmit(undefined, { email: a.email, password: 'Demo@123' })}
                className="flex flex-col items-center gap-1 rounded-xl bg-white dark:bg-night-elevated px-2 py-3 text-sm font-bold text-vutru shadow-soft hover:-translate-y-0.5 hover:shadow-cam transition-all disabled:opacity-60"
              >
                <span className="text-2xl" aria-hidden>{a.icon}</span>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </AuthShell>
  );
};

export default Login;
