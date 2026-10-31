import React, { useEffect, useState } from 'react';
import { flashcardApi } from '../../services/flashcardApi';
import { useParams, Link } from 'react-router-dom';
import { AlertTriangle, Trophy } from 'lucide-react';
import LoadingOverlay from '../../components/ui/LoadingOverlay';


interface ProblematicCard {
  cardId: string;
  frontContent: string;
  backContent: string;
  timesReviewed: number;
  boxLevel: number;
}

interface StatisticsResponse {
  totalCards: number;
  masteredCards: number;
  learningCards: number;
  newCards: number;
  problematicCards: ProblematicCard[];
}

const FlashcardStatistics = () => {
  const { id } = useParams<{ id: string }>();
  const [stats, setStats] = useState<StatisticsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      flashcardApi.getStatistics(id)
        .then(res => setStats(res.data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return <LoadingOverlay text="Đang tải thống kê..." />;
  }

  if (!stats) {
    return <div className="text-center py-10 text-red-500">Lỗi khi tải dữ liệu</div>;
  }

  // Calculate percentages
  const getPercent = (val: number) => stats.totalCards === 0 ? 0 : Math.round((val / stats.totalCards) * 100);
  const masteredPercent = getPercent(stats.masteredCards);
  const learningPercent = getPercent(stats.learningCards);
  const newPercent = getPercent(stats.newCards);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-fade-in">
      <div className="mb-6">
        <Link to={`/flashcards/${id}/study`} className="text-vutruNhat hover:text-camDam text-sm flex items-center gap-1 mb-2">
          &larr; Quay lại
        </Link>
        <h2 className="text-2xl font-bold text-vutru">Thống kê tiến độ học tập</h2>
        <p className="text-vutruNhat text-sm">Hiểu rõ bạn đang ở đâu để tối ưu thời gian ôn tập</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Chart Section */}
        <div className="card">
          <h3 className="text-lg font-bold text-vutru mb-6">Mức độ thông thạo</h3>
          <div className="flex items-center justify-center relative mb-6">
            {/* Simple CSS-based Doughnut chart */}
            <div 
              className="w-48 h-48 rounded-full flex items-center justify-center relative shadow-inner"
              style={{
                background: `conic-gradient(
                  #10B981 0% ${masteredPercent}%, 
                  #F59E0B ${masteredPercent}% ${masteredPercent + learningPercent}%, 
                  #E5E7EB ${masteredPercent + learningPercent}% 100%
                )`
              }}
            >
              <div className="w-32 h-32 bg-white dark:bg-night-surface rounded-full flex flex-col items-center justify-center absolute">
                <span className="text-3xl font-black text-green-500">{masteredPercent}%</span>
                <span className="text-xs text-vutruNhat font-semibold">Đã thuộc</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-vutru font-medium">Đã thuộc (Level 5)</span>
              </div>
              <span className="font-bold">{stats.masteredCards} thẻ</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-vutru font-medium">Đang học (Level 1-4)</span>
              </div>
              <span className="font-bold">{stats.learningCards} thẻ</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-200"></div>
                <span className="text-vutru font-medium">Chưa học</span>
              </div>
              <span className="font-bold">{stats.newCards} thẻ</span>
            </div>
            <div className="pt-2 mt-2 border-t border-gray-100 dark:border-night-border flex justify-between items-center text-sm">
              <span className="text-vutruNhat font-bold">Tổng cộng</span>
              <span className="font-bold text-camDam">{stats.totalCards} thẻ</span>
            </div>
          </div>
        </div>

        {/* Problematic Cards Section */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-red-500 flex items-center gap-2">
              <AlertTriangle className="text-red-500" size={20} /> Thẻ cần chú ý
            </h3>
          </div>
          <p className="text-sm text-vutruNhat mb-4">
            Đây là những thẻ bạn đã ôn nhiều lần nhưng vẫn hay quên. Hãy tập trung vào những thẻ này!
          </p>

          {stats.problematicCards.length === 0 ? (
            <div className="text-center py-10 bg-green-50 dark:bg-green-500/10 rounded-xl border border-green-100 dark:border-green-500/20">
              <div className="flex justify-center mb-2"><Trophy size={36} className="text-yellow-500" /></div>
              <p className="text-green-600 font-medium">Tuyệt vời! Bạn không có thẻ khó nào.</p>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[300px] pr-2">
              {stats.problematicCards.map(card => (
                <div key={card.cardId} className="p-3 bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-100 dark:border-red-500/20">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-bold text-vutru text-sm">{card.frontContent}</p>
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
                      Ôn {card.timesReviewed} lần
                    </span>
                  </div>
                  <p className="text-red-800 dark:text-red-300 text-sm">{card.backContent}</p>
                </div>
              ))}
            </div>
          )}

          {stats.problematicCards.length > 0 && (
            <div className="mt-6 text-center">
              <Link to={`/flashcards/${id}/study?mode=learn`} className="btn btn-chinh w-full">
                Học ngay các thẻ này
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlashcardStatistics;
