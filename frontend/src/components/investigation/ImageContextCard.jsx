import React from 'react';
import { 
  Camera, 
  FileText, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  Search, 
  Eye, 
  Maximize2, 
  ExternalLink,
  History,
  CheckCircle2
} from 'lucide-react';

export default function ImageContextCard({ imageAnalysis }) {
  if (!imageAnalysis) return null;

  const {
    filename,
    format,
    dimensions,
    fileSizeBytes,
    camera,
    software,
    captureDate,
    ocrText,
    authenticity,
    manipulation,
    origin,
    context
  } = imageAnalysis;

  const isReused = context?.is_reused || false;
  const contextVerdict = context?.verdict || 'UNSPECIFIED';

  return (
    <div className="bg-surface rounded-2xl border border-slate-border p-4 sm:p-6 shadow-editorial space-y-6 mb-6">
      {/* Media Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-border gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-orange-50 text-brand-orange flex items-center justify-center border border-orange-100 shrink-0">
            <Camera className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-orange bg-orange-50 px-2 py-0.5 rounded border border-orange-100 shrink-0">
                Media Forensics &amp; Provenance
              </span>
              <span className="text-xs font-mono font-semibold text-slate-500 truncate max-w-[180px] sm:max-w-[240px]">
                {filename}
              </span>
            </div>
            <h3 className="font-heading font-extrabold text-base sm:text-lg text-slate-main mt-0.5 break-words">
              Image Context &amp; Reverse-Search Audit
            </h3>
          </div>
        </div>

        {/* Technical Metadata Badges */}
        <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono text-slate-600">
          <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">
            {format} &bull; {dimensions}
          </span>
          {camera && (
            <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">
              {camera}
            </span>
          )}
          {captureDate && (
            <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">
              EXIF: {captureDate}
            </span>
          )}
        </div>
      </div>

      {/* Reused / Misleading Context Alert Banner */}
      {isReused ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-heading font-extrabold text-sm text-rose-900">
                Recycled Media Alert: Miscaptioned Historical Photograph
              </h4>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-200 text-rose-800">
                {contextVerdict}
              </span>
            </div>
            <p className="text-xs text-rose-800 mt-1 leading-relaxed">
              {context?.explanation || 'This image was published in earlier reporting and is being recirculated with an inaccurate caption or date.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3.5 flex items-center gap-2.5 text-xs text-emerald-900">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            {context?.explanation || 'Visual documentation verified against indexed archives. No temporal or contextual recycling identified.'}
          </span>
        </div>
      )}

      {/* 4-Part Epistemic Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Authenticity */}
        <div className="bg-canvas/50 rounded-xl p-4 border border-slate-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-brand-blue" />
              1. Image Authenticity
            </span>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-50 text-brand-blue border border-blue-100">
              {authenticity?.assessment || 'UNSPECIFIED'}
            </span>
          </div>
          <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
            {authenticity?.notes?.map((note, idx) => (
              <li key={idx} className="leading-relaxed">
                {note}
              </li>
            ))}
          </ul>
        </div>

        {/* 2. Manipulation */}
        <div className="bg-canvas/50 rounded-xl p-4 border border-slate-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-brand-teal" />
              2. Manipulation Forensics
            </span>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-teal-50 text-brand-teal border border-teal-100">
              {manipulation?.assessment || 'NO_MANIPULATION'}
            </span>
          </div>
          <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
            {manipulation?.notes?.map((note, idx) => (
              <li key={idx} className="leading-relaxed">
                {note}
              </li>
            ))}
          </ul>
        </div>

        {/* 3. Image Origin & Reverse Search */}
        <div className="bg-canvas/50 rounded-xl p-4 border border-slate-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Search className="w-4 h-4 text-brand-orange" />
              3. Origin &amp; Reverse Search
            </span>
            <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
              {origin?.total_matches || 0} match(es)
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed mb-2">
            {origin?.summary}
          </p>
          {origin?.matches && origin.matches.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-slate-border/80">
              {origin.matches.slice(0, 2).map((m, idx) => (
                <div key={idx} className="text-[11px] flex items-center justify-between">
                  <span className="text-slate-700 font-medium truncate max-w-[220px]">
                    {m.publisher} ({m.earliest_date})
                  </span>
                  <a
                    href={m.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-blue hover:underline font-semibold flex items-center gap-0.5"
                  >
                    <span>Archive</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. Context & Caption Alignment */}
        <div className="bg-canvas/50 rounded-xl p-4 border border-slate-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <History className="w-4 h-4 text-purple-600" />
              4. Context &amp; Temporal Integrity
            </span>
            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
              isReused ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {contextVerdict}
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {context?.explanation}
          </p>
        </div>
      </div>

      {/* OCR Extracted Text Box */}
      {ocrText && (
        <div className="bg-canvas/60 rounded-xl p-4 border border-slate-border">
          <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-slate-700">
            <FileText className="w-4 h-4 text-slate-500" />
            <span>OCR Extracted Text &amp; Visible Captions</span>
          </div>
          <p className="text-xs text-slate-700 font-mono bg-surface p-3 rounded-lg border border-slate-border/80 leading-relaxed">
            "{ocrText}"
          </p>
        </div>
      )}
    </div>
  );
}

