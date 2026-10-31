import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Pagination from '../../components/ui/Pagination';
import Card from '../../components/ui/Card';
import { AlertTriangle, Timer, Calendar } from 'lucide-react';
import LoadingOverlay from '../../components/ui/LoadingOverlay';


interface ExamHistoryItem {
  resultId: string;
  examId: string;
  examTitle: string;
  examCode: string;
  teacherName: string;
  totalScore: number;
  maxScore: number;
  scorePercentage: number;
  isPassed: boolean;
  startedAt: string;
  submittedAt: string;
  timeTakenSeconds: number;
  attemptNumber: number;
  totalAttempts: number;
  cheatWarningCount?: number;
  pendingTeacherReview?: boolean;
}

const ExamHistory = () => {
  const [history, setHistory] = useState<ExamHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const fetchHistory = async (page: number) => {
      try {
        setLoading(true);
        const res = await api.get(`/exams/history?page=${page}&size=9`);
        setHistory(res.data.content);
        setTotalPages(res.data.totalPages);
      } catch (err: any) {
        setError('Không thể tải lịch sử làm bài.');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory(currentPage);
  }, [currentPage]);

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleString('vi-VN', { 
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}p ${s}s`;
  };

  if (loading) return <LoadingOverlay text="Đang tải lịch sử..." />;
  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-vutru mb-1">Lịch sử làm bài</h2>
        <p className="text-sm text-vutruNhat">Xem lại kết quả các bài thi bạn đã hoàn thành.</p>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-gray-500 font-medium">Bạn chưa làm bài thi nào.</p>
          <Link to="/exams" className="text-camDam font-bold mt-2 inline-block hover:underline">
            Khám phá danh sách đề thi
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {history.map((item) => (
            <Link key={item.resultId} to={`/exams/results/${item.resultId}`} className="group block h-full">
              <Card 
                padding="md"
                className="flex flex-col cursor-pointer hover:border-cam/30 transition-all h-full"
              >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-vutru group-hover:text-camDam line-clamp-2 pr-2">
                  {item.examTitle}
                  {(item.cheatWarningCount ?? 0) > 0 && (
                    <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-md text-xs font-bold border border-red-100 mt-2 self-start">
                      <AlertTriangle size={14} className="opacity-70" /> Vi phạm
                    </span>
                  )}
                </h3>
                {item.pendingTeacherReview ? (
                  <span className="shrink-0 text-xs font-bold px-2 py-1 rounded-md bg-amber-100 text-amber-700">
                    Chờ chấm
                  </span>
                ) : (
                  <span className={`shrink-0 text-xs font-bold px-2 py-1 rounded-md ${item.isPassed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {item.totalScore}/{item.maxScore}
                  </span>
                )}
              </div>
              
              <div className="text-xs text-gray-500 mb-4 space-y-1">
                <p>Mã đề: <span className="font-semibold text-gray-700">{item.examCode}</span></p>
                <p>Giáo viên: <span className="font-semibold">{item.teacherName}</span></p>
              </div>

              <div className="mt-auto pt-4 border-t border-gray-50 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-gray-500">
                  <Calendar size={14} className="opacity-70" /> {formatDate(item.submittedAt).split(' ')[1]}
                </div>
                <div className="flex items-center gap-1.5 text-gray-500 justify-end">
                  <span className="flex items-center gap-1"><Timer size={14} className="opacity-70" /> {formatTime(item.timeTakenSeconds)}</span>
                </div>
              </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-8">
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
};

export default ExamHistory;
