import React from 'react';
import { 
  Sparkles, 
  CheckCircle, 
  AlertTriangle, 
  HelpCircle, 
  History, 
  HeartHandshake,
  Globe,
  FileText,
  Camera
} from 'lucide-react';

const PRESETS = [
  {
    title: 'NASA Europa Clipper Launch',
    category: 'Science / Space',
    inputType: 'headline',
    expectedVerdict: 'SUPPORTED',
    icon: CheckCircle,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    text: "NASA launched the Europa Clipper spacecraft on a SpaceX Falcon Heavy to investigate Jupiter's icy moon Europa."
  },
  {
    title: 'Public News Article URL',
    category: 'URL Investigation',
    inputType: 'url',
    expectedVerdict: 'MULTI-CLAIM AUDIT',
    icon: Globe,
    color: 'text-brand-blue bg-blue-50 border-blue-200',
    text: "https://www.nasa.gov/news-release/liftoff-nasas-europa-clipper-sails-toward-ocean-moon-of-jupiter/"
  },
  {
    title: 'Multi-Claim Long-Form Article',
    category: 'Long-Form Article',
    inputType: 'text',
    expectedVerdict: 'INDEPENDENT ASSESSMENTS',
    icon: FileText,
    color: 'text-brand-teal bg-teal-50 border-teal-200',
    text: "NASA successfully launched the Europa Clipper spacecraft atop a SpaceX Falcon Heavy rocket on a 1.8-billion-mile journey to Jupiter's icy moon Europa. Meanwhile, viral social media posts claimed that the federal government enacted an emergency 25% sales tax increase yesterday across the entire nation. Elsewhere, researchers in Zurich announced an ambient-pressure room-temperature superconductor composed of pure silicon crystals."
  },
  {
    title: 'Emergency 25% Sales Tax Rumor',
    category: 'Finance / Politics',
    inputType: 'headline',
    expectedVerdict: 'FALSE',
    icon: AlertTriangle,
    color: 'text-rose-600 bg-rose-50 border-rose-200',
    text: "The federal government enacted an emergency 25% nationwide retail sales tax increase effective immediately."
  },
  {
    title: 'Recycled Viral Media Claim',
    category: 'Media Context Forensics',
    inputType: 'image',
    expectedVerdict: 'RECYCLED MEDIA',
    icon: Camera,
    color: 'text-brand-orange bg-orange-50 border-orange-200',
    text: "Breaking news: Massive chemical factory explosion and wildfire destroys Texas industrial facility today!",
    imageFixtureName: "wildfire_smoke.jpg"
  },
  {
    title: 'Outdated Corporate Tax Rate',
    category: 'Business / Tax',
    inputType: 'text',
    expectedVerdict: 'MISLEADING',
    icon: History,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
    text: "The federal corporate income tax rate in the United States is currently 35% on all corporate profits."
  },
  {
    title: 'Robert Pattinson as 7th James Bond',
    category: 'Entertainment / Culture',
    inputType: 'headline',
    expectedVerdict: 'SUPPORTED',
    icon: CheckCircle,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    text: "Robert Pattinson is named the 7th James Bond, taking over the role from Daniel Craig."
  },
  {
    title: 'Dow Jones & Nvidia Market Rebound',
    category: 'Finance / Markets',
    inputType: 'headline',
    expectedVerdict: 'SUPPORTED',
    icon: CheckCircle,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    text: "Dow Jones falls 1,600 points in two sessions, but futures rebound after Nvidia results."
  }
];

export default function PresetSelector({ onSelect, disabled }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-1.5 mb-2.5">
        <Sparkles className="w-3.5 h-3.5 text-brand-orange" />
        <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Try Pre-Configured Benchmark Scenarios:
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {PRESETS.map((preset, index) => {
          const Icon = preset.icon;
          return (
            <button
              key={index}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(preset)}
              className="text-left p-2.5 rounded-xl border border-slate-border bg-surface hover:border-brand-blue/60 hover:bg-blue-50/30 transition-all text-xs group disabled:opacity-50"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-800 group-hover:text-brand-blue transition-colors truncate">
                  {preset.title}
                </span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${preset.color}`}>
                  {preset.expectedVerdict}
                </span>
              </div>
              <p className="text-slate-500 line-clamp-2 leading-relaxed">
                "{preset.text}"
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
