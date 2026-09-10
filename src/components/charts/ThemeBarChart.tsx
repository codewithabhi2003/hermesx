'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export interface ThemeBarDatum {
  name: string;
  count: number;
  color: string;
}

export interface ThemeBarChartProps {
  data: ThemeBarDatum[];
  height?: number;
}

export function ThemeBarChart({ data, height = 240 }: ThemeBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-text-muted" style={{ height }}>
        No themes yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
        <XAxis type="number" tick={{ fontSize: 12 }} className="text-text-muted" stroke="currentColor" />
        <YAxis
          type="category"
          dataKey="name"
          width={110}
          tick={{ fontSize: 12 }}
          className="text-text-muted"
          stroke="currentColor"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
