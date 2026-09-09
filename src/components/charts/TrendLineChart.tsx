'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export interface LineSeriesConfig {
  dataKey: string;
  name: string;
  color: string;
}

export interface TrendLineChartProps {
  data: Record<string, string | number>[];
  series: LineSeriesConfig[];
  xKey?: string;
  height?: number;
}

/**
 * `color` values must be resolved hex/rgb strings, NOT `var(--token)`
 * references — recharts reads them in JS (not just CSS) for things like
 * the legend swatches and gradient stops, and unresolved CSS variables
 * break that. Pages using this component should resolve the current
 * theme's colors before passing them in (see the Dashboard/Trends pages
 * for the pattern).
 *
 * Renders as a gradient-filled area chart (line + soft color fade beneath
 * it, transparent at the bottom) rather than a bare line — each series
 * gets its own `<linearGradient>` def, keyed by dataKey so multiple
 * series never collide.
 */
export function TrendLineChart({ data, series, xKey = 'date', height = 280 }: TrendLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.dataKey} id={`trend-gradient-${s.dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={s.color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" opacity={0.5} />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 12 }}
          className="text-text-muted"
          stroke="currentColor"
          tickLine={false}
        />
        <YAxis tick={{ fontSize: 12 }} className="text-text-muted" stroke="currentColor" tickLine={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {series.map((s) => (
          <Area
            key={s.dataKey}
            type="monotone"
            dataKey={s.dataKey}
            name={s.name}
            stroke={s.color}
            strokeWidth={2}
            fill={`url(#trend-gradient-${s.dataKey})`}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}