import React, { useEffect, useState } from 'react';
import { Trophy, GraduationCap } from 'lucide-react';
import { certificateApi, Certificate } from '../../services/certificateApi';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import LoadingOverlay from '../../components/ui/LoadingOverlay';

const ProfileCertificates = () => {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    certificateApi.getMyCertificates(0)
      .then((res) => setCerts(res.content))
      .catch((err) => console.error('Failed to load certificates', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingOverlay text="Đang tải danh sách chứng chỉ..." />;

  return (
    <div className="card h-full flex flex-col">
      <h2 className="text-xl font-bold text-vutru mb-1">Chứng chỉ của tôi</h2>
      <p className="text-sm text-vutruNhat mb-6">Danh sách các chứng chỉ bạn đã đạt được</p>

      {loading ? (
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cam"></div>
        </div>
      ) : certs.length === 0 ? (
        <div className="flex-1 flex flex-col justify-center items-center text-center py-12 text-gray-500">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-night-elevated flex items-center justify-center text-vutruNhat dark:text-night-muted mb-4">
            <GraduationCap size={32} aria-hidden="true" />
          </div>
          <p className="font-semibold text-lg">Chưa có chứng chỉ nào</p>
          <p className="text-sm mt-1 max-w-sm">Hãy hoàn thành các khóa học để nhận những chứng chỉ ghi nhận thành tích của bạn nhé.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certs.map(cert => (
            <div key={cert.id} className="border border-gray-100 rounded-xl p-5 hover:shadow-soft transition-all bg-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cam/5 rounded-bl-full -z-0"></div>
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-xs font-bold px-2 py-1 rounded bg-green-100 text-green-700">Đã cấp</span>
                    <p className="text-xs text-gray-400 mt-2 font-mono">{cert.uniqueCode}</p>
                  </div>
                  <div className="w-10 h-10 bg-cam/10 text-cam rounded-full flex items-center justify-center text-xl">
                    <Trophy size={16} className="inline mr-1" />
                  </div>
                </div>
                
                <h3 className="font-bold text-vutru text-lg mb-1">{cert.courseName}</h3>
                <p className="text-sm text-vutruNhat mb-4">
                  Cấp ngày: {format(new Date(cert.issueDate), 'dd/MM/yyyy', { locale: vi })}
                </p>
                
                <Link 
                  to={`/verify-certificate/${cert.uniqueCode}`} 
                  target="_blank"
                  className="text-sm font-semibold text-cam hover:text-camDam transition-colors flex items-center gap-1"
                >
                  Xem chi tiết & In <span className="text-lg">→</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfileCertificates;
