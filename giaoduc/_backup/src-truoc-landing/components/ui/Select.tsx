import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  hint?: string;
}

interface SelectProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

/** Danh sach lua chon co dinh (nhan/gia tri), thay cho <select>/<option> cua
 * trinh duyet - <select> luon hien bang tuy chon theo giao dien mac dinh cua
 * he dieu hanh (thuong nen den), lech han theme sang cua trang. */
function Select<T extends string = string>({ value, onChange, options, className, placeholder, disabled }: SelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    // className cua nguoi goi duoc dat ca o wrapper lan nut bam: cac lop kich
    // thuoc/layout (flex-1, w-full, max-w-...) can nam tren chinh phan tu la
    // flex/grid item (wrapper), con cac lop giao dien (bg, border, padding...)
    // van hien thi dung tren nut bam - trung lap vo hai vi wrapper khong co
    // noi dung rieng nao khac.
    <div className={`relative ${className || ''}`} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(prev => !prev)}
        title={selected?.hint}
        className={`${className || ''} w-full flex items-center justify-between gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <span className="truncate">{selected ? selected.label : (placeholder || '')}</span>
        <ChevronDown size={14} className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute z-20 mt-1 min-w-full w-max max-h-64 overflow-y-auto bg-white dark:bg-night-surface border border-gray-200 dark:border-night-border rounded-xl shadow-lg py-1.5">
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              title={opt.hint}
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
              className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between gap-3 transition-colors ${
                opt.value === value
                  ? 'bg-camNhat/40 dark:bg-night-elevated text-cam font-semibold'
                  : 'text-vutru dark:text-night-text hover:bg-camNhat/40 dark:hover:bg-night-elevated'
              }`}
            >
              <span className="truncate">{opt.label}</span>
              {opt.value === value && <Check size={14} className="shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default Select;
