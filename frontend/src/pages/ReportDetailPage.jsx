import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import reportService from '../services/reportService';
import { useAuth } from '../context/AuthContext';
import VerificationDossier from '../components/investigation/VerificationDossier';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

export default function ReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, openAuthModal } = useAuth();
  const [report, setReport] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const fetchReport = async () => {
      try {
        setLoading(true);
        const data = await reportService.getReportById(id);
        setReport(data.report);
        setIsSaved(data.isSaved);
      } catch (err) {
        setError(err.message || 'Failed to locate verification report.');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-canvas py-16 px-4">
        <div className="max-w-md mx-auto bg-surface rounded-2xl border border-slate-border p-8 text-center shadow-editorial space-y-4">
          <h2 className="font-heading font-extrabold text-2xl text-slate-main">
            Authentication Required
          </h2>
          <p className="text-xs text-slate-muted leading-relaxed">
            Please sign in to inspect this verification report dossier and its citations.
          </p>
          <button
            onClick={() => openAuthModal('login')}
            className="w-full py-2.5 px-4 bg-brand-blue hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            Sign In / Quick Demo
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-500 font-semibold">
          <Loader2 className="w-5 h-5 animate-spin text-brand-blue" />
          <span>Retrieving verification dossier #{id?.substring?.(0, 8)}...</span>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-canvas py-16 px-4">
        <div className="max-w-md mx-auto bg-surface rounded-2xl border border-slate-border p-8 text-center shadow-editorial space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="font-heading font-extrabold text-xl text-slate-main">
            Report Not Found
          </h2>
          <p className="text-xs text-slate-muted leading-relaxed">
            {error || 'The requested verification dossier could not be retrieved or you do not have permission to view it.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-brand-blue text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Verify
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand-blue transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Investigations</span>
          </button>
        </div>

        {/* Full Dossier View */}
        <VerificationDossier 
          report={report} 
          initialSaved={isSaved} 
          onSaveChange={(state) => setIsSaved(state)} 
        />
      </div>
    </div>
  );
}

