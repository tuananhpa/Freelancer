import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { learningPathApi } from '../../services/featureApi';
import Button from '../../components/ui/Button';
import LoadingOverlay from '../../components/ui/LoadingOverlay';


const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: 'Sơ cấp (A1-A2)',
  INTERMEDIATE: 'Trung cấp (B1)',
  UPPER_INTERMEDIATE: 'Trung cao cấp (B2)',
  ADVANCED: 'Cao cấp (C1+)',
};

const SKILL_LABELS: Record<string, string> = {
  GRAMMAR: 'Ngữ pháp',
  VOCABULARY: 'Từ vựng',
  READING: 'Đọc hiểu',
  LISTENING: 'Nghe',
  WRITING: 'Viết',
};

interface PlacementQuestion {
  id: string;
  skillTag: string;
  content: string;
  options: { id: string; content: string }[];
}

const LearningPathPage = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<PlacementQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [status, setStatus] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [step, setStep] = useState<'intro' | 'quiz' | 'result'>('intro');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      learningPathApi.getStatus(),
      learningPathApi.getPlacementTest(),
    ]).then(([statusRes, testRes]) => {
      setQuestions(testRes.data?.questions || []);
      if (statusRes.data.completed) {
        setStatus(statusRes.data);
        setStep('result');
        return learningPathApi.getRecommendations();
      }
      setStep('intro');
    }).then((recRes) => {
      if (recRes) setRecommendations(recRes.data);
    }).finally(() => setLoading(false));
  }, []);

  const submitTest = async () => {
    setSubmitting(true);
    try {
      const res = await learningPathApi.submitPlacementTest(answers);
      setStatus(res.data);
      const rec = await learningPathApi.getRecommendations();
      setRecommendations(rec.data);
      setStep('result');
    } finally {
      setSubmitting(false);
    }
  };

  const answeredCount = Object.keys(answers).length;
  const current = questions[currentIdx];

  if (loading) return <LoadingOverlay text="Đang tải..." />;

  if (step === 'intro') {
    return (
      <div className="max-w-xl mx-auto card animate-fade-in text-center">
        <h1 className="text-2xl font-bold mb-2">Kiểm tra trình độ</h1>
        <p className="text-vutruNhat mb-4">
          Bài test gồm {questions.length} câu trắc nghiệm đánh giá 5 kỹ năng tiếng Anh.
        </p>
        <p className="text-sm text-vutruNhat mb-8">Thời gian ước tính: 10–15 phút</p>
        <Button variant="primary" className="w-full" onClick={() => setStep('quiz')}>Bắt đầu làm bài</Button>
      </div>
    );
  }

  if (step === 'quiz' && current) {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="flex justify-between items-center mb-4 text-sm text-vutruNhat">
          <span>Câu {currentIdx + 1}/{questions.length}</span>
          <span className="px-2 py-0.5 rounded-full bg-cam/15 text-camDam font-semibold">
            {SKILL_LABELS[current.skillTag] || current.skillTag}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div className="bg-cam h-2 rounded-full transition-all" style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} />
        </div>

        <div className="card mb-6">
          <h2 className="text-lg font-bold text-vutru mb-6">{current.content}</h2>
          <div className="space-y-3">
            {current.options.map((opt) => (
              <label
                key={opt.id}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                  answers[current.id] === opt.id
                    ? 'border-cam bg-cam/5'
                    : 'border-gray-100 dark:border-night-border hover:border-cam/30'
                }`}
              >
                <input
                  type="radio"
                  name={current.id}
                  checked={answers[current.id] === opt.id}
                  onChange={() => setAnswers({ ...answers, [current.id]: opt.id })}
                  className="accent-cam"
                />
                <span className="text-vutru">{opt.content}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-between gap-3">
          <Button variant="outline" disabled={currentIdx === 0} onClick={() => setCurrentIdx((i) => i - 1)}>Trước</Button>
          {currentIdx < questions.length - 1 ? (
            <Button variant="primary" disabled={!answers[current.id]} onClick={() => setCurrentIdx((i) => i + 1)}>Tiếp</Button>
          ) : (
            <Button
              variant="primary"
              disabled={answeredCount < questions.length || submitting}
              onClick={submitTest}
            >
              {submitting ? 'Đang chấm...' : 'Nộp bài'}
            </Button>
          )}
        </div>
        <p className="text-center text-xs text-vutruNhat mt-4">Đã trả lời {answeredCount}/{questions.length} câu</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="card">
        <h1 className="text-2xl font-bold mb-2">Lộ trình của bạn</h1>
        <p className="text-vutruNhat">
          Trình độ gợi ý: <strong className="text-camDam">{LEVEL_LABELS[status?.recommendedLevel] || status?.recommendedLevel}</strong>
        </p>
        {status?.skillScores && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2">
            {Object.entries(status.skillScores).map(([skill, score]) => (
              <div key={skill} className="text-center p-2 rounded-lg bg-kem dark:bg-night-elevated">
                <p className="text-xs text-vutruNhat">{SKILL_LABELS[skill] || skill}</p>
                <p className="text-lg font-bold text-camDam">{score as number}/5</p>
              </div>
            ))}
          </div>
        )}
        {recommendations?.weakestSkill && (
          <p className="text-sm text-vutruNhat mt-3">Cần cải thiện: <strong>{SKILL_LABELS[recommendations.weakestSkill] || recommendations.weakestSkill}</strong></p>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="font-bold text-lg">Gợi ý tiếp theo</h2>
        {(recommendations?.items || []).map((item: any) => (
          <Link key={`${item.type}-${item.id}`} to={item.link} className="card block hover:border-cam/40">
            <p className="font-bold text-vutru">{item.title}</p>
            <p className="text-sm text-vutruNhat">{item.reason}</p>
            <span className="text-xs text-cam font-semibold">{item.type === 'COURSE' ? 'Khóa học' : 'Thẻ ghi nhớ'}</span>
          </Link>
        ))}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => { setAnswers({}); setCurrentIdx(0); setStep('intro'); }}>Làm lại</Button>
        <Button variant="primary" onClick={() => navigate('/dashboard')}>Về Dashboard</Button>
      </div>
    </div>
  );
};

export default LearningPathPage;
