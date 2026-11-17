import React from 'react';
import { ExternalLink, CheckCircle2, XCircle, MinusCircle, Copy, Check } from 'lucide-react';

export default function EvidenceCard({ evidence }) {
  const [copied, setCopied] = React.useState(false);

  const quote = evidence.quote || evidence.excerpt || '';
  const publisher = evidence.sourceName || evidence.publisher || 'Reference Source';
  const url = evidence.sourceUrl || evidence.url || '#';
  const publishDate = evidence.publishDate || evidence.publication_date;
  const stance = (evidence.stance || evidence.provisional_stance || 'NEUTRAL').toUpperCase();
  const relevance = typeof evidence.relevanceScore === 'number' 
    ? Math.round(evidence.relevanceScore * 100) 
    : typeof evidence.relevance_score === 'number'
    ? Math.round(evidence.relevance_score * 100)
    : 75;

  const stanceBadges = {
    SUPPORTS: {
      label: 'SUPPORTS',
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      icon: CheckCircle2,
      dot: 'bg-emerald-500'
    },
    CONTRADICTS: {
      label: 'CONTRADICTS',
      bg: 'bg-rose-50 text-rose-800 border-rose-200',
      icon: XCircle,
      dot: 'bg-rose-500'
    },
    NEUTRAL: {
      label: 'CONTEXTUAL',
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      icon: MinusCircle,
      dot: 'bg-slate-400'
    }
  };

  const badge = stanceBadges[stance] || stanceBadges.NEUTRAL;
  const Icon = badge.icon;

  let domain = '';
  try {
    if (url && url.startsWith('http')) {
      domain = new URL(url).hostname.replace('www.', '');
    }
  } catch {
    domain = '';
  }

  const handleCopyQuote = () => {
    if (quote) {
      navigator.clipboard.writeText(`"${quote}" — ${publisher} (${url})`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-surface rounded-xl border border-slate-border p-4 sm:p-5 hover:border-slate-300 transition-all shadow-subtle group">
      {/* Card Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-heading font-bold text-sm text-slate-main truncate">
              {publisher}
            </span>
            {domain && (
              <span className="text-[11px] text-slate-400 font-mono">
                &bull; {domain}
              </span>
            )}
            {publishDate && (
              <span className="text-[11px] text-slate-400">
                &bull; {publishDate}
              </span>
            )}
          </div>
        </div>

        {/* Stance Badge & Relevance */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.bg}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
            <span>{badge.label}</span>
          </span>

          <span
            title="Semantic relevance to claim assertion"
            className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200"
          >
            {relevance}% match
          </span>
        </div>
      </div>

      {/* Verbatim Excerpt */}
      {quote && (
        <blockquote className="text-xs sm:text-sm text-slate-700 italic border-l-2 border-brand-blue/40 pl-3.5 my-2.5 leading-relaxed bg-canvas/30 py-1.5 rounded-r">
          "{quote}"
        </blockquote>
      )}

      {/* Card Footer */}
      <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-border/60 text-xs">
        <button
          onClick={handleCopyQuote}
          type="button"
          className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-700 transition-colors"
          title="Copy quote and citation"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-600 text-[11px] font-semibold">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="text-[11px]">Copy citation</span>
            </>
          )}
        </button>

        {url && url.startsWith('http') && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-brand-blue hover:text-blue-700 font-semibold group-hover:underline text-xs"
          >
            <span>Read Original Source</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}

