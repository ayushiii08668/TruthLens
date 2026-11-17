import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell 
} from 'recharts';

const VERDICT_COLORS = {
  SUPPORTED: '#16865D',
  TRUE: '#16865D',
  MOSTLY_SUPPORTED: '#12A88A',
  MOSTLY_TRUE: '#12A88A',
  MISLEADING: '#D68A22',
  MOSTLY_FALSE: '#F28A45',
  FALSE: '#D64B55',
  UNVERIFIED: '#64748B',
  CONFLICTING_EVIDENCE: '#8B5CF6',
  MIXED: '#8B5CF6',
  NOT_A_FACTUAL_CLAIM: '#2457D6'
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-surface border border-slate-border shadow-editorial rounded-lg p-3 text-xs">
        <p className="font-heading font-bold text-slate-800">{data.verdict}</p>
        <p className="text-slate-600 mt-1">
          Reports: <span className="font-bold text-brand-blue">{data.count}</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function VerdictDistributionChart({ data = [] }) {
  // If data is an object of verdicts like { TRUE: 2, FALSE: 1 }
  let chartData = [];
  if (Array.isArray(data)) {
    chartData = data;
  } else if (data && typeof data === 'object') {
    chartData = Object.entries(data).map(([verdict, count]) => ({
      verdict: verdict.replace(/_/g, ' '),
      key: verdict,
      count
    }));
  }

  const hasData = chartData.some(item => item.count > 0);

  return (
    <div className="bg-surface rounded-2xl border border-slate-border p-6 shadow-subtle">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-heading font-extrabold text-base text-slate-main">
            Verdict Distribution Breakdown
          </h3>
          <p className="text-xs text-slate-muted">
            Aggregated classification across all verified assertions.
          </p>
        </div>
      </div>

      {hasData ? (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <XAxis 
                dataKey="verdict" 
                tick={{ fontSize: 11, fill: '#64748B' }}
                interval={0}
                angle={-20}
                textAnchor="end"
              />
              <YAxis 
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#64748B' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => {
                  const colorKey = (entry.key || entry.verdict || '').replace(/\s+/g, '_').toUpperCase();
                  const fill = VERDICT_COLORS[colorKey] || '#2457D6';
                  return <Cell key={`cell-${index}`} fill={fill} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-56 flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <p className="text-xs font-semibold text-slate-500">
            No verification reports logged yet.
          </p>
          <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
            Submit a statement on the Verify page to see your real-time distribution analytics.
          </p>
        </div>
      )}
    </div>
  );
}

