import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  FileText, 
  Search, 
  GitCompare, 
  Scale, 
  ShieldCheck, 
  Inbox
} from 'lucide-react';

const STAGE_ICONS = {
  submission_received: Inbox,
  claims_extracted: FileText,
  search_completed: Search,
  sources_analysed: GitCompare,
  assessment_generated: Scale
};

export default function InvestigationTimeline({ timeline = [] }) {
  if (!timeline || timeline.length === 0) {
    return null;
  }

  return (
    <div className="bg-surface rounded-2xl border border-slate-border p-5 sm:p-6 shadow-subtle space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-border">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand-blue" />
          <h3 className="font-heading font-extrabold text-sm text-slate-main">
            Auditable Investigation Timeline
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          5 Verified Milestones
        </span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {timeline.map((event, idx) => {
          const Icon = STAGE_ICONS[event.stage] || CheckCircle2;
          const timeStr = event.timestamp 
            ? new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            : `Step ${idx + 1}`;

          return (
            <div key={idx} className="relative group">
              {/* Stepper Dot */}
              <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-surface border-2 border-brand-blue flex items-center justify-center text-brand-blue shadow-xs">
                <div className="w-2 h-2 rounded-full bg-brand-blue" />
              </div>

              {/* Event Content */}
              <div className="space-y-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-heading font-bold text-xs text-slate-800">
                    {event.title}
                  </span>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                    {event.durationMs > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        +{event.durationMs}ms
                      </span>
                    )}
                    <span>{timeStr}</span>
                  </div>
                </div>
                {event.detail && (
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {event.detail}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

