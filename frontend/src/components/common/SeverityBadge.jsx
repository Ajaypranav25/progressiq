import React from 'react';
import { getSeverityInfo } from '../../utils/formatters';

export function SeverityBadge({ severity, size = 'md', showIndex = false }) {
  const info = getSeverityInfo(severity);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2.5 font-medium',
  }[size] || sizeClasses.md;

  return (
    <span
      className={`inline-flex items-center rounded-md border ${info.badgeBg} ${sizeClasses} tracking-tight select-none`}
      title={info.description}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${info.dotBg} shrink-0`} />
      <span>{info.label}</span>
      {showIndex && (
        <span className="opacity-60 text-[10px] uppercase font-mono font-bold">
          [Grade {info.index}]
        </span>
      )}
    </span>
  );
}
