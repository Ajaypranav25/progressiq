import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  ArrowRight,
  Filter,
  Calendar,
  Layers,
  AlertCircle,
} from 'lucide-react';
import { getPatients, createPatient } from '../api/patientsApi';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { TrajectoryBadge } from '../components/common/TrajectoryBadge';
import { Modal } from '../components/common/Modal';
import { Toast } from '../components/common/Toast';
import { formatDate } from '../utils/formatters';

export function PatientList() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // New patient form state
  const [formData, setFormData] = useState({
    name: '',
    age: '55',
    gender: 'Female',
    diabetesType: 'Type 2 Diabetes (6 yrs)',
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
      setFormData({ name: '', age: '55', gender: 'Female', diabetesType: 'Type 2 Diabetes (6 yrs)' });
      setToastMessage({ message: `Registered patient ${data.patientIdentifier}`, type: 'success' });
      await loadPatients();
      // Optionally navigate directly to their new profile
      navigate(`/patients/${data.id}`);
    } catch (err) {
      console.error(err);
      setToastMessage({ message: 'Failed to create patient', type: 'warning' });
    }
  }

  // Filter logic
  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.patientIdentifier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.name.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (severityFilter !== 'ALL') {
      if (severityFilter === 'REVIEW') {
        return patient.requiresReview;
      }
      return patient.latestSeverityIndex === Number(severityFilter);
    }

    return true;
  });

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Patient Directory
            </h1>
            <span className="text-xs bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded border border-slate-200 font-medium">
              {patients.length} Monitored
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Clinical longitudinal cohort under diabetic retinopathy photographic surveillance.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-md text-xs font-semibold transition-colors shadow-xs self-start sm:self-auto"
        >
          <Plus size={15} />
          <span>Add Demo Patient</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 border border-slate-200 rounded-lg shadow-2xs">
        {/* Search input */}
        <div className="relative flex-1 w-full">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Patient ID (e.g. PIQ-8401) or Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50/50 border border-slate-200 rounded-md focus:outline-none focus:border-slate-400 focus:bg-white transition-colors"
          />
        </div>

        {/* Severity filter pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 text-xs">
          <span className="text-[11px] text-slate-400 font-medium px-1 flex items-center gap-1">
            <Filter size={11} /> Filter:
          </span>
          {[
            { key: 'ALL', label: 'All' },
            { key: 'REVIEW', label: 'Needs Review' },
            { key: '3', label: 'Severe' },
            { key: '2', label: 'Moderate' },
            { key: '1', label: 'Mild' },
            { key: '0', label: 'No DR' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setSeverityFilter(f.key)}
              className={`px-2.5 py-1 rounded text-xs whitespace-nowrap transition-colors font-medium border ${
                severityFilter === f.key
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Patient Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Patient ID</th>
                <th className="px-4 py-3">Name / Demographics</th>
                <th className="px-4 py-3 text-center">Scan Count</th>
                <th className="px-4 py-3">Latest Predicted Severity</th>
                <th className="px-4 py-3">Longitudinal Status</th>
                <th className="px-4 py-3">Last Evaluated</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500">
                    No patients match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => (
                  <tr
                    key={patient.id}
                    onClick={() => navigate(`/patients/${patient.id}`)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                  >
                    {/* Patient ID */}
                    <td className="px-4 py-3 whitespace-nowrap font-mono font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <span>{patient.patientIdentifier}</span>
                        {patient.requiresReview && (
                          <span
                            className="w-2 h-2 rounded-full bg-rose-500 shrink-0"
                            title="Progression flagged - Clinical Review Required"
                          />
                        )}
                      </div>
                    </td>

                    {/* Name & Demographics */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 group-hover:text-teal-700 transition-colors">
                        {patient.name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {patient.age} yrs • {patient.gender} • {patient.diabetesType}
                      </div>
                    </td>

                    {/* Scan Count */}
                    <td className="px-4 py-3 whitespace-nowrap text-center font-mono">
                      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                        <Layers size={11} className="text-slate-400" />
                        <span>{patient.totalScans}</span>
                      </span>
                    </td>

                    {/* Latest Severity */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {patient.latestSeverityIndex !== null && patient.latestSeverityIndex !== undefined ? (
                        <SeverityBadge severity={patient.latestSeverityIndex} size="sm" showIndex />
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">No scans yet</span>
                      )}
                    </td>

                    {/* Longitudinal Trajectory */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {patient.totalScans > 1 ? (
                        <TrajectoryBadge status={patient.trajectoryStatus} size="sm" />
                      ) : (
                        <span className="text-slate-400 text-[11px]">Baseline observation</span>
                      )}
                    </td>

                    {/* Last Scan Date */}
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-mono">
                      {formatDate(patient.latestScanDate)}
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="inline-flex items-center gap-1 text-slate-500 group-hover:text-teal-700 text-xs font-medium">
                        <span>Open Profile</span>
                        <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Demo Patient Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register Demo Patient Record"
        subtitle="Adds a synthetic patient to the local cohort for testing longitudinal workflows."
      >
        <form onSubmit={handleCreatePatient} className="flex flex-col gap-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Patient Full Name (or Demo Identifier)
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Clara Oswald"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-slate-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Age</label>
              <input
                type="number"
                min="18"
                max="100"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-slate-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-slate-500 bg-white"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Diabetes Classification &amp; Duration
            </label>
            <input
              type="text"
              value={formData.diabetesType}
              onChange={(e) => setFormData({ ...formData, diabetesType: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-slate-500"
            />
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded p-2.5 text-[11px] text-slate-500 flex items-start gap-2 mt-1">
            <AlertCircle size={13} className="text-teal-600 shrink-0 mt-0.5" />
            <span>
              Synthetic demo records are stored locally for testing fundus image upload and longitudinal analysis.
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-3 py-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors"
            >
              Register &amp; Open
            </button>
          </div>
        </form>
      </Modal>

      {/* Toast Notification */}
      {toastMessage && (
        <Toast
          message={toastMessage.message}
          type={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
}
