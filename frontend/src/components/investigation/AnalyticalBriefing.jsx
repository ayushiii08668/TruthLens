import React from 'react';
import { 
  FileText, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Info,
  Scale
} from 'lucide-react';

export default function AnalyticalBriefing({ explanation = '', limitations = [] }) {
  // If the explanation contains markdown or numbered sections, we parse or present it cleanly
  const sections = [
    { title: 'Analytical Explanation', content: explanation, icon: FileText }
  ];

  return (
    <div className="bg-surface rounded-xl border border-slate-border p-4 sm:p-6 shadow-subtle space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-border">
        <Scale className="w-5 h-5 text-brand-blue shrink-0" />
        <h3 className="font-heading font-extrabold text-base text-slate-main">
          Analytical Assessment &amp; Reasoning
        </h3>
      </div>

      {/* Main Formatted Explanation */}
      <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed text-sm whitespace-pre-line break-words">
        {explanation || 'No formal analytical brief was provided for this assessment.'}
      </div>

      {/* Limitations Section */}
      {limitations && limitations.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-border/80 bg-amber-50/50 rounded-lg p-3.5 border border-amber-200/60">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Audit Limitations &amp; Evidence Boundaries</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-xs text-amber-950/80">
            {limitations.map((lim, idx) => (
              <li key={idx} className="leading-snug">
                {lim}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

