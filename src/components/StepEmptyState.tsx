import { STEP_THEMES, stepStyle } from './stepThemes';

/** Placeholder shown inside a step before the analysis has produced its data. */
export function StepEmptyState({ stepNumber, message }: { stepNumber: number; message: string }) {
  const Icon = (STEP_THEMES[stepNumber] || STEP_THEMES[1]).icon;
  return (
    <div className="py-8 flex flex-col items-center text-center gap-3" style={stepStyle(stepNumber)}>
      <div className="relative">
        <div className="absolute inset-0 rounded-full blur-xl opacity-40 step-badge" />
        <div className="relative w-14 h-14 rounded-2xl step-icon flex items-center justify-center border border-white/60 dark:border-white/10">
          <Icon className="w-7 h-7" />
        </div>
      </div>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">{message}</p>
    </div>
  );
}
