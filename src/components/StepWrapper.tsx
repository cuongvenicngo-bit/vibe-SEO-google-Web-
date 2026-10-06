import React, { useState } from 'react';
import { StepStatus } from '../types';
import { CheckCircle2, AlertTriangle, AlertCircle, CircleDot, ChevronDown, Lock, Sparkles } from 'lucide-react';
import { STEP_ICONS } from './stepThemes';

interface StepWrapperProps {
  stepNumber: number;
  title: string;
  subtitle: string;
  status: StepStatus;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
  defaultExpanded?: boolean;
}

export const StepWrapper: React.FC<StepWrapperProps> = ({
  stepNumber,
  title,
  subtitle,
  status,
  children,
  headerAction,
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const Icon = STEP_ICONS[stepNumber] || STEP_ICONS[1];
  // Before the first analysis: step 1 is where the user starts, steps 2-8 are previews.
  const isLocked = status === 'not_started' && stepNumber > 1;
  const isCurrent = status === 'not_started' && stepNumber === 1;

  const getStatusBadge = () => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Đã hoàn thành
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800/60 animate-pulse">
            <CircleDot className="w-3.5 h-3.5" />
            Đang xử lý
          </span>
        );
      case 'needs_data':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
            <AlertTriangle className="w-3.5 h-3.5" />
            Cần thêm dữ liệu
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
            <AlertCircle className="w-3.5 h-3.5" />
            Có lỗi
          </span>
        );
      case 'not_started':
      default:
        return isCurrent ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-brand-600 text-white shadow-sm shadow-brand-600/30">
            <Sparkles className="w-3.5 h-3.5" />
            Bắt đầu tại đây
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            <Lock className="w-3 h-3" />
            Mở sau khi phân tích
          </span>
        );
    }
  };

  return (
    <section
      id={`buoc-${stepNumber}`}
      data-state={isLocked ? 'locked' : isCurrent ? 'current' : undefined}
      className="step-card surface-card relative rounded-2xl transition-all mb-6 overflow-hidden scroll-mt-20"
    >
      {/* Step Header */}
      <div
        className="step-header pl-6 pr-4 py-4 sm:pl-7 sm:pr-6 flex items-start sm:items-center justify-between gap-3 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          <div
            className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0 leading-none ${
              isLocked
                ? 'bg-brand-50 text-brand-600 ring-1 ring-brand-200 dark:bg-brand-950/50 dark:text-brand-300 dark:ring-brand-800'
                : 'step-badge'
            }`}
          >
            <Icon className="w-4 h-4 mb-0.5 opacity-90" />
            <span className="text-[11px] font-black">{stepNumber}</span>
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className={`text-base sm:text-lg font-bold tracking-tight ${isLocked ? 'text-slate-700 dark:text-slate-200' : 'text-slate-900 dark:text-white'}`}>
                {title}
              </h2>
              {getStatusBadge()}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          {headerAction}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label={isExpanded ? 'Thu gọn bước' : 'Mở rộng bước'}
            aria-expanded={isExpanded}
          >
            <ChevronDown className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Step Body */}
      {isExpanded && (
        <div className="step-body pl-5 pr-3 py-5 sm:pl-7 sm:pr-6 sm:py-6 animate-in">
          {children}
        </div>
      )}
    </section>
  );
};
