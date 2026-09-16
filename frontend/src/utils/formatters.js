import { DR_SEVERITY, TRAJECTORY_STATUS } from './constants';

/**
 * Formats an ISO date string or Date object into human-readable clinical visit format.
 * e.g., "14 Jan 2026"
 */
export function formatDate(dateString) {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}

/**
 * Formats confidence score (0.00 - 1.00) as a clean percentage string.
 * e.g., "89%"
 */
export function formatConfidence(confidence) {
  if (confidence === null || confidence === undefined) return '—';
  const val = typeof confidence === 'number' ? confidence : parseFloat(confidence);
  if (isNaN(val)) return '—';
  const pct = val <= 1.0 ? val * 100 : val;
  return `${Math.round(pct)}%`;
}

/**
 * Returns severity object by index or name
 */
export function getSeverityInfo(indexOrName) {
  if (indexOrName !== undefined && indexOrName !== null && DR_SEVERITY[indexOrName] !== undefined) {
    return DR_SEVERITY[indexOrName];
  }
  // Try matching by label
  const found = Object.values(DR_SEVERITY).find(
    (s) => s.label.toLowerCase() === String(indexOrName).toLowerCase() ||
           s.shortLabel.toLowerCase() === String(indexOrName).toLowerCase()
  );
  return found || DR_SEVERITY[0];
}

/**
 * Computes trajectory status between two severity indices
 */
export function computeTrajectory(previousIndex, currentIndex) {
  if (previousIndex === null || previousIndex === undefined) {
    return TRAJECTORY_STATUS.STABLE;
  }
  const prev = Number(previousIndex);
  const curr = Number(currentIndex);
  if (curr > prev) {
    return TRAJECTORY_STATUS.INCREASED;
  }
  if (curr < prev) {
    return TRAJECTORY_STATUS.DECREASED;
  }
  return TRAJECTORY_STATUS.STABLE;
}

/**
 * File size formatter
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
