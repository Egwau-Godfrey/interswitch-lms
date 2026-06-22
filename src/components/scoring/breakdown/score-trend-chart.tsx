"use client";

import * as React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { CreditScoreHistoryEntry } from "@/lib/types";

interface ScoreTrendChartProps {
  history: CreditScoreHistoryEntry[] | undefined;
}

export function ScoreTrendChart({ history }: ScoreTrendChartProps) {
  const chartData = React.useMemo(() => {
    if (!history || history.length === 0) return [];
    return [...history]
      .reverse()
      .map((entry) => ({
        date: new Date(entry.created_at).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
        }),
        score: Math.round(entry.credit_score * 1000) / 10,
        loan_limit: entry.loan_limit,
      }));
  }, [history]);

  if (chartData.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">
        No score history available for trend chart.
      </p>
    );
  }

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10 }}
            className="fill-muted-foreground"
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10 }}
            className="fill-muted-foreground"
          />
          <Tooltip
            contentStyle={{
              fontSize: "12px",
              borderRadius: "6px",
            }}
            formatter={(val: number) => [`${val}%`, "Score"]}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
