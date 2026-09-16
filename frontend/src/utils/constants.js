/**
 * ProgressIQ Clinical Constants & Severity Classifications
 * Diabetic Retinopathy (DR) 5-scale grading
 */

export const DR_SEVERITY = {
  0: {
    index: 0,
    label: 'No DR',
    shortLabel: 'None',
    description: 'No apparent diabetic retinopathy lesions',
    color: 'emerald',
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dotBg: 'bg-emerald-500',
    indicatorColor: '#10b981',
  },
  1: {
    index: 1,
    label: 'Mild DR',
    shortLabel: 'Mild',
    description: 'Microaneurysms only',
    color: 'teal',
    badgeBg: 'bg-teal-50 text-teal-800 border-teal-200',
    dotBg: 'bg-teal-500',
    indicatorColor: '#14b8a6',
  },
  2: {
    index: 2,
    label: 'Moderate DR',
    shortLabel: 'Moderate',
    description: 'More than microaneurysms but less than severe DR',
    color: 'amber',
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
    dotBg: 'bg-amber-500',
    indicatorColor: '#f59e0b',
  },
  3: {
    index: 3,
    label: 'Severe DR',
    shortLabel: 'Severe',
    description: 'Severe intraretinal hemorrhages, venous beading, or IRMA',
    color: 'orange',
    badgeBg: 'bg-orange-50 text-orange-800 border-orange-200',
    dotBg: 'bg-orange-500',
    indicatorColor: '#f97316',
  },
  4: {
    index: 4,
    label: 'Proliferative DR',
    shortLabel: 'Proliferative',
    description: 'Neovascularization and/or vitreous/preretinal hemorrhage',
    color: 'rose',
    badgeBg: 'bg-rose-50 text-rose-800 border-rose-200',
    dotBg: 'bg-rose-600',
    indicatorColor: '#e11d48',
  },
};

export const TRAJECTORY_STATUS = {
  INCREASED: {
    status: 'increased_severity',
    label: 'Increased Severity Detected',
    badgeBg: 'bg-rose-50 text-rose-800 border-rose-200',
    dotBg: 'bg-rose-600',
    trend: 'up',
  },
  STABLE: {
    status: 'stable',
    label: 'Stable Diagnostic Profile',
    badgeBg: 'bg-slate-100 text-slate-700 border-slate-300',
    dotBg: 'bg-slate-500',
    trend: 'neutral',
  },
  DECREASED: {
    status: 'decreased_severity',
    label: 'Decreased Severity Detected',
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dotBg: 'bg-emerald-600',
    trend: 'down',
  },
};

export const CLINICAL_DISCLAIMER_TEXT = 
  'Research Prototype: Model-generated analysis based on available retinal images. Not clinically validated. All outputs require licensed medical review.';
