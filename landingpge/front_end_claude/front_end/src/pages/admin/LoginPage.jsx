import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { env } from '@/config/env';
import Brand from '@/components/layout/Brand';

export default function LoginPage() {
  const { login, status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [state, setState] = useState({ sending: false, error: '' });

  if (status === 'authenticated') return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setState({ sending: true, error: '' });
    try {
      await login(email, password);
      navigate(location.state?.from?.pathname || '/admin', { replace: true });
    } catch (err) {
      setState({ sending: false, error: err.message });
    }
  };

  return (
    <div className="login">
      <form className="login__card" onSubmit={submit}>
        <Brand />
        <h1>Đăng nhập quản trị</h1>
        <p style={{ color: 'var(--muted)' }}>Dành cho đội ngũ HYTale và các HTX đối tác.</p>
        <label className="field"><span>Email</span><input className="input" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label className="field"><span>Mật khẩu</span><input className="input" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        {state.error && <p className="form-error" role="alert">{state.error}</p>}
        <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={state.sending}>{state.sending ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
        {env.useMock && <p className="hint">Chế độ demo (mock): dùng tài khoản trong file <code>.env</code> (VITE_MOCK_ADMIN_EMAIL / VITE_MOCK_ADMIN_PASSWORD).</p>}
      </form>
    </div>
  );
}
