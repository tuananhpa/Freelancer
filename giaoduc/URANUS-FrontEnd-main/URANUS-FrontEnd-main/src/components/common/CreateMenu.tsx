import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookText, GalleryVerticalEnd, ClipboardList, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const createOptions = [
  {
    id: 'exam',
    label: 'Đề Thi',
    description: 'Bài kiểm tra trắc nghiệm',
    icon: ClipboardList,
    to: '/exams/create',
    roles: ['TEACHER', 'TEACHING_ASSISTANT', 'ADMIN'],
  },
  {
    id: 'vocabulary',
    label: 'Từ Vựng',
    description: 'Bộ từ vựng luyện tập',
    icon: BookText,
    to: '/vocabulary/create',
    roles: ['TEACHER', 'TEACHING_ASSISTANT', 'ADMIN'],
  },
  {
    id: 'flashcard',
    label: 'Thẻ Ghi Nhớ',
    description: 'Bộ thẻ ghi nhớ',
    icon: GalleryVerticalEnd,
    to: '/flashcards/create',
    roles: ['TEACHER', 'TEACHING_ASSISTANT', 'ADMIN'],
  },
];

const CreateMenu: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const visibleOptions = createOptions.filter((opt) => user && opt.roles.includes(user.role));

  if (visibleOptions.length === 0) return null;

  return (
    <div className="relative font-body" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-10 h-10 aspect-square shrink-0 rounded-full theme-fab text-xl font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center focus-visible:ring-2 focus-visible:ring-cam outline-none"
        aria-label="Tạo mới tài nguyên"
        aria-expanded={open}
        aria-haspopup="menu"
        title="Tạo mới"
      >
        <Plus size={22} strokeWidth={2.5} className={`transition-transform duration-200 ${open ? 'rotate-45' : ''}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-60 bg-white dark:bg-night-surface rounded-2xl shadow-soft border border-gray-100 dark:border-night-border overflow-hidden z-50 animate-fade-in"
        >
          <div className="px-4 py-2.5 bg-gray-50/60 dark:bg-night-elevated/40 border-b border-gray-100 dark:border-night-border">
            <p className="text-[11px] font-bold text-vutruNhat dark:text-night-muted uppercase tracking-wider">Tạo nội dung mới</p>
          </div>
          <div className="p-1.5 space-y-0.5">
            {visibleOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    navigate(opt.to);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-camNhat/20 dark:hover:bg-night-elevated transition-colors group"
                >
                  <span className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-night-elevated border border-gray-200/80 dark:border-night-border flex items-center justify-center shrink-0 text-vutruNhat dark:text-night-muted group-hover:text-cam group-hover:border-cam/30 transition-colors">
                    <Icon size={16} strokeWidth={2} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-bold text-vutru dark:text-night-text group-hover:text-cam transition-colors truncate">{opt.label}</p>
                    <p className="text-[11px] text-vutruNhat dark:text-night-muted truncate">{opt.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateMenu;
