import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, X, Globe } from 'lucide-react';
import { toLocalDatetimeInput } from '../../utils/dateUtils';

interface DateTimePickerProps {
  value: string; // YYYY-MM-DDTHH:mm or ISO string
  onChange: (val: string) => void;
  label?: string;
  required?: boolean;
  helpText?: string;
  placeholder?: string;
  showPresets?: boolean;
  className?: string;
}

/** Converts "2026-08-24T23:59" to "24/08/2026 23:59" */
export const isoToDisplay = (isoStr?: string | null): string => {
  if (!isoStr) return '';
  const local = toLocalDatetimeInput(isoStr);
  if (!local || !local.includes('T')) return '';
  const [datePart, timePart] = local.split('T');
  const [year, month, day] = datePart.split('-');
  if (!year || !month || !day || year.length !== 4) return '';
  const [hour, minute] = timePart.split(':');
  return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year} ${hour ? hour.padStart(2, '0') : '00'}:${minute ? minute.padStart(2, '0') : '00'}`;
};

/** Parses user typed "24/08/2026 23:59" or "24/08/2026" to "2026-08-24T23:59" */
export const displayToIso = (text: string): string => {
  if (!text || !text.trim()) return '';
  const clean = text.trim();

  // Pattern 1: dd/mm/yyyy hh:mm or dd-mm-yyyy hh:mm
  const matchWithTime = clean.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})\s+(\d{1,2}):(\d{1,2})/);
  if (matchWithTime) {
    const day = matchWithTime[1].padStart(2, '0');
    const month = matchWithTime[2].padStart(2, '0');
    const year = matchWithTime[3];
    const hour = matchWithTime[4].padStart(2, '0');
    const minute = matchWithTime[5].padStart(2, '0');
    const yNum = parseInt(year, 10);
    const mNum = parseInt(month, 10);
    const dNum = parseInt(day, 10);
    const hNum = parseInt(hour, 10);
    const minNum = parseInt(minute, 10);
    if (yNum >= 1900 && yNum <= 2100 && mNum >= 1 && mNum <= 12 && dNum >= 1 && dNum <= 31 && hNum <= 23 && minNum <= 59) {
      return `${year}-${month}-${day}T${hour}:${minute}`;
    }
  }

  // Pattern 2: dd/mm/yyyy
  const matchDateOnly = clean.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (matchDateOnly) {
    const day = matchDateOnly[1].padStart(2, '0');
    const month = matchDateOnly[2].padStart(2, '0');
    const year = matchDateOnly[3];
    const yNum = parseInt(year, 10);
    const mNum = parseInt(month, 10);
    const dNum = parseInt(day, 10);
    if (yNum >= 1900 && yNum <= 2100 && mNum >= 1 && mNum <= 12 && dNum >= 1 && dNum <= 31) {
      return `${year}-${month}-${day}T23:59`;
    }
  }

  return '';
};

const DateTimePicker: React.FC<DateTimePickerProps> = ({
  value,
  onChange,
  label,
  required = false,
  helpText,
  showPresets = true,
  className = '',
}) => {
  const [displayText, setDisplayText] = useState(() => isoToDisplay(value));
  const nativePickerRef = useRef<HTMLInputElement>(null);

  // Sync internal text state whenever external value changes
  useEffect(() => {
    setDisplayText(isoToDisplay(value));
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    setDisplayText(newText);
    const parsedIso = displayToIso(newText);
    if (parsedIso) {
      onChange(parsedIso);
    } else if (!newText.trim()) {
      onChange('');
    }
  };

  const handleBlur = () => {
    // If text was invalid or partial, sync back with last valid value or clear
    if (!displayText.trim()) {
      onChange('');
      setDisplayText('');
    } else {
      const parsedIso = displayToIso(displayText);
      if (parsedIso) {
        onChange(parsedIso);
        setDisplayText(isoToDisplay(parsedIso));
      } else if (value) {
        setDisplayText(isoToDisplay(value));
      } else {
        setDisplayText('');
      }
    }
  };

  const handleNativePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    if (rawVal) {
      onChange(rawVal);
      setDisplayText(isoToDisplay(rawVal));
    }
  };

  const openCalendar = () => {
    if (nativePickerRef.current) {
      if (typeof nativePickerRef.current.showPicker === 'function') {
        nativePickerRef.current.showPicker();
      } else {
        nativePickerRef.current.focus();
      }
    }
  };

  const getQuickPreset = (type: 'TODAY' | 'TOMORROW' | 'NEXT_WEEK') => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');

    if (type === 'TODAY') {
      return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T23:59`;
    }
    if (type === 'TOMORROW') {
      now.setDate(now.getDate() + 1);
      return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T23:59`;
    }
    if (type === 'NEXT_WEEK') {
      now.setDate(now.getDate() + 7);
      return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T23:59`;
    }
    return '';
  };

  const localValue = toLocalDatetimeInput(value);

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Label & Header */}
      {label && (
        <div className="flex items-center justify-between mb-1">
          <label className="flex items-center gap-1.5 text-xs font-bold text-vutru dark:text-night-text">
            <Calendar size={14} className="text-cam shrink-0" />
            <span>{label}</span>
            {required && <span className="text-red-500">*</span>}
          </label>

          {value ? (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setDisplayText('');
              }}
              className="text-[11px] font-semibold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 transition-colors hover:underline"
            >
              <X size={12} /> Bỏ chọn
            </button>
          ) : (
            <span className="text-[10px] font-bold text-vutruNhat dark:text-night-muted flex items-center gap-1">
              <Globe size={11} /> GMT+7
            </span>
          )}
        </div>
      )}

      {/* Interactive Input with Direct Typing & Calendar Picker Trigger */}
      <div className="relative flex items-center">
        <div 
          onClick={openCalendar}
          className="absolute left-3 text-cam cursor-pointer hover:scale-110 transition-transform"
          title="Bấm để mở lịch chọn ngày giờ"
        >
          <Calendar size={15} />
        </div>

        <input
          type="text"
          value={displayText}
          onChange={handleTextChange}
          onBlur={handleBlur}
          placeholder="dd/mm/yyyy hh:mm (VD: 24/08/2026 23:59)"
          className="w-full pl-9 pr-10 py-2 rounded-xl border border-gray-200 dark:border-night-border bg-white dark:bg-night-surface text-vutru dark:text-night-text text-xs sm:text-sm font-medium focus:outline-none focus:border-cam focus:ring-2 focus:ring-cam/20 transition-all placeholder:text-gray-400 dark:placeholder:text-night-muted shadow-2xs"
        />

        <button
          type="button"
          onClick={openCalendar}
          className="absolute right-2.5 p-1 text-gray-400 hover:text-cam dark:hover:text-cam transition-colors rounded-lg"
          title="Chọn từ lịch"
        >
          <Clock size={15} />
        </button>

        {/* Hidden Native Picker */}
        <input
          ref={nativePickerRef}
          type="datetime-local"
          value={localValue}
          onChange={handleNativePickerChange}
          tabIndex={-1}
          aria-hidden="true"
          className="absolute opacity-0 pointer-events-none w-0 h-0"
        />
      </div>

      {/* Quick Presets without emojis */}
      {showPresets && (
        <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
          {[
            { label: 'Hôm nay', type: 'TODAY' as const },
            { label: 'Ngày mai', type: 'TOMORROW' as const },
            { label: '+1 Tuần', type: 'NEXT_WEEK' as const },
          ].map((p) => {
            const pVal = getQuickPreset(p.type);
            const isSelected = localValue === pVal;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  onChange(pVal);
                  setDisplayText(isoToDisplay(pVal));
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  isSelected
                    ? 'bg-cam text-white shadow-2xs font-extrabold'
                    : 'bg-gray-100/90 dark:bg-night-elevated text-vutruNhat dark:text-night-text hover:bg-gray-200/80 dark:hover:bg-night-border hover:text-vutru border border-gray-200/50 dark:border-night-border'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      )}

      {helpText && (
        <p className="text-[11px] text-vutruNhat dark:text-night-muted">
          {helpText}
        </p>
      )}
    </div>
  );
};

export default DateTimePicker;
