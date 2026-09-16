import React from 'react';
import { CLINICAL_DISCLAIMER_TEXT } from '../../utils/constants';

export function ClinicalDisclaimer({ compact = false }) {
  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant bg-surface-container-low border border-surface-variant/40 px-2.5 py-1 rounded">
        <span className="material-symbols-outlined text-[13px] text-amber-400 shrink-0">warning</span>
        <span className="truncate">Research Prototype • Model prediction requires clinical review</span>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest/70 border border-surface-variant/40 rounded-xl p-3 text-xs text-on-surface-variant flex items-start gap-2.5 backdrop-blur-sm">
      <span className="material-symbols-outlined text-[16px] text-amber-400 shrink-0 mt-0.5">verified_user</span>
      <div className="flex-1 leading-relaxed text-[11px]">
        <strong className="text-on-surface font-semibold">Clinical Safety Notice: </strong>
        {CLINICAL_DISCLAIMER_TEXT}
      </div>
    </div>
  );
}
