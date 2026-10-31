import { getApiErrorMessage } from '../../services/api';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Alert from '../../components/ui/Alert';

const RoleSelection: React.FC = () => {
  const { updateRole, user } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<'STUDENT' | 'TEACHER' | 'TEACHING_ASSISTANT' | null>(null);
  const [securityCode, setSecurityCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selected) return;
    setError('');
    setIsLoading(true);

    try {
      const payload: { role: string; securityCode?: string } = { role: selected };
      if (selected === 'TEACHER' || selected === 'TEACHING_ASSISTANT') {
        if (!securityCode.trim()) {
          setError('Vui lòng nhập mã xác nhận nội bộ.');
          setIsLoading(false);
          return;
        }
        payload.securityCode = securityCode;
      }

      const res = await api.put('/users/me/role', payload);
      updateRole(res.data.role, res.data.accessToken);
      navigate('/dashboard');
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Xác nhận thất bại, vui lòng thử lại.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-shell min-h-[100svh] relative flex flex-col items-center justify-center p-4">
      <div className="auth-shell-bg" aria-hidden="true" />
      {/* Header */}
      <div className="relative z-10 text-center mb-10">
        <div className="auth-shell-brand text-3xl mb-2">Điểm Sáng</div>
        <p className="auth-shell-title text-xl">Chào mừng, {user?.fullName}!</p>
        <p className="auth-shell-subtitle mt-1">Bạn tham gia hệ thống với tư cách là ai?</p>
      </div>

      {/* Role Cards */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-5 w-full max-w-3xl mb-8">
        {/* Student Card */}
        <button
          id="role-student-card"
          type="button"
          onClick={() => { setSelected('STUDENT'); setSecurityCode(''); setError(''); }}
          className={`flex-1 flex flex-col items-center gap-3 p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-cam/20 hover:shadow-lg ${
            selected === 'STUDENT'
              ? 'border-cam bg-cam/5 shadow-cam/30 shadow-lg'
              : 'border-gray-200 bg-white hover:border-cam/40'
          }`}
        >
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold transition-all ${
            selected === 'STUDENT' ? 'bg-cam/15 text-cam' : 'bg-gray-100 text-gray-500'
          }`}>
            S
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-vutru">Học viên</div>
            <div className="text-xs text-gray-400 mt-1">Xem đề thi, luyện Thẻ ghi nhớ</div>
          </div>
          {selected === 'STUDENT' && (
            <div className="w-5 h-5 rounded-full bg-cam flex items-center justify-center mt-auto">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </button>

        {/* Teacher Card */}
        <button
          id="role-teacher-card"
          type="button"
          onClick={() => { setSelected('TEACHER'); setError(''); }}
          className={`flex-1 flex flex-col items-center gap-3 p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-cam/20 hover:shadow-lg ${
            selected === 'TEACHER'
              ? 'border-cam bg-cam/5 shadow-cam/30 shadow-lg'
              : 'border-gray-200 bg-white hover:border-cam/40'
          }`}
        >
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold transition-all ${
            selected === 'TEACHER' ? 'bg-cam/15 text-cam' : 'bg-gray-100 text-gray-500'
          }`}>
            T
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-vutru">Giáo viên</div>
            <div className="text-xs text-gray-400 mt-1">Tạo đề thi, quản lý lớp học</div>
          </div>
          {selected === 'TEACHER' && (
            <div className="w-5 h-5 rounded-full bg-cam flex items-center justify-center mt-auto">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </button>

        {/* Teaching Assistant Card */}
        <button
          id="role-assistant-card"
          type="button"
          onClick={() => { setSelected('TEACHING_ASSISTANT'); setError(''); }}
          className={`flex-1 flex flex-col items-center gap-3 p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-cam/20 hover:shadow-lg ${
            selected === 'TEACHING_ASSISTANT'
              ? 'border-cam bg-cam/5 shadow-cam/30 shadow-lg'
              : 'border-gray-200 bg-white hover:border-cam/40'
          }`}
        >
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold transition-all ${
            selected === 'TEACHING_ASSISTANT' ? 'bg-cam/15 text-cam' : 'bg-gray-100 text-gray-500'
          }`}>
            TA
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-vutru">Trợ giảng</div>
            <div className="text-xs text-gray-400 mt-1">Hỗ trợ giảng dạy, chấm bài</div>
          </div>
          {selected === 'TEACHING_ASSISTANT' && (
            <div className="w-5 h-5 rounded-full bg-cam flex items-center justify-center mt-auto">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </button>
      </div>

      {/* Teacher / Assistant Security Code Input */}
      {(selected === 'TEACHER' || selected === 'TEACHING_ASSISTANT') && (
        <div className="relative z-10 w-full max-w-sm mb-6 animate-fade-in">
          <label className="block text-sm font-semibold text-vutru mb-2" htmlFor="security-code">
            Mã xác nhận nội bộ (do trung tâm cấp)
          </label>
          <input
            id="security-code"
            type="password"
            placeholder="Nhập mã bảo mật..."
            value={securityCode}
            onChange={e => { setSecurityCode(e.target.value); setError(''); }}
            className="w-full p-3 border-2 border-cam/30 rounded-xl focus:outline-none focus:border-cam focus:ring-2 focus:ring-cam/20 transition-all text-vutru"
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <Alert variant="error" className="relative z-10 w-full max-w-sm mb-4">
          {error}
        </Alert>
      )}

      {/* Confirm Button */}
      {selected && (
        <button
          id="role-confirm-btn"
          onClick={handleSubmit}
          disabled={isLoading}
          className="relative z-10 w-full max-w-sm p-4 rounded-xl font-bold text-white bg-cam hover:bg-camDam shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Đang xử lý...' : 'Xác nhận vai trò'}
        </button>
      )}
    </div>
  );
};

export default RoleSelection;
