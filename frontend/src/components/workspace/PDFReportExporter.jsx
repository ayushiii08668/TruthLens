import React, { useRef } from 'react';
import { Printer, Download, FileText, CheckCircle2, Shield, Calendar, Globe, ExternalLink } from 'lucide-react';

export default function PDFReportExporter({ 
  report, 
  investigation = null, 
  buttonStyle = 'default' 
}) {
  if (!report) return null;

  const handlePrint = () => {
    window.print();
  };

  const metadata = investigation?.metadata || report.investigationId?.metadata || {};
  const supporting = report.supportingEvidence || [];
  const contradicting = report.contradictingEvidence || [];
  const neutral = report.neutralEvidence || [];
  const allEvidence = [...supporting, ...contradicting, ...neutral];

  const dateStr = report.createdAt 
    ? new Date(report.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : new Date().toLocaleDateString();

  return (
    <>
      {/* Trigger Button */}
      {buttonStyle === 'icon' ? (
        <button
          onClick={handlePrint}
          className="p-2 rounded-xl text-xs font-semibold bg-surface border border-slate-border text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          title="Print or Export PDF Intelligence Dossier"
        >
          <Printer className="w-4 h-4 text-slate-600" />
        </button>
      ) : (
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold bg-surface border border-slate-border text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-xs"
          title="Print or Export PDF Intelligence Dossier"
        >
          <Printer className="w-4 h-4 text-slate-500 shrink-0" />
          <span className="hidden sm:inline">Export Dossier (PDF)</span>
          <span className="sm:hidden">PDF</span>
        </button>
      )}

      {/* Hidden during normal view, Visible on Print */}
      <div className="hidden print:block fixed inset-0 bg-white text-black p-8 z-9999 overflow-visible font-sans leading-relaxed">
        {/* Print Dossier Header */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-heading font-extrabold text-2xl tracking-tight text-slate-900">
                TRUTHLENS
              </span>
              <span className="text-xs font-mono uppercase tracking-widest text-slate-500 border-l border-slate-300 pl-2">
                Intelligence Verification Report
              </span>
            </div>
            <p className="text-xs italic text-slate-600">
              "Don't Just Believe It. Verify It." &bull; AI-Powered Evidence Retrieval &amp; Cross-Examination
            </p>
          </div>

          <div className="text-right text-xs font-mono text-slate-600 space-y-0.5">
            <div>Dossier ID: <strong>{report._id}</strong></div>
            <div>Generated: {dateStr}</div>
            <div>Classification: PUBLIC AUDIT RECORD</div>
          </div>
        </div>

        {/* Claim & Assessment Hero Section */}
        <div className="border border-slate-300 rounded-lg p-5 mb-6 bg-slate-50 break-inside-avoid">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Subject Assertion Under Audit:
          </div>
          <h1 className="font-heading font-bold text-xl text-slate-900 mb-4">
            "{report.claim}"
          </h1>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block uppercase text-[10px] font-bold">Official Verdict</span>
              <span className="font-bold text-base text-slate-900">{report.verdict}</span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase text-[10px] font-bold">Calibrated Confidence</span>
              <span className="font-bold text-base text-slate-900">{report.confidence}%</span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase text-[10px] font-bold">Evidence Sufficiency</span>
              <span className="font-bold text-base text-slate-900">{report.evidenceSufficiency || 'Sufficient'}</span>
            </div>
          </div>
        </div>

        {/* Analytical Synthesis Briefing */}
        <div className="space-y-4 mb-6 break-inside-avoid">
          <h2 className="font-heading font-bold text-sm uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
            Executive Synthesis &amp; Rationale
          </h2>

          <div className="space-y-3 text-xs leading-relaxed text-slate-800">
            {report.explanation?.summary && (
              <div>
                <strong className="text-slate-900 block mb-0.5">Summary Assessment:</strong>
                <p>{report.explanation.summary}</p>
              </div>
            )}

            {report.explanation?.supportingEvidence && (
              <div>
                <strong className="text-emerald-900 block mb-0.5">Supporting Evidence Findings:</strong>
                <p>{report.explanation.supportingEvidence}</p>
              </div>
            )}

            {report.explanation?.contradictingEvidence && (
              <div>
                <strong className="text-rose-900 block mb-0.5">Contradicting Evidence Findings:</strong>
                <p>{report.explanation.contradictingEvidence}</p>
              </div>
            )}

            {report.explanation?.missingContext && (
              <div>
                <strong className="text-slate-900 block mb-0.5">Critical Missing Context:</strong>
                <p>{report.explanation.missingContext}</p>
              </div>
            )}

            {report.explanation?.conflictingEvidence && (
              <div>
                <strong className="text-slate-900 block mb-0.5">Conflicting or Outdated Nuance:</strong>
                <p>{report.explanation.conflictingEvidence}</p>
              </div>
            )}

            {report.limitations && (
              <div className="p-3 bg-slate-100 rounded border border-slate-200">
                <strong className="text-slate-900 block mb-0.5">Methodological Limitations:</strong>
                <p className="italic">{report.limitations}</p>
              </div>
            )}
          </div>
        </div>

        {/* Evidence Citations Registry */}
        <div className="mb-6 break-inside-avoid">
          <h2 className="font-heading font-bold text-sm uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-3">
            Primary Evidence &amp; Discovered Sources ({allEvidence.length} Citations)
          </h2>

          <div className="space-y-3 text-xs">
            {allEvidence.map((ev, idx) => {
              const stance = (ev.stance || ev.provisional_stance || 'NEUTRAL').toUpperCase();
              return (
                <div key={idx} className="border border-slate-200 rounded p-3 bg-white break-inside-avoid">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-bold text-slate-900">
                      [{idx + 1}] {ev.title || ev.sourceName || 'Archival News Record'}
                    </span>
                    <span className="font-mono text-[10px] uppercase font-bold px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded">
                      {stance}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-600 mb-1.5 flex items-center gap-2">
                    <span><strong>Publisher:</strong> {ev.sourceName || ev.publisher || 'Wire Source'}</span>
                    {ev.publishDate && <span>&bull; <strong>Date:</strong> {ev.publishDate}</span>}
                    {ev.sourceType && <span>&bull; <strong>Type:</strong> {ev.sourceType}</span>}
                  </div>

                  {ev.quote && (
                    <blockquote className="italic text-slate-700 bg-slate-50 p-2 rounded border-l-2 border-slate-400 my-1 text-[11px]">
                      "{ev.quote}"
                    </blockquote>
                  )}

                  {ev.sourceUrl && (
                    <div className="text-[10px] font-mono text-slate-500 truncate pt-1">
                      Source URL: {ev.sourceUrl}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Guarantee */}
        <div className="border-t border-slate-300 pt-3 text-[10px] text-slate-500 flex items-center justify-between">
          <span>TruthLens Verification Platform &bull; Permanent Source Attribution Retained</span>
          <span>Verification Hash: {report._id?.substring?.(0, 16)}</span>
        </div>
      </div>
    </>
  );
}

