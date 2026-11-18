import React, { useState } from 'react';
import { 
  Bookmark, 
  BookmarkCheck, 
  Share2, 
  Printer, 
  Check, 
  FileCheck, 
  Filter, 
  Globe, 
  Calendar,
  Sparkles
} from 'lucide-react';
import VerdictBadge from '../common/VerdictBadge';
import ConfidenceGauge from '../common/ConfidenceGauge';
import AnalyticalBriefing from './AnalyticalBriefing';
import EvidenceCard from './EvidenceCard';
import ArticleSummaryCard from './ArticleSummaryCard';
import ImageContextCard from './ImageContextCard';
import InvestigationTimeline from '../workspace/InvestigationTimeline';
import EvidenceExplorer from '../workspace/EvidenceExplorer';
import ShareModal from '../workspace/ShareModal';
import PDFReportExporter from '../workspace/PDFReportExporter';
import reportService from '../../services/reportService';
import { useAuth } from '../../context/AuthContext';

export default function VerificationDossier({ report, investigation = null, initialSaved = false, onSaveChange }) {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [saveLoading, setSaveLoading] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [currentReport, setCurrentReport] = useState(report);

  if (!currentReport) return null;

  const metadata = investigation?.metadata || currentReport.investigationId?.metadata || {};
  const supporting = currentReport.supportingEvidence || [];
  const contradicting = currentReport.contradictingEvidence || [];
  const neutral = currentReport.neutralEvidence || [];
  const timeline = currentReport.timeline || investigation?.timeline || [];

  const handleToggleSave = async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    setSaveLoading(true);
    try {
      if (isSaved) {
        await reportService.unsaveReport(currentReport._id);
        setIsSaved(false);
        if (onSaveChange) onSaveChange(false);
      } else {
        await reportService.saveReport(currentReport._id);
        setIsSaved(true);
        if (onSaveChange) onSaveChange(true);
      }
    } catch (err) {
      console.error('Failed to toggle save state:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="bg-surface rounded-2xl border border-slate-border shadow-editorial p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* If article metadata exists (for URL or Long text), display synthesis card */}
      {metadata.articleSummary && (
        <ArticleSummaryCard metadata={metadata} />
      )}

      {/* If image analysis exists, display image context forensics card */}
      {metadata.imageAnalysis && (
        <ImageContextCard imageAnalysis={metadata.imageAnalysis} />
      )}

      {/* Dossier Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-border gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-brand-blue bg-blue-50 px-2.5 py-0.5 rounded border border-blue-100">
              Intelligence Dossier #{currentReport._id?.substring?.(0, 8) || 'REPORT'}
            </span>
            {currentReport.createdAt && (
              <span className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(currentReport.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            )}
          </div>
          <h2 className="font-heading font-extrabold text-xl sm:text-2xl md:text-3xl text-slate-main tracking-tight leading-snug break-words">
            {currentReport.claim}
          </h2>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end shrink-0">
          <button
            onClick={handleToggleSave}
            disabled={saveLoading}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
              isSaved
                ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                : 'bg-surface text-slate-700 border-slate-border hover:bg-slate-50'
            }`}
            title={isSaved ? 'Remove from saved reports' : 'Save report to bookmarks'}
          >
            {isSaved ? (
              <>
                <BookmarkCheck className="w-4 h-4 text-amber-600 fill-amber-600" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4 text-slate-500" />
                <span>Save Report</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-surface border border-slate-border text-slate-700 hover:bg-slate-50 transition-colors"
            title="Share report"
          >
            <Share2 className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Share</span>
          </button>

          <PDFReportExporter report={currentReport} investigation={investigation} />
        </div>
      </div>

      {/* Investigation Timeline */}
      {timeline && timeline.length > 0 && (
        <InvestigationTimeline timeline={timeline} />
      )}

      {/* Central Assessment: Verdict & Calibrated Meter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* Verdict Hero Card */}
        <div className="bg-canvas/50 rounded-xl p-6 border border-slate-border flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
              Official Assessment
            </span>
            <div className="my-2">
              <VerdictBadge verdict={currentReport.verdict} size="xl" showDescription={true} />
            </div>
          </div>
          <p className="text-xs text-slate-muted mt-4 pt-3 border-t border-slate-border/80">
            Synthesized strictly from available public citations and cross-examination.
          </p>
        </div>

        {/* Confidence & Sufficiency Meter */}
        <ConfidenceGauge 
          confidence={currentReport.confidence} 
          evidenceSufficiency={currentReport.evidenceSufficiency} 
        />
      </div>

      {/* 7-Part Analytical Briefing */}
      <AnalyticalBriefing 
        explanation={currentReport.explanation} 
        limitations={currentReport.limitations} 
      />

      {/* Evidence Explorer */}
      <EvidenceExplorer 
        supporting={supporting}
        contradicting={contradicting}
        neutral={neutral}
      />

      {/* Share Modal */}
      <ShareModal
        report={currentReport}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onUpdateReport={(updated) => setCurrentReport(updated)}
      />
    </div>
  );
}
