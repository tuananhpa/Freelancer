import React from "react";
import { Sparkles, ThumbsUp, PenLine, BookOpen } from "lucide-react";

interface ErrorItem {
  original: string;
  corrected: string;
  type: string;
}

export interface StructuredFeedback {
  score?: number;
  summary?: string;
  strengths?: string[];
  errors?: ErrorItem[];
  vocabularySuggestions?: string[];
}

/** aiFeedback trong DB có thể là JSON có cấu trúc (bài mới) hoặc text thường (bài cũ / giáo viên tự ghi đè). */
export const parseAiFeedback = (raw?: string | null): StructuredFeedback | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && (parsed.summary || parsed.errors || parsed.strengths)) {
      return parsed as StructuredFeedback;
    }
    return null;
  } catch {
    return null;
  }
};

const typeBadgeClass = (type: string) => {
  const t = type.toLowerCase();
  if (t.includes("chính tả")) return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  if (t.includes("ngữ pháp")) return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  if (t.includes("từ vựng")) return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
  return "bg-gray-100 text-gray-700 dark:bg-night-elevated dark:text-night-muted";
};

/** Hiển thị nhận xét AI — tự nhận diện JSON có cấu trúc, fallback về text thường nếu không parse được. */
const AiFeedbackView = ({ raw }: { raw?: string | null }) => {
  const structured = parseAiFeedback(raw);

  if (!structured) {
    return <div className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed">{raw}</div>;
  }

  return (
    <div className="space-y-3">
      {structured.summary && (
        <p className="text-xs sm:text-sm leading-relaxed">{structured.summary}</p>
      )}

      {structured.strengths && structured.strengths.length > 0 && (
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide flex items-center gap-1.5 mb-1 opacity-80">
            <ThumbsUp size={12} aria-hidden="true" /> Điểm mạnh
          </p>
          <ul className="text-xs sm:text-sm space-y-0.5 list-disc pl-4">
            {structured.strengths.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}

      {structured.errors && structured.errors.length > 0 && (
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide flex items-center gap-1.5 mb-1.5 opacity-80">
            <PenLine size={12} aria-hidden="true" /> Lỗi cần sửa
          </p>
          <div className="space-y-1.5">
            {structured.errors.map((e, i) => (
              <div key={i} className="text-xs sm:text-sm bg-white/60 dark:bg-black/20 rounded-lg px-2.5 py-1.5">
                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold mr-1.5 ${typeBadgeClass(e.type)}`}>
                  {e.type}
                </span>
                <span className="line-through opacity-60">{e.original}</span>
                <span className="mx-1.5">→</span>
                <span className="font-semibold">{e.corrected}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {structured.vocabularySuggestions && structured.vocabularySuggestions.length > 0 && (
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide flex items-center gap-1.5 mb-1 opacity-80">
            <BookOpen size={12} aria-hidden="true" /> Từ vựng nâng cao hơn
          </p>
          <ul className="text-xs sm:text-sm space-y-0.5 list-disc pl-4">
            {structured.vocabularySuggestions.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
};

export const AiFeedbackHeader = ({ reviewed, title }: { reviewed?: boolean; title?: string } = {}) => (
  <p className="text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
    <Sparkles size={14} strokeWidth={2} aria-hidden="true" />
    {title || (reviewed ? "Nhận xét của giáo viên" : "Đánh giá & nhận xét từ AI")}
  </p>
);

export default AiFeedbackView;
