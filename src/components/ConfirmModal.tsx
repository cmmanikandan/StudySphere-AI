import React from 'react';
import { AlertTriangle, Trash2, LogOut, X, Check, Info } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  type?: 'danger' | 'warning' | 'info';
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  type = 'danger',
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const isDanger = type === 'danger';
  const isWarning = type === 'warning';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn"
      onClick={onCancel}
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-[#0c1220] rounded-3xl p-6 shadow-2xl border border-slate-200/90 dark:border-slate-800/90 space-y-5 animate-scaleUp text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon & Title */}
        <div className="flex items-start gap-3.5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${
              isDanger
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/30'
                : isWarning
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30'
                : 'bg-violet-500/10 text-violet-600 dark:text-violet-400 ring-1 ring-violet-500/30'
            }`}
          >
            {isDanger ? (
              <Trash2 className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            ) : isWarning ? (
              <LogOut className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            ) : (
              <Info className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            )}
          </div>

          <div className="space-y-1 pr-4">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5 ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/25 ring-1 ring-rose-500/30'
                : isWarning
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/25'
                : 'bg-violet-600 hover:bg-violet-700 shadow-violet-500/25'
            }`}
          >
            {isLoading ? (
              <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isDanger ? (
              <Trash2 className="w-3.5 h-3.5" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
