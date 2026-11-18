import React from 'react';
import { ShieldCheck, Info, Scale } from 'lucide-react';

const SUFFICIENCY_CONFIG = {
  Strong: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    desc: 'Corroborated across 3+ independent primary or verified sources.'
  },
  Moderate: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
    desc: 'Corroborated by reliable reporting, with limited primary documentation.'
  },
  Limited: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    desc: 'Only 1 or 2 relevant sources identified, or relies heavily on wire duplicates.'
  },
  Insufficient: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
    desc: 'No direct or reliable public evidence exists at this time.'
  }
};

export default function ConfidenceGauge({ confidence = 50, evidenceSufficiency = 'Limited' }) {
  const sufficiency = SUFFICIENCY_CONFIG[evidenceSufficiency] || SUFFICIENCY_CONFIG.Limited;

  // Determine progress bar color based on calibrated score
  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-emerald-600';
    if (score >= 60) return 'bg-teal-600';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-slate-400';
  };

  return (
    <div className="bg-surface rounded-xl p-4 sm:p-5 border border-slate-border shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-brand-blue shrink-0" />
          <span className="font-heading font-bold text-sm text-slate-main">
            Confidence &amp; Sufficiency
          </span>
        </div>
        
        {/* Sufficiency Badge */}
        <div
          title={sufficiency.desc}
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border self-start sm:self-auto ${sufficiency.bg} ${sufficiency.text} ${sufficiency.border}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${sufficiency.dot}`} />
          <span>Sufficiency: {evidenceSufficiency}</span>
        </div>
      </div>

      {/* Progress Bar & Numeric Calibration */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-baseline">
          <span className="text-xs text-slate-muted font-medium">Calibrated Confidence Score</span>
          <span className="text-lg font-heading font-extrabold text-slate-main">
            {confidence}<span className="text-xs text-slate-muted font-medium">/100</span>
          </span>
        </div>

        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${getScoreColor(confidence)}`}
            style={{ width: `${Math.min(100, Math.max(0, confidence))}%` }}
          />
        </div>
      </div>

      {/* Methodology Footnote */}
      <div className="mt-3.5 pt-3 border-t border-slate-border/60 flex items-start gap-2 text-xs text-slate-muted">
        <Scale className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5" />
        <p className="leading-snug">
          Calculated by penalizing wire syndication echoes, balancing corroborating vs contradicting source authority, and factoring recency.
        </p>
      </div>
    </div>
  );
}

