import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import reportService from '../services/reportService';
import { useAuth } from '../context/AuthContext';
import VerdictBadge from '../components/common/VerdictBadge';
import { 
  Bookmark, 
  BookmarkCheck, 
  Trash2, 
  ExternalLink, 
  Search, 
  ShieldCheck,
  Calendar,
  Loader2
} from 'lucide-react';

export default function SavedReportsPage() {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [savedReports, setSavedReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchSavedReports = async () => {
    try {
      setLoading(true);
      const res = await reportService.getSavedReports({ page, limit: 10 });
      setSavedReports(res.data?.reports || []);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Failed to load saved reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchSavedReports();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, page]);

  const handleUnsave = async (reportId) => {
    try {
      await reportService.unsaveReport(reportId);
      setSavedReports(savedReports.filter(r => r._id !== reportId));
    } catch (err) {
      alert('Failed to remove bookmark: ' + err.message);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-canvas py-16 px-4">
        <div className="max-w-md mx-auto bg-surface rounded-2xl border border-slate-border p-8 text-center shadow-editorial space-y-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center mx-auto">
            <Bookmark className="w-6 h-6" />
          </div>
          <h2 className="font-heading font-extrabold text-2xl text-slate-main">
            Saved Intelligence Dossiers
          </h2>
          <p className="text-xs text-slate-muted leading-relaxed">
            Sign in to access your curated bookmarked verification reports, reference citations, and evidentiary audits.
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

  return (
    <div className="min-h-screen bg-canvas py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-border">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-blue bg-blue-50 px-2.5 py-0.5 rounded border border-blue-100">
              Curated Library
            </span>
            <h1 className="font-heading font-extrabold text-3xl text-slate-main mt-1">
              Saved Verification Reports
            </h1>
          </div>

          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2 bg-brand-blue hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
          >
            <Search className="w-4 h-4" />
            <span>Verify New Claim</span>
          </Link>
        </div>

        {/* List of Saved Reports */}
        <div className="bg-surface rounded-2xl border border-slate-border shadow-subtle overflow-hidden">
          {loading ? (
            <div className="py-16 flex items-center justify-center text-xs text-slate-500 font-semibold gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-brand-blue" />
              <span>Loading saved dossiers...</span>
            </div>
          ) : savedReports.length > 0 ? (
            <div className="divide-y divide-slate-border">
              {savedReports.map((report) => (
                <div
                  key={report._id}
                  className="p-5 sm:p-6 hover:bg-slate-50/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <VerdictBadge verdict={report.verdict} size="sm" />
                      <span className="text-xs text-slate-500 font-medium">
                        Confidence: <strong className="text-slate-800">{report.confidence}%</strong>
                      </span>
                      <span className="text-xs text-slate-400">
                        &bull; Sufficiency: {report.evidenceSufficiency}
                      </span>
                      {report.savedAt && (
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Saved {new Date(report.savedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    <Link
                      to={`/report/${report._id}`}
                      className="font-heading font-bold text-base sm:text-lg text-slate-main hover:text-brand-blue transition-colors line-clamp-2"
                    >
                      {report.claim}
                    </Link>

                    {report.explanation && (
                      <p className="text-xs text-slate-muted line-clamp-2 leading-relaxed">
                        {report.explanation}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to={`/report/${report._id}`}
                      className="px-3 py-1.5 bg-surface border border-slate-border hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                    >
                      <span>Read Dossier</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>

                    <button
                      onClick={() => handleUnsave(report._id)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Remove from saved bookmarks"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center text-xs text-slate-400 space-y-3">
              <Bookmark className="w-8 h-8 text-slate-300 mx-auto mb-1" />
              <p className="font-semibold text-slate-600">No saved reports in your library.</p>
              <p className="max-w-xs mx-auto">
                When viewing an investigation dossier, click "Save Report" to bookmark it for future reference.
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-border flex items-center justify-between text-xs text-slate-600">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 border border-slate-border rounded-lg disabled:opacity-40 hover:bg-slate-50"
              >
                Previous
              </button>
              <span>Page {page} of {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 border border-slate-border rounded-lg disabled:opacity-40 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

