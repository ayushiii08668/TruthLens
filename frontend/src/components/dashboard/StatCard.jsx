import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'blue' }) {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-brand-blue',
      border: 'border-blue-100'
    },
    teal: {
      bg: 'bg-teal-50',
      text: 'text-brand-teal',
      border: 'border-teal-100'
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100'
    },
    orange: {
      bg: 'bg-orange-50',
      text: 'text-brand-orange',
      border: 'border-orange-100'
    }
  };

  const style = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-surface rounded-2xl border border-slate-border p-5 shadow-subtle flex items-start justify-between">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
          {title}
        </span>
        <div className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-main">
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-slate-muted mt-1">
            {subtitle}
          </p>
        )}
      </div>

      {Icon && (
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${style.bg} ${style.text} ${style.border}`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
}

