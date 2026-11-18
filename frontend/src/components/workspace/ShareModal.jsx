import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Globe, 
  Lock, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import reportService from '../../services/reportService';

export default function ShareModal({ 
  report, 
  isOpen, 
  onClose, 
  onUpdateReport 
}) {
  const [isPublic, setIsPublic] = useState(Boolean(report?.isPublic));
  const [shareId, setShareId] = useState(report?.shareId || '');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !report) return null;

  const publicUrl = shareId 
    ? `${window.location.origin}/shared/${shareId}`
    : `${window.location.origin}/shared/${report._id}`;

  const handleToggleShare = async () => {
    setLoading(true);
    setError('');
    const newStatus = !isPublic;

    try {
      const data = await reportService.toggleShareReport(report._id, newStatus);
      setIsPublic(data.isPublic);
      if (data.shareId) {
        setShareId(data.shareId);
      }
      if (onUpdateReport) {
        onUpdateReport({
          ...report,
          isPublic: data.isPublic,
          shareId: data.shareId || shareId
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to update share permissions.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-surface rounded-2xl border border-slate-border shadow-editorial p-4 sm:p-6 space-y-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center border border-blue-100">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-lg text-slate-main">
                Share Verification Dossier
              </h3>
              <p className="text-xs text-slate-muted">
                Publish an auditable research report with public sources.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Visibility Toggle Card */}
        <div className="bg-canvas/60 rounded-xl p-4 border border-slate-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {isPublic ? (
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                  <Globe className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center border border-slate-200">
                  <Lock className="w-4 h-4" />
                </div>
              )}
              <div>
                <span className="font-heading font-bold text-xs text-slate-800 block">
                  {isPublic ? 'Public Link Enabled' : 'Private to Analyst Workspace'}
                </span>
                <span className="text-[11px] text-slate-500">
                  {isPublic 
                    ? 'Anyone with the unique link can view this dossier' 
                    : 'Only you can access this investigation'}
                </span>
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              type="button"
              onClick={handleToggleShare}
              disabled={loading}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isPublic ? 'bg-brand-blue' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  isPublic ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Link Display (if public) */}
        {isPublic && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              Public Dossier URL
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                readOnly
                value={publicUrl}
                className="flex-1 px-3.5 py-2 text-xs font-mono bg-slate-50 border border-slate-border rounded-xl text-slate-700 focus:outline-none select-all truncate"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="px-4 py-2 bg-brand-blue hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>

            <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
              <span>Unique link identifier: <code className="font-mono text-slate-600">{shareId || 'active'}</code></span>
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-blue hover:underline inline-flex items-center gap-1 font-semibold"
              >
                <span>Preview public view</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {/* Privacy & Methodology Guarantee */}
        <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-3.5 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-600 leading-relaxed">
            <strong className="text-slate-800">Privacy Safe:</strong> Public links expose only the verified assertions, evidentiary citations, and synthesis metrics. Personal user emails, accounts, and internal notes are strictly kept private.
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

