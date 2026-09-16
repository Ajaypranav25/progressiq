import React from 'react';
import { formatConfidence } from '../../utils/formatters';

export function ConfidenceBar({ confidence, showLabel = true, size = 'md' }) {
  if (confidence === null || confidence === undefined) return null;

  const numericVal = typeof confidence === 'number' ? confidence : parseFloat(confidence);
  const pct = Math.min(100, Math.max(0, Math.round(numericVal <= 1.0 ? numericVal * 100 : numericVal)));

  // Clinical confidence thresholds
  let color = 'bg-teal-500';
  if (pct >= 90) {
    color = 'bg-emerald-500';
  } else if (pct < 80) {
    color = 'bg-amber-500';
  }

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  }[size] || 'h-2';

  return (
    <div className="w-full flex flex-col gap-1">
      {showLabel && (
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-500 font-medium">Model Confidence</span>
          <span className="font-mono font-semibold text-slate-800">{formatConfidence(confidence)}</span>
        </div>
      )}
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${heightClasses} border border-slate-200/60`}>
        <div
          className={`${heightClasses} ${color} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
