import { STEP_ICONS } from './stepThemes';

/** Placeholder shown inside a step before the analysis has produced its data. */
export function StepEmptyState({ stepNumber, message }: { stepNumber: number; message: string }) {
  const Icon = STEP_ICONS[stepNumber] || STEP_ICONS[1];
  return (
    <div className="py-8 flex flex-col items-center text-center gap-3">
      <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300 flex items-center justify-center">
        <Icon className="w-7 h-7" />
      </div>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">{message}</p>
    </div>
  );
}
