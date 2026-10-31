import React from 'react';
import { 
  Sparkles, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  Target, 
  Layers, 
  SpellCheck, 
  PenTool, 
  ArrowRight,
  TrendingUp,
  MessageSquare,
  ThumbsUp,
  Clock
} from 'lucide-react';
import { WritingGradingResult, WritingAssessmentResponse } from '../../../services/aiGradingApi';

interface Props {
  assessment: WritingAssessmentResponse;
  showTeacherNotes?: boolean;
}

const getCategoryBadge = (cat?: string) => {
  const c = (cat || '').toLowerCase();
  if (c.includes('grammar') || c.includes('ngữ pháp')) return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/50';
  if (c.includes('vocabulary') || c.includes('từ vựng') || c.includes('word_choice')) return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800/50';
  if (c.includes('spelling') || c.includes('chính tả')) return 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800/50';
  if (c.includes('punctuation') || c.includes('dấu câu')) return 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800/50';
  if (c.includes('coherence') || c.includes('mạch lạc')) return 'bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800/50';
  return 'bg-gray-100 text-gray-800 dark:bg-night-elevated dark:text-night-muted border-gray-200 dark:border-night-border';
};

const getCategoryLabel = (cat?: string) => {
  const c = (cat || '').toLowerCase();
  if (c.includes('grammar')) return 'Ngữ pháp';
  if (c.includes('vocabulary') || c.includes('word_choice')) return 'Từ vựng';
  if (c.includes('spelling')) return 'Chính tả';
  if (c.includes('punctuation')) return 'Dấu câu';
  if (c.includes('coherence')) return 'Mạch lạc & Liên kết';
  if (c.includes('task')) return 'Nội dung đề bài';
  return cat || 'Khác';
};

