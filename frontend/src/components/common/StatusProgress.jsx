import React from 'react';
import { motion } from 'framer-motion';
import { 
  FileSearch, 
  Globe, 
  GitCompare, 
  Scale, 
  CheckCircle2, 
  AlertCircle,
  Loader2
} from 'lucide-react';

const STEPS = [
  {
    key: 'extracting_claims',
    label: 'Claim Extraction',
    description: 'Segmenting text, identifying verifiable assertions, entities, dates and categories.',
    icon: FileSearch
  },
  {
    key: 'searching_evidence',
    label: 'Evidence Discovery',
    description: 'Retrieving sources from Google Fact Check Tools, news wires and web archives.',
    icon: Globe
  },
  {
    key: 'comparing_evidence',
    label: 'Stance & Syndication Analysis',
    description: 'Cross-examining excerpts, grouping wire duplicates, and assigning provisional stances.',
    icon: GitCompare
  },
  {
    key: 'generating_assessment',
    label: 'Verdict Synthesis',
    description: 'Calibrating confidence, evaluating sufficiency, and composing 7-part analytical brief.',
    icon: Scale
  }
];

export default function StatusProgress({ currentStatus = 'extracting_claims', errorMessage = '' }) {
  const getStepState = (stepIndex) => {
    const statusOrder = [
      'pending',
      'extracting_claims',
      'searching_evidence',
      'comparing_evidence',
      'generating_assessment',
      'completed'
    ];

    if (currentStatus === 'failed') return 'failed';

    const currentIndex = statusOrder.indexOf(currentStatus);
    // Note: STEPS are indexed 0..3 matching statusOrder index 1..4
    const mappedIndex = stepIndex + 1;

    if (currentIndex > mappedIndex || currentStatus === 'completed') {
      return 'completed';
    }
    if (currentIndex === mappedIndex) {
      return 'active';
    }
    return 'upcoming';
  };

  return (
    <div className="bg-surface rounded-2xl p-6 sm:p-8 border border-slate-border shadow-editorial max-w-3xl mx-auto my-8">
      <div className="flex items-center justify-between pb-6 border-b border-slate-border mb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-blue bg-blue-50 px-2.5 py-0.5 rounded border border-blue-100">
            Real-Time Pipeline Execution
          </span>
          <h3 className="font-heading font-extrabold text-xl text-slate-main mt-1">
            Investigating Claim
          </h3>
        </div>
        {currentStatus !== 'completed' && currentStatus !== 'failed' && (
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-blue bg-blue-50/60 px-3 py-1.5 rounded-full border border-blue-100">
            <Loader2 className="w-4 h-4 animate-spin text-brand-blue" />
            <span>Analyzing Sources...</span>
          </div>
        )}
      </div>

      {currentStatus === 'failed' ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 flex items-start gap-3 text-rose-800">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">Investigation Halted</h4>
            <p className="text-xs mt-1 text-rose-700">
              {errorMessage || 'The verification pipeline encountered an unexpected issue while communicating with search and AI services.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {STEPS.map((step, idx) => {
            const state = getStepState(idx);
            const Icon = step.icon;

            return (
              <div key={step.key} className="flex items-start gap-4">
                {/* Step Indicator */}
                <div className="relative flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      state === 'completed'
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : state === 'active'
                        ? 'bg-blue-50 border-brand-blue text-brand-blue ring-4 ring-blue-100'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    {state === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : state === 'active' ? (
                      <Icon className="w-5 h-5 animate-pulse" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div
                      className={`w-0.5 h-10 mt-2 transition-colors duration-300 ${
                        state === 'completed' ? 'bg-emerald-400' : 'bg-slate-200'
                      }`}
                    />
                  )}
                </div>

                {/* Step Text */}
                <div className="pt-1 flex-1">
                  <div className="flex items-center gap-2">
                    <h4
                      className={`font-heading text-sm font-bold ${
                        state === 'active'
                          ? 'text-brand-blue'
                          : state === 'completed'
                          ? 'text-slate-main'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.label}
                    </h4>
                    {state === 'active' && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-blue bg-blue-100/70 px-2 py-0.5 rounded">
                        In Progress
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-muted mt-0.5 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

