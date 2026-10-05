import React, { useState } from 'react';
import { StepStatus } from '../types';
import { CheckCircle2, Clock, AlertTriangle, AlertCircle, CircleDot, ChevronDown, ChevronUp } from 'lucide-react';

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

  const getStatusBadge = () => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Đã hoàn thành
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 animate-pulse">
            <CircleDot className="w-3.5 h-3.5" />
            Đang xử lý
          </span>
        );
      case 'needs_data':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
            <AlertTriangle className="w-3.5 h-3.5" />
            Cần thêm dữ liệu
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
            <AlertCircle className="w-3.5 h-3.5" />
            Có lỗi
          </span>
        );
      case 'not_started':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            <Clock className="w-3.5 h-3.5" />
            Chưa thực hiện
          </span>
        );
    }
  };

  return (
    <section className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-xs hover:border-slate-300 dark:hover:border-slate-700/80 transition-all mb-8 overflow-hidden">
      {/* Step Header */}
      <div
        className="px-5 py-4 sm:px-6 flex items-start sm:items-center justify-between gap-4 cursor-pointer select-none bg-slate-50/50 dark:bg-slate-850/50 border-b border-slate-100 dark:border-slate-800/60"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs shadow-indigo-600/30">
            {stepNumber}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
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
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label={isExpanded ? 'Thu gọn bước' : 'Mở rộng bước'}
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Step Body */}
      {isExpanded && (
        <div className="p-5 sm:p-6 animate-in fade-in duration-200">
          {children}
        </div>
      )}
    </section>
  );
};
