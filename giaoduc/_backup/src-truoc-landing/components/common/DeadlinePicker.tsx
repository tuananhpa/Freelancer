import React, { useState, useEffect, useRef } from 'react';
import { Clock, Calendar, X, Globe } from 'lucide-react';
import { parseDeadlineInfo, getQuickPresetDeadline, toLocalDatetimeInput } from '../../utils/dateUtils';
import { isoToDisplay, displayToIso } from './DateTimePicker';

interface DeadlinePickerProps {
  value: string; // YYYY-MM-DDTHH:mm
  onChange: (val: string) => void;
  label?: string;
  required?: boolean;
  helpText?: string;
}

const DeadlinePicker: React.FC<DeadlinePickerProps> = ({
  value,
  onChange,
  label = 'Hạn nộp bài tập (Deadline)',
  required = false,
  helpText,
}) => {
  const [displayText, setDisplayText] = useState(() => isoToDisplay(value));
  const nativePickerRef = useRef<HTMLInputElement>(null);
  const deadlineInfo = parseDeadlineInfo(value);

  // Sync internal text state when external value changes
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

  const presets = [
    { label: 'Hôm nay 23:59', value: 'TODAY_EOD' as const },
    { label: 'Ngày mai 23:59', value: 'TOMORROW_EOD' as const },
    { label: 'Chủ Nhật 23:59', value: 'THIS_WEEKEND' as const },
    { label: '+1 Tuần', value: 'NEXT_WEEK' as const },
  ];

  const localValue = toLocalDatetimeInput(value);

  return (
    <div className="space-y-1.5">
      {/* Label & Header */}
      <div className="flex items-center justify-between mb-1">
        <label className="flex items-center gap-1.5 text-xs font-bold text-vutru dark:text-night-text">
          <Clock size={14} className="text-cam shrink-0" />
          <span>{label}</span>
          {required && <span className="text-red-500">*</span>}
        </label>

        {value ? (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-cam font-bold">
              ({deadlineInfo.relative})
            </span>
            <button
              type="button"
              onClick={() => {
                onChange('');
                setDisplayText('');
              }}
              className="text-[11px] font-semibold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 transition-colors hover:underline"
            >
              <X size={12} /> Bỏ hạn nộp
            </button>
          </div>
        ) : (
          <span className="text-[10px] font-bold text-vutruNhat dark:text-night-muted flex items-center gap-1">
            <Globe size={11} /> GMT+7
          </span>
        )}
      </div>

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
      <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
        {presets.map((p) => {
          const presetValue = getQuickPresetDeadline(p.value);
          const isSelected = value === presetValue;
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                onChange(presetValue);
                setDisplayText(isoToDisplay(presetValue));
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

      {helpText && (
        <p className="text-[11px] text-vutruNhat dark:text-night-muted">
          {helpText}
        </p>
      )}
    </div>
  );
};

export default DeadlinePicker;
