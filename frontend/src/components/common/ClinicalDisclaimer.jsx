import React from 'react';
import { AlertCircle } from 'lucide-react';
import { CLINICAL_DISCLAIMER_TEXT } from '../../utils/constants';

export function ClinicalDisclaimer({ compact = false }) {
  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded">
        <AlertCircle size={12} className="text-amber-600 shrink-0" />
        <span className="truncate">Research Prototype • Model output requires clinical review</span>
      </div>
    );
  }

  return (
    <div className="bg-slate-50/90 border border-slate-200 rounded-md p-3 text-xs text-slate-600 flex items-start gap-2.5">
      <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
      <div className="flex-1 leading-relaxed">
        <span className="font-semibold text-slate-700">Notice for Medical Evaluators: </span>
        {CLINICAL_DISCLAIMER_TEXT}
      </div>
    </div>
  );
}
