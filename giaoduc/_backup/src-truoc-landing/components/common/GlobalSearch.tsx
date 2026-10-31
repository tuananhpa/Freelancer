import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchApi } from '../../services/featureApi';

interface SearchResult {
  type: string;
  id: string;
  title: string;
  subtitle: string;
  link: string;
}

const TYPE_LABELS: Record<string, string> = {
  COURSE: 'Khóa học',
  EXAM: 'Đề thi',
  DECK: 'Flashcard',
  CLASS: 'Lớp học',
};

const GlobalSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await searchApi.search(q.trim());
      setResults(res.data || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (open) doSearch(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, open, doSearch]);

  const handleSelect = (link: string) => {
    setOpen(false);
    setQuery('');
    navigate(link);
  };

  return (
    <div ref={wrapperRef} className="relative hidden md:block w-56 lg:w-72">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Tìm kiếm..."
          className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-night-border bg-gray-50 dark:bg-night-elevated outline-none focus:border-cam focus:ring-1 focus:ring-cam/30"
        />
      </div>

      {open && (query.length >= 2 || results.length > 0) && (
        <div className="absolute top-full mt-2 w-full bg-white dark:bg-night-surface rounded-xl shadow-lg border border-gray-100 dark:border-night-border z-50 max-h-80 overflow-y-auto">
          {loading ? (
            <p className="px-4 py-3 text-sm text-vutruNhat">Đang tìm...</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-vutruNhat">Không có kết quả</p>
          ) : (
            results.map((r) => (
              <button
                key={`${r.type}-${r.id}`}
                onClick={() => handleSelect(r.link)}
                className="w-full text-left px-4 py-3 hover:bg-kem dark:hover:bg-night-elevated border-b border-gray-50 dark:border-night-border last:border-0"
              >
                <p className="text-sm font-semibold text-vutru truncate">{r.title}</p>
                <p className="text-xs text-vutruNhat">{TYPE_LABELS[r.type] || r.type} · {r.subtitle}</p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
