import React from 'react';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
  isLoading = false,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  const iconColors = {
    danger: 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400',
    warning: 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400',
    info: 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400',
  };

  const buttonColors = {
    danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20',
    warning: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20',
    info: 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-scaleUp">
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconColors[variant]}`}
          >
            {variant === 'danger' && <AlertTriangle className="w-5 h-5" />}
            {variant === 'warning' && <AlertCircle className="w-5 h-5" />}
            {variant === 'info' && <Info className="w-5 h-5" />}
          </div>
          <div className="flex-1 space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {description}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition-all flex items-center gap-2 ${buttonColors[variant]}`}
          >
            {isLoading && (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