export const WritingAssessmentViewer: React.FC<Props> = ({ assessment, showTeacherNotes = false }) => {
  const result: WritingGradingResult | undefined = assessment.result || undefined;

  if (!result) {
    return (
      <div className="p-8 text-center text-vutruNhat dark:text-night-muted bg-gray-50 dark:bg-night-elevated rounded-2xl border border-gray-100 dark:border-night-border">
        <Sparkles className="mx-auto mb-2 text-cam opacity-60" size={32} />
        <p className="font-semibold text-sm">Chưa có kết quả đánh giá chi tiết.</p>
      </div>
    );
  }

  const overall = result.overall;
  const level = result.levelAssessment;
  const criteria = result.criteria;
  const errors = result.errors || [];
  const strengths = result.strengths || [];
  const improvements = result.improvements || [];
  const teacherSummary = result.teacherSummary;
  const studentFeedback = result.studentFeedback;

  const maxScore = assessment.maxScore || 100;
  const scaledScore = overall?.score ? ((overall.score / 10.0) * maxScore).toFixed(1) : '0';

  return (
    <div className="space-y-6 animate-fade-in text-vutru dark:text-night-text">
      {/* 1. Overall Score & Level Card */}
      <div className="bg-gradient-to-br from-cam/10 via-amber-500/5 to-transparent dark:from-cam/15 dark:via-night-surface dark:to-night-surface rounded-2xl border border-cam/20 dark:border-night-border p-6 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200/60 dark:border-night-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-cam/15 text-camDam dark:text-cam flex items-center justify-center font-black">
              <Award size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-vutru dark:text-night-text">Điểm Đánh Giá Tổng Quan</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  assessment.status === 'TEACHER_EDITED' 
                    ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40' 
                    : 'bg-cam/15 text-camDam dark:text-cam border border-cam/30'
                }`}>
                  {assessment.status === 'TEACHER_EDITED' ? 'Giáo viên đã duyệt' : 'AI chấm nháp'}
                </span>
              </div>
              <p className="text-xs text-vutruNhat dark:text-night-muted">
                Chuẩn hóa theo 4 tiêu chí rubric quốc tế CEFR
              </p>
            </div>
          </div>

          <div className="flex items-baseline gap-2 text-right">
            <div>
              <span className="text-4xl font-extrabold text-camDam dark:text-cam tabular-nums">
                {scaledScore}
              </span>
              <span className="text-sm font-bold text-vutruNhat dark:text-night-muted"> / {maxScore}đ</span>
            </div>
            <span className="text-xs text-vutruNhat dark:text-night-muted">
              ({overall?.score?.toFixed(1) || '0'} / 10đ)
            </span>
          </div>
        </div>

        {/* Level Assessment Section */}
        {level && (
          <div className="mt-4 pt-2 flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-night-elevated border border-gray-200 dark:border-night-border font-medium">
              <Target size={14} className="text-vutruNhat dark:text-night-muted" />
              <span>Trình độ yêu cầu: <b className="text-vutru dark:text-night-text uppercase">{level.expectedLevel || 'Chưa định nghĩa'}</b></span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 font-medium">
              <TrendingUp size={14} className="text-emerald-600" />
              <span>Trình độ thể hiện: <b className="uppercase">{level.estimatedPerformanceLevel || 'Tương đương'}</b></span>
            </div>

            {level.levelComment && (
              <p className="text-xs text-vutruNhat dark:text-night-muted italic basis-full mt-1">
                "{level.levelComment}"
              </p>
            )}
          </div>
        )}
      </div>

      {/* 2. 4 Rubric Criteria Grid */}
      {criteria && (
        <div>
          <h4 className="text-sm font-extrabold uppercase tracking-wider text-vutruNhat dark:text-night-muted mb-3 flex items-center gap-2">
            <Layers size={16} className="text-cam" />
            Đánh Giá 4 Tiêu Chí Viết (Rubric 4x25%)
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Task Achievement */}
            <CriterionCard
              title="1. Task Achievement / Response"
              desc="Mức độ trả lời đúng trọng tâm, đủ ý và đáp ứng yêu cầu"
              criterion={criteria.taskAchievement}
              icon={<Target size={18} className="text-emerald-500" />}
            />

            {/* Coherence & Cohesion */}
            <CriterionCard
              title="2. Coherence & Cohesion"
              desc="Tính mạch lạc, bố cục đoạn và liên kết tự nhiên"
              criterion={criteria.coherenceAndCohesion}
              icon={<Layers size={18} className="text-blue-500" />}
            />

            {/* Lexical Resource */}
            <CriterionCard
              title="3. Lexical Resource"
              desc="Độ rộng, sự chính xác và phù hợp của từ vựng"
              criterion={criteria.lexicalResource}
              icon={<BookOpen size={18} className="text-amber-500" />}
            />

            {/* Grammatical Range & Accuracy */}
            <CriterionCard
              title="4. Grammatical Range & Accuracy"
              desc="Độ chính xác ngữ pháp, cấu trúc câu và dấu câu"
              criterion={criteria.grammaticalRangeAndAccuracy}
              icon={<SpellCheck size={18} className="text-purple-500" />}
            />
          </div>
        </div>
      )}

      {/* 3. Identified Errors List */}
      <div className="bg-white dark:bg-night-surface rounded-2xl border border-gray-100 dark:border-night-border p-5 shadow-soft">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold uppercase tracking-wider text-vutru dark:text-night-text flex items-center gap-2">
            <PenTool size={16} className="text-rose-500" />
            Lỗi Cụ Thể Cần Khắc Phục ({errors.length})
          </h4>
          <span className="text-xs text-vutruNhat dark:text-night-muted">
            {errors.length === 0 ? 'Tuyệt vời, không phát hiện lỗi lớn' : 'Chỉ ra vị trí và cách sửa chuẩn'}
          </span>
        </div>

        {errors.length === 0 ? (
          <div className="py-6 text-center text-emerald-600 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/60 dark:border-emerald-800/30">
            <CheckCircle2 size={24} className="mx-auto mb-1.5" />
            <p className="font-bold text-sm">Không phát hiện lỗi ngữ pháp hay từ vựng nghiêm trọng!</p>
            <p className="text-xs opacity-80 mt-0.5">Bài làm thể hiện khả năng kiểm soát ngôn ngữ tốt.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {errors.map((err, idx) => (
              <div 
                key={err.id || idx}
                className="p-3.5 rounded-xl border border-gray-100 dark:border-night-border bg-gray-50/70 dark:bg-night-elevated/50 space-y-2 transition-all hover:border-gray-200 dark:hover:border-night-border"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${getCategoryBadge(err.category)}`}>
                      {getCategoryLabel(err.category)}
                    </span>
                    {err.severity && (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        err.severity === 'major' 
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' 
                          : 'bg-gray-200 text-gray-700 dark:bg-night-border dark:text-night-muted'
                      }`}>
                        {err.severity === 'major' ? 'Lỗi lớn' : 'Lỗi nhỏ'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm flex-wrap bg-white dark:bg-night-surface p-2.5 rounded-lg border border-gray-100 dark:border-night-border font-mono">
                  <span className="line-through text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-1.5 py-0.5 rounded">
                    {err.original}
                  </span>
                  <ArrowRight size={14} className="text-vutruNhat dark:text-night-muted shrink-0" />
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded">
                    {err.correction}
                  </span>
                </div>

                {err.explanation && (
                  <p className="text-xs text-vutruNhat dark:text-night-muted leading-relaxed pl-1">
                    <b className="text-vutru dark:text-night-text">Giải thích: </b>
                    {err.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Strengths & Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strengths */}
        <div className="bg-white dark:bg-night-surface rounded-2xl border border-gray-100 dark:border-night-border p-5 shadow-soft">
          <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2">
            <ThumbsUp size={16} />
            Điểm Mạnh Nổi Bật ({strengths.length})
          </h4>
          {strengths.length === 0 ? (
            <p className="text-xs text-vutruNhat dark:text-night-muted italic">Chưa ghi nhận điểm mạnh đặc thù.</p>
          ) : (
            <div className="space-y-2.5">
              {strengths.map((s, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/30 text-xs space-y-1">
                  <p className="font-semibold text-emerald-900 dark:text-emerald-300">
                    ✓ {s.description}
                  </p>
                  {s.evidence && (
                    <p className="text-emerald-700/80 dark:text-emerald-400/80 italic pl-3 border-l-2 border-emerald-400">
                      Dẫn chứng: "{s.evidence}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Improvements */}
        <div className="bg-white dark:bg-night-surface rounded-2xl border border-gray-100 dark:border-night-border p-5 shadow-soft">
          <h4 className="text-sm font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-3 flex items-center gap-2">
            <TrendingUp size={16} />
            Gợi Ý Cải Thiện ({improvements.length})
          </h4>
          {improvements.length === 0 ? (
            <p className="text-xs text-vutruNhat dark:text-night-muted italic">Không có đề xuất cải thiện cấp bách.</p>
          ) : (
            <div className="space-y-2.5">
              {improvements.map((imp, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-800/30 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-amber-900 dark:text-amber-300">
                      ! {imp.description}
                    </p>
                    {imp.priority && (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        imp.priority === 'high' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                      }`}>
                        {imp.priority === 'high' ? 'Ưu tiên cao' : 'Khuyên dùng'}
                      </span>
                    )}
                  </div>
                  {imp.action && (
                    <p className="text-amber-800/80 dark:text-amber-300/80 pl-3 border-l-2 border-amber-400">
                      Hành động: {imp.action}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5. Teacher Summary & Student Feedback */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Teacher Summary (shown if teacher view or explicitly requested) */}
        {showTeacherNotes && teacherSummary && (
          <div className="bg-cam/5 dark:bg-cam/10 rounded-2xl border border-cam/20 p-5 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-camDam dark:text-cam flex items-center gap-1.5">
              <MessageSquare size={14} />
              Tóm Tắt Nhanh Cho Giáo Viên (5s Overview)
            </h4>
            <p className="text-sm font-medium leading-relaxed">{teacherSummary.overallComment}</p>
            <div className="text-xs space-y-1 pt-2 border-t border-cam/15">
              {teacherSummary.mainStrength && (
                <p><b className="text-camDam dark:text-cam">Điểm mạnh chính:</b> {teacherSummary.mainStrength}</p>
              )}
              {teacherSummary.mainWeakness && (
                <p><b className="text-rose-600 dark:text-rose-400">Điểm cần lưu ý:</b> {teacherSummary.mainWeakness}</p>
              )}
              {teacherSummary.recommendedFocus && (
                <p><b className="text-blue-600 dark:text-blue-400">Trọng tâm rèn luyện:</b> {teacherSummary.recommendedFocus}</p>
              )}
            </div>
          </div>
        )}

        {/* Student Encouraging Feedback */}
        {studentFeedback && (
          <div className="bg-emerald-50/60 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/40 p-5 space-y-2 md:col-span-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <Sparkles size={14} />
              Nhận Xét & Động Viên Cho Học Sinh
            </h4>
            <p className="text-sm text-emerald-900 dark:text-emerald-200 font-medium leading-relaxed">
              {studentFeedback.positive}
            </p>
            {studentFeedback.nextStep && (
              <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 pt-2 border-t border-emerald-200/40">
                <b>Bước tiếp theo:</b> {studentFeedback.nextStep}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Audit Info Footer */}
      {assessment.version && assessment.version > 1 && (
        <div className="text-[11px] text-vutruNhat dark:text-night-muted flex items-center gap-1.5 justify-end pt-2">
          <Clock size={12} />
          <span>Phiên bản đánh giá: v{assessment.version} {assessment.lastEditedByName ? `(chỉnh sửa bởi ${assessment.lastEditedByName})` : ''}</span>
        </div>
      )}
    </div>
  );
};

interface CriterionCardProps {
  title: string;
  desc: string;
  criterion?: {
    score?: number;
    maxScore?: number;
    strengths?: string[];
    weaknesses?: string[];
    feedback?: string;
  };
  icon: React.ReactNode;
}

const CriterionCard: React.FC<CriterionCardProps> = ({ title, desc, criterion, icon }) => {
  const score = criterion?.score ?? 0;
  const max = criterion?.maxScore ?? 10;
  const pct = Math.min(100, Math.max(0, (score / max) * 100));

  return (
    <div className="bg-white dark:bg-night-surface rounded-2xl border border-gray-100 dark:border-night-border p-4 shadow-soft space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <h5 className="font-bold text-sm text-vutru dark:text-night-text">{title}</h5>
            <p className="text-[11px] text-vutruNhat dark:text-night-muted">{desc}</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-base font-extrabold text-vutru dark:text-night-text tabular-nums">{score.toFixed(1)}</span>
          <span className="text-xs text-vutruNhat dark:text-night-muted">/{max}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-100 dark:bg-night-elevated rounded-full h-2 overflow-hidden">
        <div 
          className="bg-cam dark:bg-cam h-full rounded-full transition-all duration-500" 
          style={{ width: `${pct}%` }} 
        />
      </div>

      {/* Feedback text */}
      {criterion?.feedback && (
        <p className="text-xs text-vutru dark:text-night-text leading-relaxed bg-gray-50 dark:bg-night-elevated p-2.5 rounded-xl">
          {criterion.feedback}
        </p>
      )}

      {/* Strengths & Weaknesses Bullets */}
      {(criterion?.strengths?.length || 0) > 0 && (
        <ul className="text-[11px] text-emerald-700 dark:text-emerald-400 space-y-0.5 pl-3 list-disc">
          {criterion?.strengths?.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      )}
      {(criterion?.weaknesses?.length || 0) > 0 && (
        <ul className="text-[11px] text-amber-700 dark:text-amber-400 space-y-0.5 pl-3 list-disc">
          {criterion?.weaknesses?.map((w, i) => <li key={i}>{w}</li>)}
        </ul>
      )}
    </div>
  );
};

export default WritingAssessmentViewer;
