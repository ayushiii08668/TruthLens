import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import dashboardService from '../services/dashboardService';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/dashboard/StatCard';
import VerdictDistributionChart from '../components/dashboard/VerdictDistributionChart';
import VerdictBadge from '../components/common/VerdictBadge';
import { 
  BarChart3, 
  FileCheck, 
  ShieldCheck, 
  Search, 
  Clock, 
  ArrowRight,
  TrendingUp,
  Loader2,
  Bookmark,
  Filter,
  X,
  Calendar,
  Sparkles,
  Layers,
  Inbox,
  Scale
} from 'lucide-react';

export default function DashboardPage() {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [error, setError] = useState('');

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInputType, setSelectedInputType] = useState('');
  const [selectedVerdict, setSelectedVerdict] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [statsData, recentData] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getRecent()
        ]);
        setStats(statsData);
        setRecent(recentData);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard metrics.');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [isAuthenticated]);

  // Handle live search & filtering
  const handleApplyFilters = async (overrideParams = {}) => {
    if (!isAuthenticated) return;
    try {
      setFilterLoading(true);
      const params = {
        query: overrideParams.query !== undefined ? overrideParams.query : searchQuery,
        inputType: overrideParams.inputType !== undefined ? overrideParams.inputType : selectedInputType,
        verdict: overrideParams.verdict !== undefined ? overrideParams.verdict : selectedVerdict
      };
      
      // Remove empty strings
      Object.keys(params).forEach(k => {
        if (!params[k]) delete params[k];
      });

      const recentData = await dashboardService.getRecent(params);
      setRecent(recentData);
    } catch (err) {
      console.error('Failed to filter dashboard activity:', err);
    } finally {
      setFilterLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedInputType('');
    setSelectedVerdict('');
    handleApplyFilters({ query: '', inputType: '', verdict: '' });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-canvas py-16 px-4">
        <div className="max-w-md mx-auto bg-surface rounded-2xl border border-slate-border p-8 text-center shadow-editorial space-y-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center mx-auto">
            <BarChart3 className="w-6 h-6" />
          </div>
          <h2 className="font-heading font-extrabold text-2xl text-slate-main">
            Analyst Intelligence Dashboard
          </h2>
          <p className="text-xs text-slate-muted leading-relaxed">
            Please sign in to view aggregate metrics, verdict distributions, and investigation audit histories.
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
          <span>Loading intelligence metrics...</span>
        </div>
      </div>
    );
  }

  const hasActiveFilters = searchQuery || selectedInputType || selectedVerdict;
  const activityTimeline = recent?.activityTimeline || [];

  return (
    <div className="min-h-screen bg-canvas py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-blue bg-blue-50 px-2.5 py-0.5 rounded border border-blue-100 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Intelligence Operations</span>
              </span>
            </div>
            <h1 className="font-heading font-extrabold text-3xl text-slate-main">
              Verification Dashboard
            </h1>
            <p className="text-xs text-slate-muted mt-1">
              Real-time audit synthesis, verdict analytics, and multi-source corroboration metrics.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/saved"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-surface hover:bg-slate-50 border border-slate-border text-slate-700 font-bold text-xs rounded-xl transition-colors shadow-xs"
            >
              <Bookmark className="w-4 h-4 text-amber-500" />
              <span>Saved Dossiers ({stats?.totalSavedReports || 0})</span>
            </Link>

            <Link
              to="/"
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-blue hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
            >
              <Search className="w-4 h-4" />
              <span>New Investigation</span>
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-xs text-rose-800 rounded-xl">
            {error}
          </div>
        )}

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Investigations"
            value={stats?.totalInvestigations || 0}
            subtitle="User-submitted claims"
            icon={Search}
            color="blue"
          />
          <StatCard
            title="Verified Assertions"
            value={stats?.totalReports || 0}
            subtitle="Synthesized dossiers"
            icon={FileCheck}
            color="teal"
          />
          <StatCard
            title="Average Confidence"
            value={`${stats?.averageConfidence || 0}%`}
            subtitle="Calibrated certainty score"
            icon={ShieldCheck}
            color="emerald"
          />
          <StatCard
            title="Saved Dossiers"
            value={stats?.totalSavedReports || 0}
            subtitle="Bookmarked references"
            icon={Bookmark}
            color="orange"
          />
        </div>

        {/* Charts & Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <VerdictDistributionChart data={stats?.verdicts} />
          </div>

          {/* Input Types Card */}
          <div className="bg-surface rounded-2xl border border-slate-border p-6 shadow-subtle flex flex-col justify-between">
            <div>
              <h3 className="font-heading font-extrabold text-base text-slate-main mb-1">
                Input Formats
              </h3>
              <p className="text-xs text-slate-muted mb-4">
                Distribution across submitted media channels.
              </p>

              <div className="space-y-3">
                {stats?.inputTypes && Object.entries(stats.inputTypes).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between text-xs">
                    <span className="capitalize font-semibold text-slate-700">
                      {type === 'url' ? 'Web Article URL' : type}
                    </span>
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-border/80 text-[11px] text-slate-400">
              Supports headlines, freeform text, article URLs, and OCR image forensics.
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-surface rounded-2xl border border-slate-border p-4 shadow-subtle space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleApplyFilters();
                }}
                placeholder="Search investigations by claim, headline, or keywords..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-canvas rounded-xl border border-slate-border focus:outline-none focus:border-brand-blue"
              />
            </div>

            {/* Input Type Selector */}
            <div className="flex items-center gap-2">
              <select
                value={selectedInputType}
                onChange={(e) => {
                  setSelectedInputType(e.target.value);
                  handleApplyFilters({ inputType: e.target.value });
                }}
                className="px-3 py-2 text-xs bg-canvas rounded-xl border border-slate-border text-slate-700 font-semibold focus:outline-none focus:border-brand-blue"
              >
                <option value="">All Input Formats</option>
                <option value="text">Freeform Text</option>
                <option value="headline">Headline</option>
                <option value="url">Article URL</option>
                <option value="image">Image / OCR</option>
              </select>

              {/* Verdict Selector */}
              <select
                value={selectedVerdict}
                onChange={(e) => {
                  setSelectedVerdict(e.target.value);
                  handleApplyFilters({ verdict: e.target.value });
                }}
                className="px-3 py-2 text-xs bg-canvas rounded-xl border border-slate-border text-slate-700 font-semibold focus:outline-none focus:border-brand-blue"
              >
                <option value="">All Verdicts</option>
                <option value="SUPPORTED">Supported</option>
                <option value="MOSTLY_SUPPORTED">Mostly Supported</option>
                <option value="MISLEADING">Misleading</option>
                <option value="MOSTLY_FALSE">Mostly False</option>
                <option value="FALSE">False</option>
                <option value="UNVERIFIED">Unverified</option>
                <option value="CONFLICTING_EVIDENCE">Conflicting</option>
                <option value="NOT_A_FACTUAL_CLAIM">Not Factual</option>
              </select>

              <button
                type="button"
                onClick={() => handleApplyFilters()}
                disabled={filterLoading}
                className="px-4 py-2 bg-brand-blue text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-xs shrink-0 flex items-center gap-1"
              >
                {filterLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Filter className="w-3.5 h-3.5" />}
                <span>Apply</span>
              </button>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
                  title="Reset filters"
                >
                  <X className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Activity Timeline Stream (Chronological events) */}
        <div className="bg-surface rounded-2xl border border-slate-border p-6 shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-border">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-blue" />
              <h3 className="font-heading font-extrabold text-base text-slate-main">
                Activity Timeline Stream
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Chronological Audit Log
            </span>
          </div>

          {activityTimeline.length > 0 ? (
            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {activityTimeline.map((item, idx) => {
                const isReport = item.type === 'report_generated';
                const timeStr = item.timestamp 
                  ? new Date(item.timestamp).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : '';

                return (
                  <div key={idx} className="relative group">
                    {/* Timeline bullet dot */}
                    <div className={`absolute -left-6 top-1 w-5 h-5 rounded-full bg-surface border-2 flex items-center justify-center shadow-xs ${
                      isReport ? 'border-brand-blue text-brand-blue' : 'border-slate-400 text-slate-400'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${isReport ? 'bg-brand-blue' : 'bg-slate-400'}`} />
                    </div>

                    <div className="bg-canvas/40 rounded-xl p-3 border border-slate-200/70 hover:border-slate-300 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            isReport 
                              ? 'bg-blue-50 text-brand-blue border border-blue-100' 
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {isReport ? 'Dossier Synthesized' : 'Investigation Initiated'}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {timeStr}
                          </span>
                        </div>

                        {isReport ? (
                          <Link
                            to={`/report/${item.id}`}
                            className="font-heading font-bold text-xs text-slate-800 hover:text-brand-blue block truncate hover:underline"
                          >
                            {item.title}
                          </Link>
                        ) : (
                          <p className="font-heading font-bold text-xs text-slate-800 truncate">
                            {item.title}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isReport && item.verdict && (
                          <VerdictBadge verdict={item.verdict} size="sm" />
                        )}
                        {item.status && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {item.status}
                          </span>
                        )}
                        {isReport && (
                          <Link
                            to={`/report/${item.id}`}
                            className="text-slate-400 hover:text-brand-blue p-1 rounded transition-colors"
                            title="Inspect dossier"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">
              No recent activity recorded matching the active filters.
            </p>
          )}
        </div>

        {/* Recent Activity Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Investigations */}
          <div className="bg-surface rounded-2xl border border-slate-border p-6 shadow-subtle">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-extrabold text-base text-slate-main">
                Recent Submissions
              </h3>
              <Link to="/history" className="text-xs font-bold text-brand-blue hover:underline">
                View All
              </Link>
            </div>

            {recent?.recentInvestigations && recent.recentInvestigations.length > 0 ? (
              <div className="divide-y divide-slate-border/80">
                {recent.recentInvestigations.map((inv) => (
                  <div key={inv._id} className="py-3 flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-4">
                      <p className="font-bold text-slate-800 truncate">
                        {inv.originalInput}
                      </p>
                      <span className="text-[11px] text-slate-400">
                        {new Date(inv.createdAt).toLocaleDateString()} &bull; {inv.inputType}
                      </span>
                    </div>
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {inv.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">
                No recent submissions found.
              </p>
            )}
          </div>

          {/* Recent Verification Reports */}
          <div className="bg-surface rounded-2xl border border-slate-border p-6 shadow-subtle">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-extrabold text-base text-slate-main">
                Recent Dossiers
              </h3>
              <Link to="/saved" className="text-xs font-bold text-brand-blue hover:underline">
                Saved Reports
              </Link>
            </div>

            {recent?.recentReports && recent.recentReports.length > 0 ? (
              <div className="divide-y divide-slate-border/80">
                {recent.recentReports.map((rep) => (
                  <div key={rep._id} className="py-3 flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-4">
                      <Link to={`/report/${rep._id}`} className="font-bold text-slate-800 hover:text-brand-blue truncate block">
                        {rep.claim}
                      </Link>
                      <span className="text-[11px] text-slate-400">
                        Confidence: {rep.confidence}% &bull; {rep.evidenceSufficiency || 'Sufficient'}
                      </span>
                    </div>
                    <VerdictBadge verdict={rep.verdict} size="sm" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">
                No recent dossiers generated yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
