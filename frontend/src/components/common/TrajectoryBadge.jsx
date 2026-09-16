import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { TRAJECTORY_STATUS } from '../../utils/constants';

export function TrajectoryBadge({ status, size = 'md' }) {
  let config = TRAJECTORY_STATUS.STABLE;

  if (status === 'increased_severity' || status === 'increased' || status === 'progression_detected') {
    config = TRAJECTORY_STATUS.INCREASED;
  } else if (status === 'decreased_severity' || status === 'decreased' || status === 'reduction_detected') {
    config = TRAJECTORY_STATUS.DECREASED;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-medium',
  }[size] || sizeClasses.md;

  const iconSize = size === 'sm' ? 12 : size === 'lg' ? 16 : 14;

  return (
    <span className={`inline-flex items-center rounded-md border ${config.badgeBg} ${sizeClasses} select-none`}>
      {config.trend === 'up' && <TrendingUp size={iconSize} className="text-rose-600 shrink-0" />}
      {config.trend === 'down' && <TrendingDown size={iconSize} className="text-emerald-600 shrink-0" />}
      {config.trend === 'neutral' && <Minus size={iconSize} className="text-slate-500 shrink-0" />}
      <span>{config.label}</span>
    </span>
  );
}
