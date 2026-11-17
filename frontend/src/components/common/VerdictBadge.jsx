import React from 'react';
import { 
  CheckCircle2, 
  CheckCheck, 
  AlertTriangle, 
  XCircle, 
  HelpCircle, 
  Flame, 
  FileQuestion,
  AlertOctagon
} from 'lucide-react';

export const VERDICT_CONFIG = {
  SUPPORTED: {
    label: 'SUPPORTED',
    shortLabel: 'Supported',
    description: 'Reliable and independent evidence directly substantiates this factual assertion.',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    ring: 'ring-emerald-500/20',
    dot: 'bg-emerald-500',
    icon: CheckCheck,
    colorCode: '#16865D'
  },
  MOSTLY_SUPPORTED: {
    label: 'MOSTLY SUPPORTED',
    shortLabel: 'Mostly Supported',
    description: 'The core factual assertion is corroborated, though minor details require nuance or qualification.',
    bg: 'bg-teal-50',
    text: 'text-teal-800',
    border: 'border-teal-200',
    ring: 'ring-teal-500/20',
    dot: 'bg-teal-500',
    icon: CheckCircle2,
    colorCode: '#12A88A'
  },
  MISLEADING: {
    label: 'MISLEADING',
    shortLabel: 'Misleading',
    description: 'Presents select facts out of context or frames outdated/partial information in a deceptive manner.',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    ring: 'ring-amber-500/20',
    dot: 'bg-amber-500',
    icon: AlertTriangle,
    colorCode: '#D68A22'
  },
  MOSTLY_FALSE: {
    label: 'MOSTLY FALSE',
    shortLabel: 'Mostly False',
    description: 'The primary assertion is contradicted by evidence, though minor elements may have an element of truth.',
    bg: 'bg-orange-50',
    text: 'text-orange-800',
    border: 'border-orange-200',
    ring: 'ring-orange-500/20',
    dot: 'bg-orange-500',
    icon: AlertOctagon,
    colorCode: '#F28A45'
  },
  FALSE: {
    label: 'FALSE',
    shortLabel: 'False',
    description: 'Directly and unequivocally contradicted by verified primary sources and official records.',
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200',
    ring: 'ring-rose-500/20',
    dot: 'bg-rose-500',
    icon: XCircle,
    colorCode: '#D64B55'
  },
  UNVERIFIED: {
    label: 'UNVERIFIED',
    shortLabel: 'Unverified',
    description: 'Current publicly accessible evidence is insufficient to substantiate or refute this claim conclusively.',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
    ring: 'ring-slate-500/20',
    dot: 'bg-slate-500',
    icon: HelpCircle,
    colorCode: '#64748B'
  },
  CONFLICTING_EVIDENCE: {
    label: 'CONFLICTING EVIDENCE',
    shortLabel: 'Conflicting',
    description: 'Multiple reputable sources or studies directly contradict each other with no authoritative consensus.',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-200',
    ring: 'ring-purple-500/20',
    dot: 'bg-purple-500',
    icon: Flame,
    colorCode: '#8B5CF6'
  },
  NOT_A_FACTUAL_CLAIM: {
    label: 'NOT A FACTUAL CLAIM',
    shortLabel: 'Subjective / Opinion',
    description: 'Input represents a subjective judgment, speculative prediction, emotional query, or personal belief.',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    ring: 'ring-blue-500/20',
    dot: 'bg-blue-500',
    icon: FileQuestion,
    colorCode: '#2457D6'
  },
  // Legacy aliases for backward compatibility
  TRUE: {
    label: 'SUPPORTED',
    shortLabel: 'Supported',
    description: 'Reliable and independent evidence directly substantiates this factual assertion.',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    ring: 'ring-emerald-500/20',
    dot: 'bg-emerald-500',
    icon: CheckCheck,
    colorCode: '#16865D'
  },
  MOSTLY_TRUE: {
    label: 'MOSTLY SUPPORTED',
    shortLabel: 'Mostly Supported',
    description: 'The core factual assertion is corroborated, though minor details require nuance or qualification.',
    bg: 'bg-teal-50',
    text: 'text-teal-800',
    border: 'border-teal-200',
    ring: 'ring-teal-500/20',
    dot: 'bg-teal-500',
    icon: CheckCircle2,
    colorCode: '#12A88A'
  },
  MIXED: {
    label: 'CONFLICTING EVIDENCE',
    shortLabel: 'Conflicting',
    description: 'Multiple reputable sources or studies directly contradict each other with no authoritative consensus.',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-200',
    ring: 'ring-purple-500/20',
    dot: 'bg-purple-500',
    icon: Flame,
    colorCode: '#8B5CF6'
  }
};

export default function VerdictBadge({ verdict = 'UNVERIFIED', size = 'md', showDescription = false }) {
  const normalizedKey = (verdict || 'UNVERIFIED').replace(/\s+/g, '_').toUpperCase();
  const config = VERDICT_CONFIG[normalizedKey] || VERDICT_CONFIG.UNVERIFIED;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-0.5 font-semibold',
    md: 'text-xs px-3 py-1 font-bold',
    lg: 'text-sm px-4 py-1.5 font-bold',
    xl: 'text-base px-5 py-2 font-extrabold tracking-wide'
  };

  const iconSizes = {
    sm: 13,
    md: 15,
    lg: 18,
    xl: 20
  };

  return (
    <div className="inline-flex flex-col">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border shadow-xs tracking-tight ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        <Icon size={iconSizes[size]} className="shrink-0" />
        <span>{config.label}</span>
      </span>
      {showDescription && (
        <p className="mt-1 text-xs text-slate-muted max-w-md leading-relaxed">
          {config.description}
        </p>
      )}
    </div>
  );
}

