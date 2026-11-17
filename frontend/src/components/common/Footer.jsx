import React from 'react';
import { Shield, ExternalLink, CheckCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-border bg-surface mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-brand-blue flex items-center justify-center text-white">
                <Shield className="w-3.5 h-3.5" />
              </div>
              <span className="font-heading font-extrabold text-base text-slate-main">
                Truth<span className="text-brand-blue">Lens</span>
              </span>
            </div>
            <p className="text-xs text-slate-muted leading-relaxed max-w-md">
              TruthLens is an AI-powered, evidence-based factual verification engine designed for newsrooms, research analysts, and critical readers. Every assessment is grounded in discoverable, primary, and independently verified citations.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-brand-teal">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Strict epistemic rule: Never invent citations, dates, or verdicts.</span>
            </div>
          </div>

          {/* Methodology */}
          <div>
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-slate-700 mb-3">
              Verification Standards
            </h4>
            <ul className="space-y-2 text-xs text-slate-muted">
              <li>Linguistic Claim Segmentation</li>
              <li>Dual-Channel Fact &amp; Wire Retrieval</li>
              <li>Syndication Echo Filtering</li>
              <li>Calibrated Stance Cross-Check</li>
              <li>Default UNVERIFIED on Data Scarcity</li>
            </ul>
          </div>

          {/* Verdicts */}
          <div>
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-slate-700 mb-3">
              Assessment Categories
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-muted">
              <li><span className="text-emerald-600 font-semibold">SUPPORTED</span> &bull; Verified fact</li>
              <li><span className="text-amber-600 font-semibold">MISLEADING</span> &bull; Distorted context</li>
              <li><span className="text-rose-600 font-semibold">FALSE</span> &bull; Refuted by evidence</li>
              <li><span className="text-slate-500 font-semibold">UNVERIFIED</span> &bull; Insufficient proof</li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-border flex flex-col sm:flex-row items-center justify-between text-xs text-slate-muted gap-4">
          <p>
            &copy; {new Date().getFullYear()} TruthLens Platform. All rights reserved.
          </p>
          <p className="flex items-center gap-1 text-[11px]">
            Engineered with React &bull; Node.js &bull; Python FastAPI &bull; MongoDB
          </p>
        </div>
      </div>
    </footer>
  );
}

