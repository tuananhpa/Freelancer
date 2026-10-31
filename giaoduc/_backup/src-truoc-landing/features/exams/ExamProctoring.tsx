import { getApiErrorMessage } from '../../services/api';
import React, { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../services/api';
import LoadingOverlay from '../../components/ui/LoadingOverlay';


interface ActiveAttempt {
  resultId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  startedAt: string;
  answeredCount: number;
  totalQuestions: number;
  cheatWarningCount: number;
  cheatDetails: string | null;
  submitted: boolean;
}

interface ProctoringData {
  examId: string;
  examTitle: string;
  totalQuestions: number;
  activeAttempts: ActiveAttempt[];
}

const ExamProctoring = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ProctoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api.get(`/exams/${id}/proctoring`);
      setData(res.data);
      setError('');
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Không thể tải dữ liệu giám sát'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const progressPct = (a: ActiveAttempt) =>
    a.totalQuestions > 0 ? Math.round((a.answeredCount / a.totalQuestions) * 100) : 0;

  const elapsed = (startedAt: string) => {
    const mins = Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000);
    return `${mins} phút`;
  };

  if (loading) return <LoadingOverlay text="Đang tải bảng giám sát..." />;

  if (error) {
    return (
      <div className="max-w-lg mx-auto card text-center py-10">
        <p className="text-red-500 mb-4">{error}</p>
        <Link to="/exams" className="btn btn-chinh">Quay lại</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/exams" className="text-sm text-cam hover:underline">← Quay lại đề thi</Link>
          <h1 className="text-2xl font-bold text-vutru mt-1">Giám sát: {data?.examTitle}</h1>
          <p className="text-sm text-vutruNhat">Cập nhật tự động mỗi 5 giây · {data?.activeAttempts.length || 0} học sinh đang làm</p>
        </div>
        <button onClick={fetchData} className="btn btn-phu text-sm">Làm mới</button>
      </div>

      {!data?.activeAttempts.length ? (
        <div className="card text-center py-16 text-vutruNhat">
          <p className="text-lg font-semibold">Không có học sinh nào đang làm bài</p>
          <p className="text-sm mt-2">Bảng sẽ cập nhật khi có học sinh bắt đầu thi</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.activeAttempts.map((a) => (
            <div key={a.resultId} className={`card ${a.cheatWarningCount > 0 ? 'border-red-300 bg-red-50/30' : ''}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-vutru">{a.studentName}</p>
                  <p className="text-sm text-vutruNhat">{a.studentEmail}</p>
                  <p className="text-xs text-vutruNhat mt-1">
                    Bắt đầu: {new Date(a.startedAt).toLocaleTimeString('vi-VN')} · {elapsed(a.startedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-camDam">{progressPct(a)}%</p>
                    <p className="text-xs text-vutruNhat">{a.answeredCount}/{a.totalQuestions} câu</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${a.cheatWarningCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {a.cheatWarningCount}
                    </p>
                    <p className="text-xs text-vutruNhat">Cảnh báo gian lận</p>
                  </div>
                </div>
              </div>
              {a.cheatWarningCount > 0 && a.cheatDetails && (
                <div className="mt-3 p-3 bg-red-50 rounded-lg text-xs text-red-700 font-mono whitespace-pre-wrap">
                  {(() => {
                    try {
                      const parsed = JSON.parse(a.cheatDetails);
                      return Array.isArray(parsed) ? parsed.join('\n') : a.cheatDetails;
                    } catch {
                      return a.cheatDetails;
                    }
                  })()}
                </div>
              )}
              <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${a.cheatWarningCount > 2 ? 'bg-red-500' : 'bg-cam'}`}
                  style={{ width: `${progressPct(a)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExamProctoring;
