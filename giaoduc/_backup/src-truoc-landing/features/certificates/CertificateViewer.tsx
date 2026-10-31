import React, { useEffect, useState } from 'react';
import { XCircle } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { certificateApi, Certificate } from '../../services/certificateApi';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import LoadingOverlay from '../../components/ui/LoadingOverlay';

const CertificateViewer = () => {
  const { code } = useParams<{ code: string }>();
  const [cert, setCert] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (code) {
      certificateApi.verify(code)
        .then(setCert)
        .catch(() => setError('Chứng chỉ không tồn tại hoặc không hợp lệ'))
        .finally(() => setLoading(false));
    }
  }, [code]);

  if (loading) return <LoadingOverlay text="Đang xác thực chứng chỉ..." />;

  if (error || !cert) return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-3xl shadow-soft text-center max-w-md">
        <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6"><XCircle size={36} /></div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Chứng chỉ không hợp lệ</h1>
        <p className="text-gray-500 mb-6">Mã xác minh bạn cung cấp không tồn tại trong hệ thống.</p>
        <Link to="/" className="btn btn-chinh w-full block text-center py-3">Quay lại trang chủ</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 flex flex-col items-center">
      <div className="mb-8 text-center print:hidden">
        <div className="inline-block px-4 py-1.5 bg-green-100 text-green-700 font-bold rounded-full text-sm mb-4">
          ✓ Xác thực thành công
        </div>
        <p className="text-gray-500">Mã chứng chỉ: <span className="font-mono font-bold text-gray-800">{cert.uniqueCode}</span></p>
      </div>

      <div className="w-full max-w-4xl bg-white aspect-[1.414] relative shadow-2xl border-[20px] border-vutru p-12 flex flex-col items-center text-center overflow-hidden print:shadow-none print:border-vutru print:border-[10px]">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-64 h-64 border-[40px] border-cam/10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 border-[60px] border-vutruNhat/10 rounded-full translate-x-1/3 translate-y-1/3"></div>
        
        <div className="relative z-10 flex flex-col items-center h-full w-full justify-between py-8">
          <div>
            <h1 className="text-3xl sm:text-5xl font-black font-heading text-camDam tracking-widest uppercase mb-3">
              CHỨNG NHẬN HOÀN THÀNH
            </h1>
            <p className="text-xs sm:text-base text-gray-500 uppercase tracking-widest font-bold">Điểm Sáng Â· Nền tảng lớp học</p>
          </div>

          <div className="my-8 sm:my-12">
            <p className="text-base sm:text-lg text-gray-500 mb-3 italic font-medium">Chứng nhận được trao cho</p>
            <h2 className="text-3xl sm:text-5xl font-extrabold font-heading text-vutru mb-6 tracking-wide">{cert.userName}</h2>
            <p className="text-sm sm:text-base text-gray-500 mb-2 font-medium">Đã hoàn thành xuất sắc khóa học</p>
            <h3 className="text-2xl sm:text-4xl font-extrabold font-heading text-cam">{cert.courseName}</h3>
          </div>

          <div className="flex justify-between w-full px-8 sm:px-16 items-end mt-auto">
            <div className="text-center">
              <p className="border-b-2 border-gray-400 w-32 sm:w-40 mb-2 pb-2 text-sm sm:text-base font-bold text-vutru">
                {format(new Date(cert.issueDate), 'dd/MM/yyyy', { locale: vi })}
              </p>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ngày cấp</p>
            </div>
            
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-cam/10 rounded-full flex items-center justify-center border-4 border-camDam shadow-inner relative shrink-0">
               <div className="absolute inset-0 border-2 border-dashed border-camDam rounded-full m-1"></div>
               <span className="font-extrabold text-camDam rotate-[-12deg] text-xs sm:text-base text-center leading-tight">Điểm Sáng<br/>CERTIFIED</span>
            </div>

            <div className="text-center">
              <div className="border-b-2 border-gray-400 w-32 sm:w-40 mb-2 pb-2 h-10 flex items-end justify-center">
                <span className="text-xl sm:text-2xl font-bold text-vutru font-heading italic tracking-wide">Điểm Sáng Admin</span>
              </div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Giám đốc đào tạo</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 flex gap-4 print:hidden">
        <button onClick={() => window.print()} className="btn btn-chinh px-8 py-3 rounded-xl font-bold shadow-lg shadow-cam/30">
          In chứng chỉ
        </button>
        <Link to="/" className="px-8 py-3 bg-white text-gray-700 font-bold rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm">
          Quay lại trang chủ
        </Link>
      </div>
    </div>
  );
};

export default CertificateViewer;
