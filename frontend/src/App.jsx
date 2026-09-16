import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { PatientList } from './pages/PatientList';
import { PatientProfile } from './pages/PatientProfile';
import { ScanUpload } from './pages/ScanUpload';
import { DiagnosticResults } from './pages/DiagnosticResults';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/patients" element={<PatientList />} />
          <Route path="/patients/:id" element={<PatientProfile />} />
          <Route path="/upload" element={<ScanUpload />} />
          <Route path="/results/:scanId" element={<DiagnosticResults />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}
