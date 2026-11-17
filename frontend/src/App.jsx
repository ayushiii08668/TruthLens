import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import AuthModal from './components/common/AuthModal';

import VerifyPage from './pages/VerifyPage';
import DashboardPage from './pages/DashboardPage';
import HistoryPage from './pages/HistoryPage';
import SavedReportsPage from './pages/SavedReportsPage';
import ReportDetailPage from './pages/ReportDetailPage';
import PublicReportPage from './pages/PublicReportPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-canvas text-slate-main flex flex-col font-sans selection:bg-blue-100 selection:text-brand-blue">
          {/* Global Light-Theme Editorial Header */}
          <Navbar />

          {/* Core Route Viewports */}
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<VerifyPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/saved" element={<SavedReportsPage />} />
              <Route path="/report/:id" element={<ReportDetailPage />} />
              <Route path="/shared/:shareId" element={<PublicReportPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Global Editorial Footer */}
          <Footer />

          {/* Global Light-Theme Auth Modal */}
          <AuthModal />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
