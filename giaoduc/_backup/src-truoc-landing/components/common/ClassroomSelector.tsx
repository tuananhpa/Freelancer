import React, { useState, useEffect, useRef } from 'react';
import classService, { Classroom } from '../../services/class.service';
import { AlertCircle, ChevronDown, Check, Search, X, Users } from 'lucide-react';

interface ClassroomSelectorProps {
  selectedClassIds: string[];
  onChange: (classIds: string[]) => void;
  className?: string;
}

export default function ClassroomSelector({ selectedClassIds, onChange, className = '' }: ClassroomSelectorProps) {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    const fetchClasses = async () => {
      try {
        setLoading(true);
        const res = await classService.getMyClasses();
        if (mounted) {
          setClassrooms(res.content || res.data?.content || []);
        }
      } catch {
        if (mounted) {
          setError('Không thể tải danh sách lớp học');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    fetchClasses();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleClass = (classId: string) => {
    if (selectedClassIds.includes(classId)) {
      onChange(selectedClassIds.filter(id => id !== classId));
    } else {
      onChange([...selectedClassIds, classId]);
    }
  };

  const removeClass = (classId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedClassIds.filter(id => id !== classId));
  };

  const filteredClasses = classrooms.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.subject && c.subject.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectedClassObjects = classrooms.filter(c => selectedClassIds.includes(c.id));

  if (loading) {
    return <div className={`animate-pulse h-12 bg-gray-100 dark:bg-night-elevated rounded-2xl ${className}`} />;
  }

  if (error) {
    return (
      <div className={`flex items-center gap-2 text-rose-500 text-xs p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200/60 dark:border-rose-800/40 ${className}`}>
        <AlertCircle size={15} />
        {error}
      </div>
    );
  }

  if (classrooms.length === 0) {
    return (
      <div className={`text-xs text-vutruNhat dark:text-night-muted italic p-3 bg-gray-50 dark:bg-night-elevated rounded-xl border border-dashed border-gray-200 dark:border-night-border ${className}`}>
        Bạn chưa tham gia hoặc tạo lớp học nào.
      </div>
    );
  }

  return (
    <div className={`relative font-body ${className}`} ref={dropdownRef}>
      {/* Selector Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`w-full p-3 bg-white dark:bg-night-surface rounded-2xl border transition-all flex items-center justify-between text-left focus-visible:ring-2 focus-visible:ring-cam outline-none ${
          isOpen
            ? 'border-cam shadow-soft ring-2 ring-cam/15 dark:border-cam'
            : 'border-gray-200 dark:border-night-border hover:border-cam/40 dark:hover:border-cam/40'
        }`}
      >
        <div className="flex-1 min-w-0 pr-2">
          {selectedClassObjects.length === 0 ? (
            <span className="text-xs sm:text-sm text-vutruNhat dark:text-night-muted">
              -- Chọn một hoặc nhiều lớp học để giao --
            </span>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-camDam dark:text-cam bg-camNhat/30 dark:bg-cam/15 px-2.5 py-0.5 rounded-lg">
                Đã chọn {selectedClassObjects.length} lớp
              </span>
              <span className="text-xs text-vutru dark:text-night-text truncate font-medium max-w-xs">
                {selectedClassObjects.map(c => c.name).join(', ')}
              </span>
            </div>
          )}
        </div>
        <ChevronDown
          size={18}
          className={`text-vutruNhat shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-cam' : ''}`}
        />
      </button>

      {/* Selected Classroom Chips */}
      {selectedClassObjects.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selectedClassObjects.map(c => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gray-100 dark:bg-night-elevated text-vutru dark:text-night-text text-xs font-medium border border-gray-200 dark:border-night-border animate-scale-in"
            >
              <Users size={12} className="text-cam" />
              <span className="truncate max-w-[180px]">{c.name}</span>
              <button
                type="button"
                onClick={(e) => removeClass(c.id, e)}
                className="hover:text-rose-500 rounded-full p-0.5 transition-colors"
                title="Bỏ chọn lớp"
                aria-label={`Bỏ chọn lớp ${c.name}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute z-50 w-full mt-2 bg-white dark:bg-night-surface border border-gray-100 dark:border-night-border rounded-2xl shadow-soft max-h-72 overflow-hidden flex flex-col animate-fade-in"
        >
          {/* Search Box inside dropdown */}
          {classrooms.length > 4 && (
            <div className="p-2.5 border-b border-gray-100 dark:border-night-border bg-gray-50/50 dark:bg-night-elevated/40">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm kiếm lớp học..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-night-surface rounded-xl border border-gray-200 dark:border-night-border text-vutru dark:text-night-text placeholder:text-gray-400 outline-none focus:border-cam"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* List of classes */}
          <div className="overflow-y-auto p-1.5 space-y-0.5 divide-y-0">
            {filteredClasses.length === 0 ? (
              <div className="text-center py-6 text-xs text-vutruNhat dark:text-night-muted italic">
                Không tìm thấy lớp học phù hợp
              </div>
            ) : (
              filteredClasses.map(c => {
                const isSelected = selectedClassIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => toggleClass(c.id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors text-left group ${
                      isSelected
                        ? 'bg-camNhat/20 dark:bg-cam/15 font-semibold text-camDam dark:text-cam'
                        : 'hover:bg-gray-50 dark:hover:bg-night-elevated text-vutru dark:text-night-text'
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="text-xs sm:text-sm font-bold truncate group-hover:text-cam transition-colors">
                        {c.name}
                      </div>
                      <div className="text-[11px] text-vutruNhat dark:text-night-muted truncate">
                        {c.subject || 'Chung'}{c.section ? ` • ${c.section}` : ''}
                      </div>
                    </div>

                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                      isSelected
                        ? 'bg-cam text-white border-cam shadow-2xs'
                        : 'border-gray-300 dark:border-night-border group-hover:border-cam/50'
                    }`}>
                      {isSelected && <Check size={13} strokeWidth={3} />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
