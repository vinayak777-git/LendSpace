import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toastMessage, clearToast } = useAppStore();

  if (!toastMessage) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-500 shrink-0" />,
  };

  const bgStyles = {
    success: 'bg-emerald-950/90 border-emerald-700/50 text-emerald-100',
    error: 'bg-rose-950/90 border-rose-700/50 text-rose-100',
    warning: 'bg-amber-950/90 border-amber-700/50 text-amber-100',
    info: 'bg-slate-900/95 border-slate-700 text-slate-100',
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div
        className={`flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md ${bgStyles[toastMessage.type]}`}
      >
        {icons[toastMessage.type]}
        <div className="flex-1 text-sm leading-relaxed">{toastMessage.text}</div>
        <button
          onClick={clearToast}
          className="text-slate-400 hover:text-white transition-colors"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
