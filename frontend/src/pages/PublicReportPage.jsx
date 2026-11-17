import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import reportService from '../services/reportService';
import VerdictBadge from '../components/common/VerdictBadge';
import ConfidenceGauge from '../components/common/ConfidenceGauge';
import AnalyticalBriefing from '../components/investigation/AnalyticalBriefing';
import EvidenceExplorer from '../components/workspace/EvidenceExplorer';
import InvestigationTimeline from '../components/workspace/InvestigationTimeline';
import PDFReportExporter from '../components/workspace/PDFReportExporter';
import { 
  Globe, 
  Share2, 
  Printer, 
  Check, 
  Calendar, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  Search,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function PublicReportPage() {
  const { shareId } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchPublicDossier = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await reportService.getPublicReport(shareId);
        setReport(data.report);
      } catch (err) {
        setError(err.message || 'Public dossier not found or link has expired.');
      } finally {
        setLoading(false);
      }
    };

    if (shareId) {
      fetchPublicDossier();
    }
  }, [shareId]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
        <div className="flex items-center gap-3 text-sm text-slate-500 font-semibold">
          <Loader2 className="w-5 h-5 animate-spin text-brand-blue" />
          <span>Retrieving public verification dossier...</span>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-canvas py-16 px-4">
        <div className="max-w-md mx-auto bg-surface rounded-2xl border border-slate-border p-8 text-center shadow-editorial space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="font-heading font-extrabold text-2xl text-slate-main">
            Dossier Unavailable
          </h2>
          <p className="text-xs text-slate-muted leading-relaxed">
            {error || 'This public verification report does not exist or has been made private by its creator.'}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-brand-blue hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            <Search className="w-4 h-4" />
            <span>Verify Another Claim</span>
          </Link>
        </div>
      </div>
    );
  }

  const supporting = report.supportingEvidence || [];
  const contradicting = report.contradictingEvidence || [];
  const neutral = report.neutralEvidence || [];
  const timeline = report.timeline || [];

  return (
    <div className="min-h-screen bg-canvas py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
        {/* Public Notice Banner */}
        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Globe className="w-4 h-4 text-brand-blue shrink-0" />
            <div>
              <span className="font-bold text-slate-800">Public Fact Audit: </span>
              <span className="text-slate-600">
                This verification dossier has been published for open scrutiny with full source attribution.
              </span>
            </div>
          </div>

          <Link
            to="/"
            className="inline-flex items-center gap-1 font-bold text-brand-blue hover:text-blue-800 shrink-0 text-xs"
          >
            <span>Verify a new claim</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Main Dossier Container */}
        <div className="bg-surface rounded-2xl border border-slate-border shadow-editorial p-6 sm:p-8 space-y-8">
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-border gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-blue bg-blue-50 px-2.5 py-0.5 rounded border border-blue-100 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Public TruthLens Record</span>
                </span>
                <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  ID #{shareId}
                </span>
                {report.createdAt && (
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(report.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                )}
              </div>

              <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-main tracking-tight leading-snug">
                {report.claim}
              </h1>
            </div>

            {/* Sharing & Printing Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-surface border border-slate-border text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
                title="Copy link to this public report"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 text-slate-500" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>

              <PDFReportExporter report={report} />
            </div>
          </div>

          {/* Investigation Timeline */}
          {timeline && timeline.length > 0 && (
            <InvestigationTimeline timeline={timeline} />
          )}

          {/* Central Verdict & Confidence Gauge */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            <div className="bg-canvas/50 rounded-xl p-6 border border-slate-border flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
                  Official Assessment
                </span>
                <div className="my-2">
                  <VerdictBadge verdict={report.verdict} size="xl" showDescription={true} />
                </div>
              </div>
              <p className="text-xs text-slate-muted mt-4 pt-3 border-t border-slate-border/80">
                Synthesized strictly from available public citations and cross-examination.
              </p>
            </div>

            <ConfidenceGauge 
              confidence={report.confidence} 
              evidenceSufficiency={report.evidenceSufficiency} 
            />
          </div>

          {/* 7-Part Analytical Briefing */}
          <AnalyticalBriefing 
            explanation={report.explanation} 
            limitations={report.limitations} 
          />

          {/* Discovered Evidence & Sources */}
          <EvidenceExplorer 
            supporting={supporting}
            contradicting={contradicting}
            neutral={neutral}
          />
        </div>

        {/* Call to action card */}
        <div className="bg-surface rounded-2xl border border-slate-border p-6 sm:p-8 text-center shadow-editorial space-y-3">
          <Sparkles className="w-8 h-8 text-brand-blue mx-auto" />
          <h3 className="font-heading font-extrabold text-xl text-slate-main">
            Need to verify another claim or article?
          </h3>
          <p className="text-xs text-slate-muted max-w-lg mx-auto leading-relaxed">
            TruthLens provides rapid claim extraction, evidence discovery across authoritative registries, and objective verification.
          </p>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-blue hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>Launch TruthLens Verifier</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
