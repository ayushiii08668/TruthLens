import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import investigationService from '../services/investigationService';
import { useAuth } from '../context/AuthContext';
import { 
  History, 
  Trash2, 
  ExternalLink, 
  Search, 
  Filter, 
  Calendar,
  AlertCircle,
  Loader2
} from 'lucide-react';

export default function HistoryPage() {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [investigations, setInvestigations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteId, setDeleteId] = useState(null);

  const fetchInvestigations = async () => {
    try {
      setLoading(true);
      const res = await investigationService.getInvestigations({
        page,
        limit: 10,
        status: statusFilter || undefined
      });
      setInvestigations(res.data?.investigations || []);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Failed to load investigations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchInvestigations();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, page, statusFilter]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this investigation and its associated dossiers?')) {
      return;
    }
    try {
      await investigationService.deleteInvestigation(id);
      setInvestigations(investigations.filter(inv => inv._id !== id));
    } catch (err) {
      alert('Failed to delete investigation: ' + err.message);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-canvas py-16 px-4">
        <div className="max-w-md mx-auto bg-surface rounded-2xl border border-slate-border p-8 text-center shadow-editorial space-y-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center mx-auto">
            <History className="w-6 h-6" />
          </div>
          <h2 className="font-heading font-extrabold text-2xl text-slate-main">
            Investigation Archive
          </h2>
          <p className="text-xs text-slate-muted leading-relaxed">
            Sign in to access your audit trail of past claim verifications, evidence logs, and reports.
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
              Audit Archives
            </span>
            <h1 className="font-heading font-extrabold text-3xl text-slate-main mt-1">
              Investigation History
            </h1>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs font-semibold bg-surface border border-slate-border rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-blue"
            >
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        {/* Table / List */}
        <div className="bg-surface rounded-2xl border border-slate-border shadow-subtle overflow-hidden">
          {loading ? (
            <div className="py-16 flex items-center justify-center text-xs text-slate-500 font-semibold gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-brand-blue" />
              <span>Loading audit logs...</span>
            </div>
          ) : investigations.length > 0 ? (
            <div className="divide-y divide-slate-border">
              {investigations.map((inv) => (
                <div
                  key={inv._id}
                  className="p-5 sm:p-6 hover:bg-slate-50/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-mono text-slate-400">
                        #{inv._id.substring(0, 8)}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                        {inv.inputType}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          inv.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : inv.status === 'failed'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-blue-50 text-brand-blue border border-blue-200'
                        }`}
                      >
                        {inv.status}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(inv.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <h3 className="font-heading font-bold text-sm sm:text-base text-slate-main line-clamp-2">
                      {inv.originalInput}
                    </h3>

                    {inv.extractedClaims && inv.extractedClaims.length > 0 && (
                      <p className="text-xs text-slate-muted line-clamp-1">
                        <span className="font-semibold text-slate-600">Extracted Assertion:</span> {inv.extractedClaims[0]}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleDelete(inv._id)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Delete investigation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center text-xs text-slate-400 space-y-2">
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-1" />
              <p className="font-semibold text-slate-600">No investigations found.</p>
              <p>Run a verification to populate your audit log.</p>
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

