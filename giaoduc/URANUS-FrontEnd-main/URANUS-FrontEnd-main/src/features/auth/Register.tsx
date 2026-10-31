import { getApiErrorMessage } from '../../services/api';
import { validateEmailSyntax } from '../../utils/validators';
import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { OtpInput } from '../../components/common/OtpInput';
import { authApi } from '../../services/authApi';
import { studentProfileApi, StudentProfileInfo } from '../../services/studentProfileApi';
import AuthShell from '../../components/auth/AuthShell';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import { Info, CheckCircle, BookText } from 'lucide-react';
import Alert from '../../components/ui/Alert';

const Register = () => {
  // Student code registration state
  const [studentCode, setStudentCode] = useState('');
  const [verifyFullName, setVerifyFullName] = useState('');
  const [verifiedProfile, setVerifiedProfile] = useState<StudentProfileInfo | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [scFormData, setScFormData] = useState({ dateOfBirth: '', email: '', password: '', confirmPassword: '' });
  const [scError, setScError] = useState('');
  const [scLoading, setScLoading] = useState(false);
  const [scSuccess, setScSuccess] = useState('');
  
  // OTP Verification state
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const handleVerifyCode = async () => {
    const cleanCode = studentCode.replace(/[\u200B-\u200D\uFEFF\s]/g, '').trim();
    const cleanName = verifyFullName.normalize('NFC').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim();

    if (!cleanCode) {
      setScError('Vui lòng nhập Mã số học sinh trên phiếu đăng ký.');
      return;
    }
    if (!cleanName) {
      setScError('Vui lòng nhập Họ và tên chính xác của học sinh.');
      return;
    }

    setVerifying(true);
    setScError('');
    setVerifiedProfile(null);
    try {
      const profile = await studentProfileApi.verifyStudentCode(cleanCode, cleanName);
      if (profile.userId && profile.userStatus !== 'INACTIVE') {
        setScError('Mã số học sinh này đã được liên kết với một tài khoản. Vui lòng đăng nhập.');
        return;
      }
      setVerifiedProfile(profile);
    } catch (err: any) {
      setScError(getApiErrorMessage(err, 'Mã số học sinh hoặc họ và tên không khớp trong hệ thống.'));
    } finally {
      setVerifying(false);
    }
  };

  const handleStudentCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setScError('');
    if (scFormData.password !== scFormData.confirmPassword) { setScError('Mật khẩu nhập lại không khớp.'); return; }
    if (scFormData.password.length < 6) { setScError('Mật khẩu phải có ít nhất 6 ký tự.'); return; }
    
    const emailError = validateEmailSyntax(scFormData.email);
    if (emailError) { setScError(emailError); return; }

    const cleanCode = studentCode.replace(/[\u200B-\u200D\uFEFF\s]/g, '').trim();
    const cleanDob = scFormData.dateOfBirth.trim().replace(/-/g, '/').replace(/\./g, '/');
    
    setScLoading(true);
    try {
      const res = await studentProfileApi.registerWithStudentCode({
        studentCode: cleanCode,
        dateOfBirth: cleanDob,
        email: scFormData.email.trim(),
        password: scFormData.password,
      });
      setIsVerifyingOtp(true);
      setScSuccess('Mã xác nhận đã được gửi đến email của bạn.');
    } catch (err: any) {
      setScError(getApiErrorMessage(err, 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.'));
    } finally {
      setScLoading(false);
    }
  };

  return (
    <>
      {otpLoading && <LoadingOverlay text="Đang kích hoạt…" />}
      {scLoading && <LoadingOverlay text="Đang xử lý…" />}
      <AuthShell
        title="Tạo Tài Khoản Mới"
        footer={
          <p className="text-vutruNhat dark:text-night-muted">
            Đã có tài khoản?{' '}
            <Link to="/login" state={{ from: location.state?.from }} className="text-cam font-bold hover:text-camDam transition-colors focus-visible:ring-2 focus-visible:ring-cam rounded outline-none">
              Đăng nhập ngay
            </Link>
          </p>
        }
      >
        {isVerifyingOtp ? (
          <div className="space-y-4">
            <h2 className="font-bold text-xl text-center mb-2 font-body text-vutru dark:text-night-text">Xác thực Email</h2>
            {scSuccess && <Alert variant="success" className="mb-4">{scSuccess}</Alert>}
            {resendSuccess && <Alert variant="success" className="mb-4">{resendSuccess}</Alert>}
            {otpError && <Alert variant="error" className="mb-4">{otpError}</Alert>}
            <p className="text-xs sm:text-sm text-center text-vutruNhat dark:text-night-muted mb-4">
              Vui lòng nhập mã OTP gồm 6 chữ số vừa được gửi đến email <strong className="text-vutru dark:text-night-text">{scFormData.email}</strong>.
            </p>
            <div className="flex justify-center">
              <OtpInput
                value={otpCode}
                onChange={setOtpCode}
                length={6}
              />
            </div>
            <Button
              onClick={async () => {
                if (otpCode.length !== 6) {
                  setOtpError('Mã OTP phải gồm 6 chữ số');
                  return;
                }
                setOtpLoading(true);
                setOtpError('');
                try {
                  await authApi.verifyEmail({ email: scFormData.email, code: otpCode });
                  setScSuccess('Tài khoản đã được kích hoạt thành công!');
                  setTimeout(() => navigate('/login', { state: { from: location.state?.from } }), 2000);
                } catch (err: any) {
                  setOtpError(getApiErrorMessage(err, 'Mã OTP không hợp lệ.'));
                } finally {
                  setOtpLoading(false);
                }
              }}
              variant="primary" size="lg" className="w-full mt-4" isLoading={otpLoading}
            >
              Xác nhận
            </Button>
            <div className="text-center mt-4 space-y-2">
              <button
                type="button"
                className="text-xs sm:text-sm text-cam hover:underline disabled:text-gray-400 block w-full focus-visible:ring-2 focus-visible:ring-cam rounded outline-none"
                disabled={resendLoading}
                onClick={async () => {
                  setResendLoading(true);
                  setResendSuccess('');
                  setOtpError('');
                  try {
                    await authApi.resendVerification({ email: scFormData.email });
                    setResendSuccess('Đã gửi lại mã OTP mới!');
                  } catch (err: any) {
                    setOtpError(getApiErrorMessage(err, 'Lỗi khi gửi lại mã.'));
                  } finally {
                    setResendLoading(false);
                  }
                }}
              >
                {resendLoading ? 'Đang gửi…' : 'Gửi lại mã OTP'}
              </button>
              <button
                type="button"
                className="text-xs sm:text-sm text-vutruNhat dark:text-night-muted hover:text-vutru dark:hover:text-night-text hover:underline block w-full focus-visible:ring-2 focus-visible:ring-cam rounded outline-none"
                onClick={() => {
                  setIsVerifyingOtp(false);
                  setOtpCode('');
                  setOtpError('');
                  setScSuccess('');
                }}
              >
                Nhập sai email? Nhấn vào đây để quay lại.
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="auth-info-banner mb-4">
              <p className="font-semibold flex items-center justify-center gap-1.5"><Info size={16} className="text-cam shrink-0" /> Dành cho học sinh đã đăng ký tại văn phòng</p>
              <p className="mt-1 text-xs opacity-90">Nhập mã số học sinh trên phiếu đăng ký để tạo tài khoản. Hệ thống sẽ tự động thêm bạn vào lớp học tương ứng.</p>
            </div>
            {scError && <Alert variant="error" className="mb-4">{scError}</Alert>}
            
            <div className="mb-4">
              <label className="block text-xs sm:text-sm font-bold text-vutru dark:text-night-text mb-2">
                Bước 1: Nhập Mã số và Họ tên học sinh
              </label>
              <div className="space-y-3">
                <Input
                  label="Mã số học sinh *"
                  type="text"
                  name="studentCode"
                  id="studentCode"
                  value={studentCode}
                  onChange={e => { setStudentCode(e.target.value); setVerifiedProfile(null); setScError(''); }}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleVerifyCode(); } }}
                  placeholder="VD: 25110194 hoặc HS012..."
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                  required
                />
                <Input
                  label="Họ và tên chính xác *"
                  type="text"
                  name="verifyFullName"
                  id="verifyFullName"
                  value={verifyFullName}
                  onChange={e => { setVerifyFullName(e.target.value); setVerifiedProfile(null); setScError(''); }}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleVerifyCode(); } }}
                  placeholder="Họ và tên như trên phiếu đăng ký (VD: Nguyễn Văn A)"
                  autoCapitalize="words"
                  autoCorrect="off"
                  spellCheck={false}
                  required
                />
                <Button 
                  type="button"
                  onClick={handleVerifyCode} 
                  isLoading={verifying} 
                  variant="primary" 
                  size="lg"
                  className="w-full mt-1 font-bold shadow-md shadow-cam/20"
                >
                  Kiểm tra thông tin học sinh
                </Button>
              </div>
            </div>
            {verifiedProfile && (
              <form onSubmit={handleStudentCodeSubmit} className="space-y-4 border-t border-gray-100 dark:border-night-border pt-6 mt-4">
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/40 rounded-xl p-3.5 mb-4">
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bold mb-1 flex items-center gap-1.5"><CheckCircle size={14} /> Tìm thấy hồ sơ học sinh</p>
                  <p className="font-bold text-vutru dark:text-night-text text-sm sm:text-base">{verifiedProfile.fullName}</p>
                  <p className="text-xs text-vutruNhat dark:text-night-muted">Cơ sở: {verifiedProfile.facility || 'Chưa cập nhật'} • SĐT: {verifiedProfile.phone || 'Chưa cập nhật'}</p>
                  {verifiedProfile.enrollments?.length > 0 && (
                    <p className="text-xs text-blue-700 dark:text-blue-400 font-medium mt-1 flex items-center gap-1.5"><BookText size={14} /> Lớp: {verifiedProfile.enrollments.map(e => e.classroomName).join(', ')}</p>
                  )}
                </div>
                <label className="block text-xs sm:text-sm font-bold text-vutru dark:text-night-text mb-2">Bước 2: Xác minh &amp; tạo tài khoản</label>
                <div>
                  <Input 
                    label="Ngày sinh (theo phiếu đăng ký) *" 
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="text" 
                    value={scFormData.dateOfBirth} 
                    onChange={e => setScFormData({ ...scFormData, dateOfBirth: e.target.value })} 
                    placeholder="DD/MM/YYYY (VD: 14/07/2009)" 
                    autoComplete="bday"
                    required 
                  />
                </div>
                <div>
                  <Input 
                    label="Email *" 
                    id="regEmail"
                    name="email"
                    type="email" 
                    value={scFormData.email} 
                    onChange={e => setScFormData({ ...scFormData, email: e.target.value })} 
                    placeholder="VD: name@domain.com…" 
                    autoComplete="email"
                    spellCheck={false}
                    required 
                  />
                </div>
                <div>
                  <Input 
                    label="Mật khẩu *" 
                    id="regPassword"
                    name="password"
                    type="password" 
                    value={scFormData.password} 
                    onChange={e => setScFormData({ ...scFormData, password: e.target.value })} 
                    placeholder="••••••••" 
                    autoComplete="new-password"
                    required 
                  />
                </div>
                <div>
                  <Input 
                    label="Nhập lại mật khẩu *" 
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={scFormData.confirmPassword}
                    onChange={e => setScFormData({ ...scFormData, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                  />
                </div>
                <Button type="submit" variant="primary" size="lg" className="w-full mt-4" isLoading={scLoading}>
                  Đăng ký tài khoản
                </Button>
              </form>
            )}
          </>
        )}
      </AuthShell>
    </>
  );
};

export default Register;
