import React from 'react';
import { ChevronLeft, ChevronRight, Save, Loader2 } from 'lucide-react';

interface StepperFooterProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  onFinish: () => void;
  onSecondaryFinish?: () => void;
  secondaryFinishLabel?: string;
  isSubmitting?: boolean;
  finishLabel?: string;
  nextLabel?: string;
  backLabel?: string;
  /** Extra content shown on the left side of the footer (e.g., auto-save status) */
  leftSlot?: React.ReactNode;
}

const StepperFooter: React.FC<StepperFooterProps> = ({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  onFinish,
  onSecondaryFinish,
  secondaryFinishLabel = 'Lưu nháp',
  isSubmitting = false,
  finishLabel = 'Lưu',
  nextLabel = 'Tiếp tục',
  backLabel = 'Quay lại',
  leftSlot,
}) => {
  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;

  return (
    <div className="flex items-center justify-between gap-4 pt-5 mt-6 border-t border-gray-100 dark:border-night-border">
      {/* Left: slot for auto-save status or empty */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {leftSlot ?? <div />}
      </div>

      {/* Center: step counter */}
      <span className="text-sm text-gray-400 font-medium shrink-0 hidden sm:block">
        Bước {currentStep + 1} / {totalSteps}
      </span>

      {/* Right: navigation buttons */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Back */}
        <button
          type="button"
          onClick={onBack}
          disabled={isFirst}
          className={`
            flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all
            ${isFirst
              ? 'opacity-0 pointer-events-none'
              : 'text-gray-600 dark:text-gray-300 border-gray-200 dark:border-night-border hover:bg-gray-50 dark:hover:bg-night-elevated'
            }
          `}
        >
          <ChevronLeft className="w-4 h-4" />
          {backLabel}
        </button>

        {/* Next or Finish */}
        {isLast ? (
          <div className="flex items-center gap-2.5">
            {onSecondaryFinish && (
              <button
                type="button"
                onClick={onSecondaryFinish}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 dark:border-night-border text-vutru dark:text-night-text hover:bg-gray-50 dark:hover:bg-night-elevated transition-all disabled:opacity-60"
              >
                {secondaryFinishLabel}
              </button>
            )}
            <button
              type="button"
              onClick={onFinish}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-bold bg-cam text-white hover:bg-camDam disabled:opacity-60 transition-all shadow-md shadow-cam/20"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSubmitting ? 'Đang lưu...' : finishLabel}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onNext}
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-bold bg-cam text-white hover:bg-camDam transition-all shadow-md shadow-cam/20"
          >
            {nextLabel}
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default StepperFooter;
