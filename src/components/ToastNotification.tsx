import React from 'react';
import { ToastMessage } from '../hooks/useToast';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface ToastNotificationProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success' || !toast.type;
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-3 duration-200 ${
              isSuccess
                ? 'bg-slate-900/95 dark:bg-slate-100/95 text-white dark:text-slate-900 border-slate-700/50 dark:border-slate-300'
                : isError
                ? 'bg-rose-900/95 text-white border-rose-700'
                : 'bg-indigo-900/95 text-white border-indigo-700'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400 dark:text-emerald-600 shrink-0" />}
              {isError && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
              {!isSuccess && !isError && <Info className="w-5 h-5 text-indigo-400 shrink-0" />}
              <span className="text-sm font-medium leading-snug">{toast.message}</span>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="p-1 rounded-md opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
