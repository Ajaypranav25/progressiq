/**
 * High-fidelity Demo Fundus Scans and Mock Clinical Database
 * Conforms strictly to the ProgressIQ Universal Project Context.
 */

// Helper to generate realistic retinal fundus SVG data URLs
function createFundusSvg(severityIndex, withHeatmap = false) {
  const bgColors = ['#9e3318', '#a83719', '#8a2c14', '#7d2410', '#691c0b'];
  const baseBg = bgColors[severityIndex] || '#9e3318';

  // Pathology markers based on severity
  let pathologyElements = '';
  if (severityIndex >= 1) {
    // Microaneurysms (tiny dark red dots)
    pathologyElements += `
      <circle cx="210" cy="180" r="3" fill="#420d04" opacity="0.9" />
      <circle cx="230" cy="195" r="2.5" fill="#420d04" opacity="0.9" />
      <circle cx="170" cy="220" r="3.5" fill="#420d04" opacity="0.85" />
    `;
  }
  if (severityIndex >= 2) {
    // Blot hemorrhages & hard exudates (yellowish deposits)
    pathologyElements += `
      <circle cx="160" cy="165" r="5" fill="#4a0f05" opacity="0.9" />
      <ellipse cx="240" cy="160" rx="6" ry="4" fill="#fae07a" opacity="0.8" />
      <circle cx="250" cy="170" r="3" fill="#fae07a" opacity="0.85" />
      <ellipse cx="145" cy="240" rx="7" ry="5" fill="#521006" opacity="0.85" />
    `;
  }
  if (severityIndex >= 3) {
    // Severe hemorrhages, cotton wool spots
    pathologyElements += `
      <circle cx="130" cy="140" r="9" fill="#3d0a02" opacity="0.9" />
      <ellipse cx="270" cy="230" rx="12" ry="7" fill="#fdf0be" opacity="0.75" />
      <circle cx="190" cy="260" r="8" fill="#4a0f05" opacity="0.95" />
      <path d="M 170 190 Q 185 175 200 190" stroke="#fef08a" stroke-width="4" fill="none" opacity="0.8" />
    `;
  }
  if (severityIndex >= 4) {
    // Neovascularization fronds
    pathologyElements += `
      <path d="M 280 170 Q 295 150 310 160 Q 320 180 300 190" stroke="#dc2626" stroke-width="2.5" fill="none" opacity="0.9" />
      <path d="M 285 165 Q 295 160 305 175" stroke="#ef4444" stroke-width="2" fill="none" opacity="0.9" />
      <circle cx="290" cy="210" r="14" fill="#380601" opacity="0.9" />
    `;
  }

  // Grad-CAM heatmap overlay (transparent radial gradient heatmap)
  let heatmapOverlay = '';
  if (withHeatmap) {
    heatmapOverlay = `
      <defs>
        <radialGradient id="gradcam1" cx="45%" cy="48%" r="40%">
          <stop offset="0%" stop-color="#ef4444" stop-opacity="0.85" />
          <stop offset="30%" stop-color="#f59e0b" stop-opacity="0.75" />
          <stop offset="65%" stop-color="#10b981" stop-opacity="0.4" />
          <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.0" />
        </radialGradient>
        <radialGradient id="gradcam2" cx="62%" cy="42%" r="28%">
          <stop offset="0%" stop-color="#dc2626" stop-opacity="0.9" />
          <stop offset="45%" stop-color="#f97316" stop-opacity="0.7" />
          <stop offset="100%" stop-color="#06b6d4" stop-opacity="0.0" />
        </radialGradient>
      </defs>
      <circle cx="200" cy="200" r="180" fill="url(#gradcam1)" mix-blend-mode="screen" />
      <circle cx="240" cy="170" r="110" fill="url(#gradcam2)" mix-blend-mode="screen" />
      <!-- Legend watermark -->
      <rect x="20" y="350" width="160" height="30" rx="4" fill="#0f172a" fill-opacity="0.8" />
      <text x="30" y="370" fill="#f8fafc" font-size="11" font-family="monospace" font-weight="600">EVIDENCE: Grad-CAM</text>
    `;
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
      <rect width="400" height="400" fill="#090d16" />
      <!-- Fundus aperture circle -->
      <circle cx="200" cy="200" r="185" fill="${baseBg}" stroke="#1e293b" stroke-width="4" />
      
      <!-- Vignette and background gradient -->
      <radialGradient id="retinaVignette" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#ffedd5" stop-opacity="0.08" />
        <stop offset="70%" stop-color="#000000" stop-opacity="0.25" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0.85" />
      </radialGradient>
      <circle cx="200" cy="200" r="185" fill="url(#retinaVignette)" />

      <!-- Optic Disc (pale yellowish oval on nasal side) -->
      <ellipse cx="295" cy="195" rx="26" ry="32" fill="#fed7aa" opacity="0.92" />
      <ellipse cx="293" cy="195" rx="16" ry="20" fill="#fff7ed" opacity="0.85" />

      <!-- Macula / Fovea (darker avascular zone) -->
      <ellipse cx="170" cy="205" rx="34" ry="30" fill="#431407" opacity="0.45" />
      <circle cx="170" cy="205" r="7" fill="#290b04" opacity="0.6" />

      <!-- Major Retinal Vessels (Arterioles and Venules) -->
      <g stroke-linecap="round" fill="none">
        <!-- Superior arcade -->
        <path d="M 290 180 Q 260 110 180 95 Q 120 85 70 120" stroke="#7f1d1d" stroke-width="5.5" opacity="0.85" />
        <path d="M 292 182 Q 265 115 190 102 Q 130 92 80 125" stroke="#b91c1c" stroke-width="3" opacity="0.9" />
        
        <!-- Inferior arcade -->
        <path d="M 290 210 Q 255 285 185 305 Q 115 315 65 270" stroke="#7f1d1d" stroke-width="5.5" opacity="0.85" />
        <path d="M 292 208 Q 260 280 190 298 Q 125 305 75 265" stroke="#b91c1c" stroke-width="3" opacity="0.9" />

        <!-- Nasal vessels -->
        <path d="M 315 190 Q 350 170 380 160" stroke="#991b1b" stroke-width="3" opacity="0.85" />
        <path d="M 315 205 Q 355 220 380 235" stroke="#7f1d1d" stroke-width="3.5" opacity="0.85" />

        <!-- Small vessel branches -->
        <path d="M 230 105 Q 210 140 185 160" stroke="#b91c1c" stroke-width="1.8" opacity="0.75" />
        <path d="M 220 295 Q 200 260 185 240" stroke="#b91c1c" stroke-width="1.8" opacity="0.75" />
      </g>

      <!-- Pathology layers -->
      ${pathologyElements}

      <!-- Heatmap if enabled -->
      ${heatmapOverlay}
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}

export const SAMPLE_FUNDUS_SCANS = [
  {
    id: 'sample-mild',
    label: 'Sample Scan A: Mild DR',
    description: 'Early-stage microaneurysms, good image clarity (OD)',
    severity: 'Mild DR',
    severityIndex: 1,
    confidence: 0.91,
    quality: 'good',
    eye: 'OD (Right Eye)',
    imageUrl: createFundusSvg(1, false),
    evidenceUrl: createFundusSvg(1, true),
  },
  {
    id: 'sample-moderate',
    label: 'Sample Scan B: Moderate DR',
    description: 'Blot hemorrhages & microaneurysms, acceptable quality (OS)',
    severity: 'Moderate DR',
    severityIndex: 2,
    confidence: 0.86,
    quality: 'acceptable',
    eye: 'OS (Left Eye)',
    imageUrl: createFundusSvg(2, false),
    evidenceUrl: createFundusSvg(2, true),
  },
  {
    id: 'sample-severe',
    label: 'Sample Scan C: Severe DR (Progression)',
    description: 'Extensive intraretinal hemorrhages and cotton wool patches (OD)',
    severity: 'Severe DR',
    severityIndex: 3,
    confidence: 0.89,
    quality: 'good',
    eye: 'OD (Right Eye)',
    imageUrl: createFundusSvg(3, false),
    evidenceUrl: createFundusSvg(3, true),
  },
  {
    id: 'sample-proliferative',
    label: 'Sample Scan D: Proliferative DR',
    description: 'Neovascularization fronds present, urgent review required (OD)',
    severity: 'Proliferative DR',
    severityIndex: 4,
    confidence: 0.94,
    quality: 'good',
    eye: 'OD (Right Eye)',
    imageUrl: createFundusSvg(4, false),
    evidenceUrl: createFundusSvg(4, true),
  },
  {
    id: 'sample-nodr',
    label: 'Sample Scan E: Baseline (No DR)',
    description: 'Clear fundus without diabetic retinopathy lesions (OD)',
    severity: 'No DR',
    severityIndex: 0,
    confidence: 0.97,
    quality: 'good',
    eye: 'OD (Right Eye)',
    imageUrl: createFundusSvg(0, false),
    evidenceUrl: createFundusSvg(0, true),
  },
];

export const INITIAL_PATIENTS = [
  {
    id: 'p-001',
    patientIdentifier: 'PIQ-8401',
    name: 'Eleanor Vance',
    isDemo: true,
    age: 61,
    gender: 'Female',
    diabetesType: 'Type 2 Diabetes (9 yrs)',
    createdAt: '2025-10-10T08:00:00Z',
    latestSeverity: 'Severe DR',
    latestSeverityIndex: 3,
    latestConfidence: 0.89,
    latestScanDate: '2026-09-10',
    totalScans: 3,
    trajectoryStatus: 'increased_severity',
    trajectoryMessage: 'Increased severity detected between available scans (Moderate → Severe).',
    requiresReview: true,
    scans: [
      {
        id: 'scan-101',
        patientId: 'p-001',
        visitDate: '2026-01-12',
        severity: 'Moderate DR',
        severityIndex: 2,
        confidence: 0.84,
        quality: 'good',
        eye: 'OD (Right Eye)',
        imageUrl: createFundusSvg(2, false),
        evidenceUrl: createFundusSvg(2, true),
        modelVersion: 'ResNet50-DR-v2.1',
        notes: 'Baseline longitudinal scan. Isolated blot hemorrhages and hard exudates.',
      },
      {
        id: 'scan-102',
        patientId: 'p-001',
        visitDate: '2026-05-18',
        severity: 'Moderate DR',
        severityIndex: 2,
        confidence: 0.86,
        quality: 'acceptable',
        eye: 'OD (Right Eye)',
        imageUrl: createFundusSvg(2, false),
        evidenceUrl: createFundusSvg(2, true),
        modelVersion: 'ResNet50-DR-v2.1',
        notes: 'Follow-up visit. Stable severity compared with Jan 2026 visit.',
      },
      {
        id: 'scan-103',
        patientId: 'p-001',
        visitDate: '2026-09-10',
        severity: 'Severe DR',
        severityIndex: 3,
        confidence: 0.89,
        quality: 'good',
        eye: 'OD (Right Eye)',
        imageUrl: createFundusSvg(3, false),
        evidenceUrl: createFundusSvg(3, true),
        modelVersion: 'ResNet50-DR-v2.1',
        notes: 'Model-indicated progression. Widespread intraretinal microvascular abnormalities and increased hemorrhages.',
      },
    ],
  },
  {
    id: 'p-002',
    patientIdentifier: 'PIQ-8402',
    name: 'Arthur Pendelton',
    isDemo: true,
    age: 54,
    gender: 'Male',
    diabetesType: 'Type 2 Diabetes (4 yrs)',
    createdAt: '2025-11-15T09:30:00Z',
    latestSeverity: 'Mild DR',
    latestSeverityIndex: 1,
    latestConfidence: 0.93,
    latestScanDate: '2026-09-02',
    totalScans: 2,
    trajectoryStatus: 'stable',
    trajectoryMessage: 'Stable diagnostic profile observed across visits (Mild → Mild).',
    requiresReview: false,
    scans: [
      {
        id: 'scan-201',
        patientId: 'p-002',
        visitDate: '2026-01-05',
        severity: 'Mild DR',
        severityIndex: 1,
        confidence: 0.91,
        quality: 'good',
        eye: 'OS (Left Eye)',
        imageUrl: createFundusSvg(1, false),
        evidenceUrl: createFundusSvg(1, true),
        modelVersion: 'ResNet50-DR-v2.1',
        notes: 'Few microaneurysms detected in macula periphery.',
      },
      {
        id: 'scan-202',
        patientId: 'p-002',
        visitDate: '2026-09-02',
        severity: 'Mild DR',
        severityIndex: 1,
        confidence: 0.93,
        quality: 'good',
        eye: 'OS (Left Eye)',
        imageUrl: createFundusSvg(1, false),
        evidenceUrl: createFundusSvg(1, true),
        modelVersion: 'ResNet50-DR-v2.1',
        notes: 'Repeat 8-month scan confirms stable mild non-proliferative changes.',
      },
    ],
  },
  {
    id: 'p-003',
    patientIdentifier: 'PIQ-8403',
    name: 'Sofia Rodriguez',
    isDemo: true,
    age: 68,
    gender: 'Female',
    diabetesType: 'Type 1 Diabetes (22 yrs)',
    createdAt: '2025-09-01T11:00:00Z',
    latestSeverity: 'Moderate DR',
    latestSeverityIndex: 2,
    latestConfidence: 0.85,
    latestScanDate: '2026-09-14',
    totalScans: 2,
    trajectoryStatus: 'decreased_severity',
    trajectoryMessage: 'Decreased severity detected between available visits (Severe → Moderate).',
    requiresReview: false,
    scans: [
      {
        id: 'scan-301',
        patientId: 'p-003',
        visitDate: '2026-01-20',
        severity: 'Severe DR',
        severityIndex: 3,
        confidence: 0.88,
        quality: 'acceptable',
        eye: 'OD (Right Eye)',
        imageUrl: createFundusSvg(3, false),
        evidenceUrl: createFundusSvg(3, true),
        modelVersion: 'ResNet50-DR-v2.1',
        notes: 'Pre-intervention scan showing high hemorrhagic burden.',
      },
      {
        id: 'scan-302',
        patientId: 'p-003',
        visitDate: '2026-09-14',
        severity: 'Moderate DR',
        severityIndex: 2,
        confidence: 0.85,
        quality: 'good',
        eye: 'OD (Right Eye)',
        imageUrl: createFundusSvg(2, false),
        evidenceUrl: createFundusSvg(2, true),
        modelVersion: 'ResNet50-DR-v2.1',
        notes: 'Follow-up assessment indicating noticeable lesion resorption.',
      },
    ],
  },
  {
    id: 'p-004',
    patientIdentifier: 'PIQ-8404',
    name: 'Marcus Chen',
    isDemo: true,
    age: 47,
    gender: 'Male',
    diabetesType: 'Type 2 Diabetes (1 yr)',
    createdAt: '2026-07-10T14:20:00Z',
    latestSeverity: 'No DR',
    latestSeverityIndex: 0,
    latestConfidence: 0.97,
    latestScanDate: '2026-08-15',
    totalScans: 1,
    trajectoryStatus: 'stable',
    trajectoryMessage: 'Initial baseline scan. No diabetic retinopathy features detected.',
    requiresReview: false,
    scans: [
      {
        id: 'scan-401',
        patientId: 'p-004',
        visitDate: '2026-08-15',
        severity: 'No DR',
        severityIndex: 0,
        confidence: 0.97,
        quality: 'good',
        eye: 'OD (Right Eye)',
        imageUrl: createFundusSvg(0, false),
        evidenceUrl: createFundusSvg(0, true),
        modelVersion: 'ResNet50-DR-v2.1',
        notes: 'Routine diabetic eye screening baseline. Healthy retina.',
      },
    ],
  },
];
