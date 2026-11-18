import React from 'react';
import { Newspaper, ExternalLink, Calendar, AlertCircle, Info, BookOpen } from 'lucide-react';

export default function ArticleSummaryCard({ metadata }) {
  if (!metadata || (!metadata.articleSummary && !metadata.pageTitle)) {
    return null;
  }

  const {
    pageTitle,
    publisher,
    publicationDate,
    canonicalUrl,
    articleSummary,
    missingContext = []
  } = metadata;

  return (
    <div className="bg-surface rounded-2xl border border-slate-border p-4 sm:p-6 shadow-editorial space-y-4 mb-6">
      {/* Article Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-border gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center border border-blue-100 shrink-0">
            <Newspaper className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-blue bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              Long-Form Article Investigation
            </span>
            <h3 className="font-heading font-extrabold text-base sm:text-lg text-slate-main mt-0.5 break-words">
              {pageTitle || 'Audited Document Content'}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-xs text-slate-500 flex-wrap">
          {publisher && (
            <span className="font-bold text-slate-700">
              {publisher}
            </span>
          )}
          {publicationDate && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {publicationDate}
            </span>
          )}
          {canonicalUrl && (
            <a
              href={canonicalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-brand-blue hover:underline font-semibold"
            >
              <span>Original Link</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Synthesis Summary */}
      {articleSummary && (
        <div className="bg-canvas/60 rounded-xl p-4 border border-slate-border/80">
          <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-slate-700">
            <BookOpen className="w-4 h-4 text-brand-blue" />
            <span>Document Synthesis &amp; Multi-Claim Breakdown</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            {articleSummary}
          </p>
        </div>
      )}

      {/* Missing Context Callout */}
      {missingContext && missingContext.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>Missing Context &amp; Information Gaps Identified</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-xs text-amber-950/80">
            {missingContext.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

