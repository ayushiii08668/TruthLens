import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Share2, 
  Printer, 
  Bookmark, 
  BookmarkCheck, 
  ExternalLink, 
  FileText, 
  Image as ImageIcon, 
  Globe, 
  ShieldCheck, 
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import VerdictBadge from '../common/VerdictBadge';
import ConfidenceGauge from '../common/ConfidenceGauge';
import AnalyticalBriefing from '../investigation/AnalyticalBriefing';
import ArticleSummaryCard from '../investigation/ArticleSummaryCard';
import ImageContextCard from '../investigation/ImageContextCard';
import InvestigationTimeline from './InvestigationTimeline';
import EvidenceExplorer from './EvidenceExplorer';
import ClaimBreakdownAccordion from './ClaimBreakdownAccordion';
import ShareModal from './ShareModal';
import PDFReportExporter from './PDFReportExporter';
import reportService from '../../services/reportService';
import { useAuth } from '../../context/AuthContext';

export default function InvestigationWorkspace({ 
  investigation = null, 
  reports = [], 
  singleReport = null, 
  initialSaved = false 
}) {
  const { isAuthenticated, openAuthModal } = useAuth();
  
  // Resolve active report list and primary report
  const reportList = reports.length > 0 
    ? reports 
    : singleReport 
    ? [singleReport] 
    : [];

  const [activeReportIndex, setActiveReportIndex] = useState(0);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [saveLoading, setSaveLoading] = useState(false);

  const activeReport = reportList[activeReportIndex] || reportList[0] || singleReport;
  const metadata = investigation?.metadata || activeReport?.investigationId?.metadata || {};
  const extractedClaims = investigation?.extractedClaims || [];
  const timeline = activeReport?.timeline || investigation?.timeline || [];

  const handleToggleSave = async () => {
    if (!activeReport) return;
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    setSaveLoading(true);
    try {
      if (isSaved) {
        await reportService.unsaveReport(activeReport._id);
        setIsSaved(false);
      } else {
        await reportService.saveReport(activeReport._id);
        setIsSaved(true);
      }
    } catch (err) {
      console.error('Failed to toggle save state:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  const originalInput = investigation?.originalInput || activeReport?.claim || '';
  const inputType = investigation?.inputType || 'text';

  const getInputTypeIcon = (type) => {
    switch (type) {
      case 'url':
        return Globe;
      case 'image':
        return ImageIcon;
      case 'headline':
        return FileText;
      default:
        return FileText;
    }
  };

  const InputTypeIcon = getInputTypeIcon(inputType);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Investigation Master Dossier Card */}
      <div className="bg-surface rounded-2xl border border-slate-border shadow-editorial p-4 sm:p-6 md:p-8 space-y-6">
        {/* Workspace Top Header & Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-border gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-2 flex-wrap">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-brand-blue bg-blue-50 px-2 sm:px-2.5 py-0.5 rounded border border-blue-100 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>TruthLens Intelligence Workspace</span>
              </span>

              {investigation?._id && (
                <span className="text-[10px] sm:text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  INV #{investigation._id.substring(0, 8)}
                </span>
              )}

              {activeReport?._id && (
                <span className="text-[10px] sm:text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  REP #{activeReport._id.substring(0, 8)}
                </span>
              )}

              {(investigation?.createdAt || activeReport?.createdAt) && (
                <span className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-1 ml-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(investigation?.createdAt || activeReport?.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              )}
            </div>

            <h1 className="font-heading font-extrabold text-xl sm:text-2xl md:text-3xl text-slate-main tracking-tight leading-snug break-words">
              {activeReport?.claim || originalInput}
            </h1>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end shrink-0">
            {activeReport && (
              <button
                onClick={handleToggleSave}
                disabled={saveLoading}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                  isSaved
                    ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                    : 'bg-surface text-slate-700 border-slate-border hover:bg-slate-50'
                }`}
                title={isSaved ? 'Remove from saved dossiers' : 'Save dossier to library'}
              >
                {isSaved ? (
                  <>
                    <BookmarkCheck className="w-4 h-4 text-amber-600 fill-amber-600" />
                    <span>Saved</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4 text-slate-500" />
                    <span>Save</span>
                  </>
                )}
              </button>
            )}

            {activeReport && (
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface border border-slate-border text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-xs"
                title="Share verification dossier publicly"
              >
                <Share2 className="w-4 h-4 text-slate-500" />
                <span className="hidden sm:inline">Share</span>
              </button>
            )}

            {activeReport && (
              <PDFReportExporter 
                report={activeReport} 
                investigation={investigation} 
              />
            )}
          </div>
        </div>

        {/* Original Submission Context Banner */}
        <div className="bg-canvas/50 rounded-xl p-4 border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <InputTypeIcon className="w-3.5 h-3.5 text-brand-blue" />
              <span>Original Submission ({inputType.toUpperCase()})</span>
            </span>
            {investigation?.status && (
              <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {investigation.status}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium break-words">
            "{originalInput}"
          </p>
        </div>

        {/* If article metadata exists (for URL or Long text), display synthesis card */}
        {metadata?.articleSummary && (
          <ArticleSummaryCard metadata={metadata} />
        )}

        {/* If image analysis exists, display forensics matrix */}
        {metadata?.imageAnalysis && (
          <ImageContextCard imageAnalysis={metadata.imageAnalysis} />
        )}

        {/* Milestone Audit Timeline */}
        {timeline && timeline.length > 0 && (
          <InvestigationTimeline timeline={timeline} />
        )}

        {/* Multi-Claim Breakdown Accordion (if multiple claims or reports) */}
        {reportList.length > 1 ? (
          <div className="space-y-4 pt-2">
            <ClaimBreakdownAccordion 
              claims={extractedClaims} 
              reports={reportList} 
              selectedIndex={activeReportIndex}
              onSelectClaim={(idx) => {
                if (idx !== null) setActiveReportIndex(idx);
              }}
            />
          </div>
        ) : activeReport ? (
          /* Single Claim Standard Dossier View */
          <div className="space-y-8 pt-2">
            {/* Verdict Hero & Calibrated Confidence Meter */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              <div className="bg-canvas/50 rounded-xl p-6 border border-slate-border flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
                    Official Assessment
                  </span>
                  <div className="my-2">
                    <VerdictBadge verdict={activeReport.verdict} size="xl" showDescription={true} />
                  </div>
                </div>
                <p className="text-xs text-slate-muted mt-4 pt-3 border-t border-slate-border/80">
                  Synthesized strictly from available public citations and cross-examination.
                </p>
              </div>

              <ConfidenceGauge 
                confidence={activeReport.confidence} 
                evidenceSufficiency={activeReport.evidenceSufficiency} 
              />
            </div>

            {/* 7-Part Analytical Briefing */}
            <AnalyticalBriefing 
              explanation={activeReport.explanation} 
              limitations={activeReport.limitations} 
            />

            {/* Evidence Explorer */}
            <EvidenceExplorer 
              supporting={activeReport.supportingEvidence || []}
              contradicting={activeReport.contradictingEvidence || []}
              neutral={activeReport.neutralEvidence || []}
            />
          </div>
        ) : null}
      </div>

      {/* Share Modal Dialog */}
      {activeReport && (
        <ShareModal
          report={activeReport}
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          onUpdateReport={(updated) => {
            // Update active report in list if shared
            if (activeReport._id === updated._id) {
              activeReport.isPublic = updated.isPublic;
              activeReport.shareId = updated.shareId;
            }
          }}
        />
      )}
    </div>
  );
}

