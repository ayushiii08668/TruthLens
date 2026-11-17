import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Tag, 
  Calendar, 
  MapPin, 
  Users, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  ShieldCheck,
  Scale
} from 'lucide-react';
import VerdictBadge from '../common/VerdictBadge';
import ConfidenceGauge from '../common/ConfidenceGauge';
import AnalyticalBriefing from '../investigation/AnalyticalBriefing';
import EvidenceExplorer from './EvidenceExplorer';

export default function ClaimBreakdownAccordion({ 
  claims = [], 
  reports = [], 
  selectedIndex = null,
  onSelectClaim 
}) {
  // If reports are provided, each report corresponds to a claim
  const [expandedIndex, setExpandedIndex] = useState(selectedIndex ?? 0);

  // Fallback to reports if claims list isn't separately provided
  const items = claims.length > 0 ? claims : reports.map((r, i) => ({
    normalizedClaim: r.claim,
    originalSentence: r.claim,
    category: 'General News',
    verifiability: 'Verifiable',
    entities: [],
    dates: [],
    locations: []
  }));

  if (items.length === 0) {
    return null;
  }

  const handleToggle = (index) => {
    const nextIndex = expandedIndex === index ? null : index;
    setExpandedIndex(nextIndex);
    if (onSelectClaim) {
      onSelectClaim(nextIndex);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-border">
        <div>
          <h3 className="font-heading font-extrabold text-base sm:text-lg text-slate-main flex items-center gap-2">
            <Scale className="w-5 h-5 text-brand-blue" />
            <span>Extracted Claims &amp; Independent Assessments</span>
          </h3>
          <p className="text-xs text-slate-muted">
            {items.length} distinct factual {items.length === 1 ? 'assertion' : 'assertions'} audited independently with dedicated evidence and citations.
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
          {items.length} {items.length === 1 ? 'Claim' : 'Claims'} Identified
        </span>
      </div>

      <div className="space-y-3">
        {items.map((claim, idx) => {
          const report = reports[idx] || (reports.length === 1 && idx === 0 ? reports[0] : null);
          const isExpanded = expandedIndex === idx;

          const claimText = claim.normalizedClaim || claim.normalized_claim || claim.claim || claim.originalSentence || 'Factual statement';
          const originalSentence = claim.originalSentence || claim.original_sentence || claimText;
          const category = claim.category || 'General News';
          const verifiability = claim.verifiability || 'Verifiable';
          const entities = claim.entities || [];
          const dates = claim.dates || [];
          const locations = claim.locations || [];

          return (
            <div 
              key={idx} 
              className={`bg-surface rounded-xl border transition-all ${
                isExpanded 
                  ? 'border-brand-blue/60 shadow-md ring-1 ring-blue-500/10' 
                  : 'border-slate-border shadow-subtle hover:border-slate-300'
              }`}
            >
              {/* Accordion Trigger Header */}
              <button
                type="button"
                onClick={() => handleToggle(idx)}
                className="w-full p-4 sm:p-5 flex items-start justify-between text-left gap-4 select-none focus:outline-none"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  {/* Meta Pills */}
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-blue-50 text-brand-blue border border-blue-100">
                      Assertion #{idx + 1}
                    </span>
                    <span className="font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                      {category}
                    </span>
                    {verifiability && (
                      <span className="font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[11px] border border-emerald-100">
                        {verifiability}
                      </span>
                    )}
                  </div>

                  {/* Assertion Text */}
                  <h4 className="font-heading font-extrabold text-sm sm:text-base text-slate-main tracking-tight leading-snug">
                    {claimText}
                  </h4>

                  {/* Entities & Context chips */}
                  {(entities.length > 0 || dates.length > 0 || locations.length > 0) && (
                    <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500 pt-1">
                      {entities.slice(0, 3).map((ent, eIdx) => (
                        <span key={`ent-${eIdx}`} className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200/70 px-1.5 py-0.5 rounded">
                          <Users className="w-2.5 h-2.5 text-slate-400" />
                          <span>{ent}</span>
                        </span>
                      ))}
                      {dates.slice(0, 2).map((d, dIdx) => (
                        <span key={`d-${dIdx}`} className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200/70 px-1.5 py-0.5 rounded">
                          <Calendar className="w-2.5 h-2.5 text-slate-400" />
                          <span>{d}</span>
                        </span>
                      ))}
                      {locations.slice(0, 2).map((loc, lIdx) => (
                        <span key={`loc-${lIdx}`} className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200/70 px-1.5 py-0.5 rounded">
                          <MapPin className="w-2.5 h-2.5 text-slate-400" />
                          <span>{loc}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right side: Verdict Badge & Toggle Arrow */}
                <div className="flex items-center gap-3 shrink-0 pt-1">
                  {report?.verdict ? (
                    <VerdictBadge verdict={report.verdict} size="sm" />
                  ) : (
                    <span className="text-xs text-slate-400 font-semibold italic">
                      Pending review
                    </span>
                  )}
                  <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </button>

              {/* Collapsible Content */}
              {isExpanded && (
                <div className="px-4 pb-5 sm:px-6 sm:pb-6 pt-2 border-t border-slate-border/80 space-y-6 animate-in fade-in duration-200">
                  {/* Original Sentence context */}
                  {originalSentence !== claimText && (
                    <div className="bg-canvas/60 rounded-lg p-3 text-xs text-slate-600 border border-slate-200/60">
                      <span className="font-bold text-slate-700 block mb-0.5 uppercase tracking-wider text-[10px]">
                        Extracted from source sentence:
                      </span>
                      <p className="italic">"{originalSentence}"</p>
                    </div>
                  )}

                  {/* Independent Assessment Section */}
                  {report ? (
                    <div className="space-y-6">
                      {/* Verdict & Confidence Gauges */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-canvas/50 rounded-xl p-4 border border-slate-border flex flex-col justify-between">
                          <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                              Assertion Assessment
                            </span>
                            <VerdictBadge verdict={report.verdict} size="md" showDescription={true} />
                          </div>
                          <p className="text-[11px] text-slate-muted mt-3 pt-2 border-t border-slate-200">
                            Evaluated independently against primary and corroborated sources.
                          </p>
                        </div>

                        <ConfidenceGauge 
                          confidence={report.confidence} 
                          evidenceSufficiency={report.evidenceSufficiency} 
                        />
                      </div>

                      {/* 7-Part Briefing for this claim */}
                      <AnalyticalBriefing 
                        explanation={report.explanation} 
                        limitations={report.limitations} 
                      />

                      {/* Evidence Explorer for this claim */}
                      <EvidenceExplorer 
                        supporting={report.supportingEvidence || []}
                        contradicting={report.contradictingEvidence || []}
                        neutral={report.neutralEvidence || []}
                      />
                    </div>
                  ) : (
                    <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-border text-xs text-slate-500">
                      Verification assessment is currently pending for this specific assertion.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

