import React from 'react';
import { Check, AlertTriangle } from 'lucide-react';

export type StepState = 'active' | 'completed' | 'error' | 'pending';

export interface StepConfig {
  id: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

interface StepperProps {
  steps: StepConfig[];
  currentStep: number; // 0-indexed
  stepStates: StepState[]; // length must equal steps.length
  onStepClick: (index: number) => void;
  className?: string;
}

const stepStyle: Record<StepState, { circle: string; text: string; connector: string }> = {
  active: {
    circle: 'bg-cam text-white border-cam shadow-md shadow-cam/30',
    text: 'text-cam font-bold',
    connector: 'bg-gray-200 dark:bg-night-border',
  },
  completed: {
    circle: 'bg-cam text-white border-cam',
    text: 'text-cam font-semibold',
    connector: 'bg-cam',
  },
  error: {
    circle: 'bg-red-500 text-white border-red-500',
    text: 'text-red-500 font-semibold',
    connector: 'bg-gray-200 dark:bg-night-border',
  },
  pending: {
    circle: 'bg-white dark:bg-night-elevated text-gray-400 border-gray-200 dark:border-night-border',
    text: 'text-gray-400',
    connector: 'bg-gray-200 dark:bg-night-border',
  },
};

const Stepper: React.FC<StepperProps> = ({ steps, currentStep, stepStates, onStepClick, className = '' }) => {
  return (
    <>
      {/* Desktop: full stepper */}
      <div className={`hidden md:flex items-start justify-between w-full ${className}`}>
        {steps.map((step, index) => {
          const state = stepStates[index] ?? 'pending';
          const style = stepStyle[state];
          const isLast = index === steps.length - 1;

          return (
            <React.Fragment key={step.id}>
              {/* Step item */}
              <button
                type="button"
                onClick={() => onStepClick(index)}
                className="flex flex-col items-center gap-2 flex-1 min-w-0 group focus:outline-none"
              >
                {/* Circle */}
                <div
                  className={`
                    w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0
                    transition-all duration-200 group-hover:scale-110
                    ${style.circle}
                  `}
                >
                  {state === 'completed' ? (
                    <Check className="w-5 h-5" />
                  ) : state === 'error' ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <span className="text-sm font-bold">{index + 1}</span>
                  )}
                </div>

                {/* Text */}
                <div className="text-center px-1">
                  <p className={`text-xs transition-colors ${style.text}`}>{step.title}</p>
                  {step.subtitle && (
                    <p className="text-[10px] text-gray-400 dark:text-night-muted mt-0.5 leading-snug">{step.subtitle}</p>
                  )}
                </div>
              </button>

              {/* Connector line */}
              {!isLast && (
                <div className="flex-1 mx-2 mt-5 shrink-0">
                  <div
                    className={`h-0.5 w-full transition-all duration-300 ${
                      stepStates[index] === 'completed' ? 'bg-cam' : 'bg-gray-200 dark:bg-night-border'
                    }`}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile: compact "Step X / N" */}
      <div className="flex md:hidden items-center justify-between gap-3 py-2">
        <button
          type="button"
          onClick={() => onStepClick(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="text-gray-400 disabled:opacity-30 hover:text-cam transition-colors p-1"
          aria-label="Bước trước"
        >
          ←
        </button>
        <div className="flex-1 text-center">
          <p className="text-sm font-bold text-vutru dark:text-white">
            {steps[currentStep]?.title}
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-1.5">
            {steps.map((_, index) => {
              const state = stepStates[index] ?? 'pending';
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => onStepClick(index)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    state === 'active'
                      ? 'bg-cam w-5'
                      : state === 'completed'
                      ? 'bg-cam w-3'
                      : state === 'error'
                      ? 'bg-red-500 w-3'
                      : 'bg-gray-200 dark:bg-night-border w-3'
                  }`}
                  aria-label={`Bước ${index + 1}`}
                />
              );
            })}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onStepClick(Math.min(steps.length - 1, currentStep + 1))}
          disabled={currentStep === steps.length - 1}
          className="text-gray-400 disabled:opacity-30 hover:text-cam transition-colors p-1"
          aria-label="Bước tiếp theo"
        >
          →
        </button>
      </div>
    </>
  );
};

export default Stepper;
