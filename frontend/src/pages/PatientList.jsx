import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPatients, createPatient } from '../api/patientsApi';


export function PatientList() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '58',
    gender: 'Female',
    diabetesType: 'Type 2 Diabetes (11 yrs)',
  });

  async function loadPatients() {
    try {
      const { data } = await getPatients();
      setPatients(data || []);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadPatients();
  }, []);

  async function handleCreatePatient(e) {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      const { data } = await createPatient(formData);
      setIsAddModalOpen(false);
      setFormData({ name: '', age: '58', gender: 'Female', diabetesType: 'Type 2 Diabetes (11 yrs)' });
      await loadPatients();
      navigate(`/patients/${data.id}`);
    } catch (err) {
      console.error(err);
    }
  }

  const filteredPatients = patients.filter((p) => {
    const matchesQuery =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.patientIdentifier.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesQuery) return false;

    if (filterMode === 'URGENT') return p.requiresReview || p.latestSeverityIndex >= 3;
    if (filterMode === 'STABLE') return p.trajectoryStatus === 'stable';
    return true;
  });

  return (
    <div className="py-2 md:py-6 space-y-6">
      {/* COHORT SUMMARY STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-station p-5 rounded-xl border border-surface-variant/40 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 aura-backdrop opacity-30 pointer-events-none" />
          <div className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Active Diabetic Surveillance
          </div>
          <div className="text-2xl font-bold text-on-surface mt-1">
            2,410 <span className="text-xs font-normal text-on-surface-variant">Patients</span>
          </div>
          <div className="text-[11px] text-emerald-400 mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">trending_up</span>
            <span>+52 new annual fundus exams this week</span>
          </div>
        </div>

        <div className="glass-station p-5 rounded-xl border border-surface-variant/40 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 aura-backdrop opacity-30 pointer-events-none" />
          <div className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Center-Involved DME Flagged
          </div>
          <div className="text-2xl font-bold text-error mt-1">
            14.6% <span className="text-xs font-normal text-on-surface-variant">Cohort</span>
          </div>
          <div className="text-[11px] text-error mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">warning</span>
            <span>CST &gt; 320 µm requiring anti-VEGF consult</span>
          </div>
        </div>

        <div className="glass-station p-5 rounded-xl border border-surface-variant/40 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 aura-backdrop opacity-30 pointer-events-none" />
          <div className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Mean Surveillance Interval
          </div>
          <div className="text-2xl font-bold text-primary mt-1">
            11.4 <span className="text-xs font-normal text-on-surface-variant">Months</span>
          </div>
          <div className="text-[11px] text-on-surface-variant mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">check</span>
            <span>Automated recall adherence: 94.1%</span>
          </div>
        </div>

        <div className="glass-station p-5 rounded-xl border border-surface-variant/40 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 aura-backdrop opacity-30 pointer-events-none" />
          <div className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            AI Concordance Rate (ETDRS)
          </div>
          <div className="text-2xl font-bold text-secondary mt-1">
            97.4% <span className="text-xs font-normal text-on-surface-variant">Concordant</span>
          </div>
          <div className="text-[11px] text-secondary mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">verified</span>
            <span>Zero missed neovascularizations (PDR)</span>
          </div>
        </div>
      </div>

      {/* PATIENT DIRECTORY TABLE */}
      <div className="glass-station rounded-2xl border border-surface-variant/40 overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-surface-variant/40 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">
              Priority Vitreoretinal Triage Queue
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded bg-error-container/40 text-error font-medium">
              6 Urgent Interventions Needed
            </span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="text"
              placeholder="Search by MRN, Name, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3.5 py-1.5 rounded-lg bg-surface-container-lowest border border-surface-variant/60 text-xs text-on-surface focus:outline-none focus:border-primary w-56 md:w-64 placeholder:text-on-surface-variant/60 font-mono"
            />

            <div className="flex items-center gap-1 bg-surface-container-lowest p-1 rounded-lg border border-surface-variant/40 text-xs">
              <button
                onClick={() => setFilterMode('ALL')}
                className={`px-2.5 py-1 rounded text-xs transition cursor-pointer ${
                  filterMode === 'ALL'
                    ? 'bg-primary/20 text-primary font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                All ({patients.length})
              </button>
              <button
                onClick={() => setFilterMode('URGENT')}
                className={`px-2.5 py-1 rounded text-xs transition cursor-pointer ${
                  filterMode === 'URGENT'
                    ? 'bg-error-container/50 text-error font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Urgent / Severe
              </button>
              <button
                onClick={() => setFilterMode('STABLE')}
                className={`px-2.5 py-1 rounded text-xs transition cursor-pointer ${
                  filterMode === 'STABLE'
                    ? 'bg-secondary-container/50 text-secondary font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Stable
              </button>
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-primary-container text-on-primary font-bold text-xs hover:bg-primary transition shadow-[0_0_12px_rgba(56,189,248,0.25)] flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">person_add</span>
              <span>+ Add Patient</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container-lowest/80 text-on-surface-variant uppercase tracking-wider font-semibold border-b border-surface-variant/40">
              <tr>
                <th className="p-4">Patient / Demographics</th>
                <th className="p-4">MRN</th>
                <th className="p-4">Imaging Modality</th>
                <th className="p-4">Follow-up Interval</th>
                <th className="p-4">Central Subfield Thickness (CST)</th>
                <th className="p-4">ETDRS Severity &amp; DME Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant/30 text-on-surface-variant">
              {filteredPatients.map((patient) => {
                const isUrgent = patient.requiresReview || patient.latestSeverityIndex >= 3;
                const cstValue = patient.latestSeverityIndex === 3 ? 412 : patient.latestSeverityIndex === 2 ? 335 : 248;
                const cstPercent = Math.min(100, Math.round((cstValue / 480) * 100));

                return (
                  <tr
                    key={patient.id}
                    onClick={() => navigate(`/patients/${patient.id}`)}
                    className={`${
                      isUrgent ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-surface-container/40'
                    } transition cursor-pointer`}
                  >
                    <td className="p-4 font-semibold text-on-surface flex items-center gap-3">
                      {isUrgent && <span className="w-2 h-2 rounded-full bg-error animate-ping shrink-0" />}
                      <div>
                        <div className="text-sm font-bold text-primary">{patient.name}</div>
                        <div className="text-[11px] text-on-surface-variant font-normal">
                          {patient.age}y {patient.gender} • ID: {patient.patientIdentifier} • {patient.diabetesType}
                        </div>
                      </div>
                    </td>

                    <td className="p-4 font-mono text-on-surface">
                      {patient.patientIdentifier.replace('PIQ-', '9042-')}-RETINA
                    </td>

                    <td className="p-4">
                      {patient.latestSeverityIndex >= 3
                        ? 'Optos UWF 200° + Zeiss Cirrus HD-OCT'
                        : 'Topcon DRI OCT Triton + 50° Fundus'}
                    </td>

                    <td className="p-4">
                      {patient.totalScans} Scans ({(patient.totalScans - 1) * 12 || 12} Mo Delta)
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${isUrgent ? 'text-error' : 'text-secondary'}`}>
                          {cstValue} µm {isUrgent ? '(+94 µm YoY)' : '(Stable)'}
                        </span>
                        <span className="text-[10px] text-on-surface-variant">(Norm: &lt;260 µm)</span>
                      </div>
                      <div className="w-28 h-1.5 bg-surface-container rounded-full overflow-hidden mt-1">
                        <div
                          className={`h-full ${isUrgent ? 'bg-error' : 'bg-secondary'}`}
                          style={{ width: `${cstPercent}%` }}
                        />
                      </div>
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded font-bold text-[11px] ${
                          isUrgent
                            ? 'bg-error-container/40 text-error'
                            : patient.latestSeverityIndex === 2
                            ? 'bg-surface-container-high text-primary'
                            : 'bg-surface-container-high text-secondary'
                        }`}
                      >
                        {patient.latestSeverity} • {isUrgent ? 'Center-Involved DME (OD)' : 'No Edema'}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/patients/${patient.id}`);
                        }}
                        className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                          isUrgent
                            ? 'bg-primary-container text-on-primary hover:bg-primary shadow-[0_0_12px_rgba(56,189,248,0.2)]'
                            : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                        }`}
                      >
                        {isUrgent ? 'Inspect Timeline →' : 'Review'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD DEMO PATIENT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="max-w-md w-full glass-station rounded-2xl p-6 border border-surface-variant/50 shadow-2xl relative">
            <div className="flex justify-between items-center pb-3 border-b border-surface-variant/40">
              <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">
                Enroll New Surveillance Patient
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePatient} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block text-on-surface-variant font-semibold mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Jonathan Mercer"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-surface-variant text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-on-surface-variant font-semibold mb-1">Age</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-surface-variant text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-on-surface-variant font-semibold mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-surface-variant text-on-surface focus:outline-none focus:border-primary"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-on-surface-variant font-semibold mb-1">
                  Diabetes Classification
                </label>
                <input
                  type="text"
                  value={formData.diabetesType}
                  onChange={(e) => setFormData({ ...formData, diabetesType: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-surface-variant text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-semibold shadow-[0_0_12px_rgba(56,189,248,0.25)]"
                >
                  Enroll Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
