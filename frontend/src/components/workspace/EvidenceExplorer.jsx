import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  MinusCircle, 
  ExternalLink, 
  Copy, 
  Check, 
  Calendar, 
  Tag, 
  Percent, 
  Globe
} from 'lucide-react';

function SingleEvidenceCard({ item, defaultStance }) {
  const [copied, setCopied] = useState(false);

  const title = item.title || `${item.sourceName || item.publisher || 'Archival'} Reporting Record`;
  const publisher = item.sourceName || item.publisher || 'News Agency';
  const url = item.sourceUrl || item.url || '#';
  const publishDate = item.publishDate || item.publication_date;
  const excerpt = item.quote || item.excerpt || '';
  const sourceType = item.sourceType || (item.is_primary_source ? 'Primary Documentation' : 'Wire Service Reporting');
  const stance = (item.stance || defaultStance || 'NEUTRAL').toUpperCase();
  
  const relevance = typeof item.relevanceScore === 'number'
    ? Math.round(item.relevanceScore * 100)
    : typeof item.relevance_score === 'number'
    ? Math.round(item.relevance_score * 100)
    : 75;

  const stanceStyles = {
    SUPPORTS: {
      border: 'border-emerald-200',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-500',
      icon: CheckCircle2,
      label: 'Supports'
    },
    CONTRADICTS: {
      border: 'border-rose-200',
      badgeBg: 'bg-rose-50 text-rose-800 border-rose-200',
      dot: 'bg-rose-500',
      icon: XCircle,
      label: 'Contradicts'
    },
    NEUTRAL: {
      border: 'border-slate-200',
      badgeBg: 'bg-slate-100 text-slate-700 border-slate-200',
      dot: 'bg-slate-400',
      icon: MinusCircle,
      label: 'Contextual'
    }
  };

  const style = stanceStyles[stance] || stanceStyles.NEUTRAL;
  const Icon = style.icon;

  let domain = '';
  try {
    if (url && url.startsWith('http')) {
      domain = new URL(url).hostname.replace('www.', '');
    }
  } catch {
    domain = '';
  }

  const handleCopyCitation = () => {
    if (excerpt) {
      navigator.clipboard.writeText(`"${excerpt}" — ${publisher} (${url})`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`bg-surface rounded-xl border ${style.border} p-5 shadow-subtle hover:border-slate-300 transition-all space-y-3`}>
      {/* Card Header: Title & Stance */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5 min-w-0 flex-1">
          <h4 className="font-heading font-bold text-sm text-slate-main line-clamp-1">
            {title}
          </h4>
          <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
            <span className="font-semibold text-slate-700">{publisher}</span>
            {domain && <span className="text-[11px] text-slate-400 font-mono">&bull; {domain}</span>}
            {publishDate && (
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {publishDate}
              </span>
            )}
          </div>
        </div>

        {/* Stance & Relevance Badges */}
        <div className="flex items-center gap-2 shrink-0">
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${style.badgeBg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
            <span>{style.label}</span>
          </span>

          <span
            title="Relevance match to assertion"
            className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
          >
            {relevance}% match
          </span>
        </div>
      </div>

      {/* Verbatim Excerpt */}
      {excerpt && (
        <blockquote className="text-xs sm:text-sm text-slate-700 italic border-l-2 border-brand-blue/50 pl-3.5 my-2.5 leading-relaxed bg-canvas/30 py-2 rounded-r">
          "{excerpt}"
        </blockquote>
      )}

      {/* Metadata & Actions Footer */}
      <div className="flex items-center justify-between pt-2.5 border-t border-slate-border/60 text-xs">
        {/* Source Type Tag */}
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
          <Tag className="w-3 h-3 text-slate-400" />
          <span>{sourceType}</span>
        </span>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyCitation}
            type="button"
            className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-700 transition-colors"
            title="Copy quote citation"
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
              className="inline-flex items-center gap-1 text-brand-blue hover:text-blue-700 font-semibold text-xs hover:underline"
            >
              <span>Source URL</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EvidenceExplorer({ supporting = [], contradicting = [], neutral = [] }) {
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'SUPPORTING' | 'CONTRADICTING' | 'NEUTRAL'

  const totalCount = supporting.length + contradicting.length + neutral.length;

  return (
    <div className="space-y-6">
      {/* Section Header & Tab Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-border">
        <div>
          <h3 className="font-heading font-extrabold text-lg text-slate-main">
            Evidence Explorer
          </h3>
          <p className="text-xs text-slate-muted">
            Independent citations categorized by evidentiary stance toward this assertion.
          </p>
        </div>

        {/* Navigation Selector */}
        <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'ALL'
                ? 'bg-surface text-slate-main shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Evidence ({totalCount})
          </button>
          <button
            onClick={() => setActiveTab('SUPPORTING')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'SUPPORTING'
                ? 'bg-emerald-50 text-emerald-800 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Supporting ({supporting.length})
          </button>
          <button
            onClick={() => setActiveTab('CONTRADICTING')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'CONTRADICTING'
                ? 'bg-rose-50 text-rose-800 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Contradicting ({contradicting.length})
          </button>
          <button
            onClick={() => setActiveTab('NEUTRAL')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'NEUTRAL'
                ? 'bg-slate-200 text-slate-800 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Contextual ({neutral.length})
          </button>
        </div>
      </div>

      {/* Evidence Sections */}
      {(activeTab === 'ALL' || activeTab === 'SUPPORTING') && supporting.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Supporting Evidence ({supporting.length} sources substantiating assertion)</span>
          </div>
          <div className="space-y-3">
            {supporting.map((item, idx) => (
              <SingleEvidenceCard key={`supp-${idx}`} item={item} defaultStance="SUPPORTS" />
            ))}
          </div>
        </div>
      )}

      {(activeTab === 'ALL' || activeTab === 'CONTRADICTING') && contradicting.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-800 uppercase tracking-wider">
            <XCircle className="w-4 h-4 text-rose-600" />
            <span>Contradicting Evidence ({contradicting.length} sources refuting assertion)</span>
          </div>
          <div className="space-y-3">
            {contradicting.map((item, idx) => (
              <SingleEvidenceCard key={`contra-${idx}`} item={item} defaultStance="CONTRADICTS" />
            ))}
          </div>
        </div>
      )}

      {(activeTab === 'ALL' || activeTab === 'NEUTRAL') && neutral.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <MinusCircle className="w-4 h-4 text-slate-500" />
            <span>Neutral &amp; Contextual Evidence ({neutral.length} sources providing nuance)</span>
          </div>
          <div className="space-y-3">
            {neutral.map((item, idx) => (
              <SingleEvidenceCard key={`neut-${idx}`} item={item} defaultStance="NEUTRAL" />
            ))}
          </div>
        </div>
      )}

      {totalCount === 0 && (
        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-border text-xs text-slate-400">
          No external evidence records were cataloged for this proposition.
        </div>
      )}
    </div>
  );
}

