export interface ChartDatum {
  label: string;
  count: number;
  highlight?: boolean;
}

const CHART_PALETTE = [
  '#0B1D3A',
  '#1D4ED8',
  '#2563EB',
  '#3B82F6',
  '#60A5FA',
  '#0284C7',
  '#38BDF8',
];

export function HorizontalBarChart({
  title,
  subtitle,
  data,
  total,
}: {
  title: string;
  subtitle?: string;
  data: ChartDatum[];
  total: number;
}) {
  const maxCount = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="rounded-2xl bg-white border border-slate-200/90 p-5 sm:p-6 flex flex-col justify-between">
      <div>
        <h3 className="font-display text-base font-bold text-[#0B1D3A] leading-snug">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}

        {total === 0 || data.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-400">
            No responses available for this metric yet.
          </div>
        ) : (
          <div className="mt-5 space-y-3.5">
            {data.map((item, idx) => {
              const pct = total > 0 ? Math.round((item.count / total) * 1000) / 10 : 0;
              const widthPct = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
              const barColor = item.highlight
                ? '#1D4ED8'
                : CHART_PALETTE[idx % CHART_PALETTE.length];

              return (
                <div key={item.label}>
                  <div className="flex items-baseline justify-between gap-3 text-xs sm:text-sm mb-1.5">
                    <span className="font-medium text-slate-800 leading-snug">{item.label}</span>
                    <span className="font-mono tabular-nums text-xs text-slate-600 shrink-0">
                      <strong className="text-[#0B1D3A]">{item.count}</strong> ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${item.count === 0 ? 0 : Math.max(3, widthPct)}%`,
                        backgroundColor: barColor,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function VerticalBarChart({
  title,
  subtitle,
  data,
  total,
}: {
  title: string;
  subtitle?: string;
  data: ChartDatum[];
  total: number;
}) {
  const maxCount = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="rounded-2xl bg-white border border-slate-200/90 p-5 sm:p-6">
      <h3 className="font-display text-base font-bold text-[#0B1D3A] leading-snug">{title}</h3>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}

      {total === 0 || data.length === 0 ? (
        <div className="py-10 text-center text-sm text-slate-400">
          No responses available for this metric yet.
        </div>
      ) : (
        <div className="mt-6">
          <div className="flex items-end gap-3 sm:gap-4 h-44 pt-6 border-b border-slate-200 pb-2">
            {data.map((item, idx) => {
              const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
              const heightPct = maxCount > 0 ? Math.round((item.count / maxCount) * 100) : 0;
              const barColor = CHART_PALETTE[idx % CHART_PALETTE.length];

              return (
                <div
                  key={item.label}
                  className="flex-1 min-w-0 h-full flex flex-col items-center justify-end group"
                >
                  <span className="font-mono text-[11px] tabular-nums text-slate-600 mb-1.5 whitespace-nowrap">
                    {item.count} ({pct}%)
                  </span>
                  <div
                    className="w-full max-w-[52px] rounded-t-lg transition-all duration-300"
                    style={{
                      height: `${item.count === 0 ? 3 : Math.max(8, heightPct)}%`,
                      backgroundColor: item.count === 0 ? '#E2E8F0' : barColor,
                    }}
                    title={`${item.label}: ${item.count} (${pct}%)`}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex items-start gap-3 sm:gap-4 mt-2.5">
            {data.map((item) => (
              <div
                key={item.label}
                className="flex-1 min-w-0 text-center text-[11px] sm:text-xs font-medium text-slate-700 leading-tight break-words"
              >
                {item.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function DonutChart({
  title,
  subtitle,
  data,
  total,
}: {
  title: string;
  subtitle?: string;
  data: ChartDatum[];
  total: number;
}) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  let accumulatedOffset = 0;

  return (
    <div className="rounded-2xl bg-white border border-slate-200/90 p-5 sm:p-6">
      <h3 className="font-display text-base font-bold text-[#0B1D3A] leading-snug">{title}</h3>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}

      {total === 0 || data.length === 0 ? (
        <div className="py-10 text-center text-sm text-slate-400">
          No responses available for this metric yet.
        </div>
      ) : (
        <div className="mt-5 flex flex-col sm:flex-row items-center gap-6">
          <div className="relative w-36 h-36 shrink-0">
            <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke="#F1F5F9"
                strokeWidth="18"
              />
              {data.map((item, idx) => {
                if (item.count === 0) return null;
                const sliceLength = (item.count / total) * circumference;
                const dashArray = `${sliceLength} ${circumference - sliceLength}`;
                const dashOffset = -accumulatedOffset;
                accumulatedOffset += sliceLength;

                return (
                  <circle
                    key={item.label}
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="none"
                    stroke={CHART_PALETTE[idx % CHART_PALETTE.length]}
                    strokeWidth="18"
                    strokeDasharray={dashArray}
                    strokeDashoffset={dashOffset}
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-display text-xl font-bold text-[#0B1D3A] tabular-nums">
                {total}
              </span>
              <span className="text-[11px] text-slate-500">Total</span>
            </div>
          </div>

          <div className="flex-1 w-full space-y-2.5">
            {data.map((item, idx) => {
              const pct = total > 0 ? Math.round((item.count / total) * 1000) / 10 : 0;
              return (
                <div key={item.label} className="flex items-center justify-between gap-3 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-3 h-3 rounded-sm shrink-0"
                      style={{ backgroundColor: CHART_PALETTE[idx % CHART_PALETTE.length] }}
                      aria-hidden="true"
                    />
                    <span className="font-medium text-slate-800 truncate">{item.label}</span>
                  </div>
                  <span className="font-mono tabular-nums text-xs text-slate-600 shrink-0">
                    <strong className="text-[#0B1D3A]">{item.count}</strong> ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
