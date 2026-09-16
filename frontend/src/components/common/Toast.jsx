import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export function Toast({ message, type = 'info', onClose, duration = 3500 }) {
  useEffect(() => {
    if (!duration || !onClose) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!message) return null;

  const icons = {
    success: <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />,
    warning: <AlertTriangle size={16} className="text-amber-600 shrink-0" />,
    info: <Info size={16} className="text-teal-600 shrink-0" />,
  };

  const borderColors = {
    success: 'border-emerald-200 bg-emerald-50/95 text-emerald-900',
    warning: 'border-amber-200 bg-amber-50/95 text-amber-900',
    info: 'border-slate-200 bg-white/95 text-slate-800',
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border shadow-lg text-xs font-medium max-w-sm transition-all animate-in slide-in-from-bottom-2">
      <div className={`flex items-center gap-2.5 ${borderColors[type] || borderColors.info} p-2 rounded-md w-full`}>
        {icons[type] || icons.info}
        <span className="flex-1">{message}</span>
        {onClose && (
          <button onClick={onClose} className="opacity-60 hover:opacity-100 p-0.5">
            <X size={13} />
          </button>
        )}
      </div>
    </div>
  );
}
