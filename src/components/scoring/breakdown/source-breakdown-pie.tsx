"use client";

import * as React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { SourceBreakdown } from "@/lib/types/scoring";

interface SourceBreakdownPieProps {
  data: SourceBreakdown | undefined;
}

const COLORS = ["#3b82f6", "#f59e0b"];

export function SourceBreakdownPie({ data }: SourceBreakdownPieProps) {
  const chartData = React.useMemo(() => {
    if (!data) return [];
    return [
      { name: "Interswitch Data", value: data.interswitch_data ?? 0 },
      { name: "Payment Behavior", value: data.payment_behavior ?? 0 },
    ];
  }, [data]);

  if (chartData.length === 0 || (chartData[0].value === 0 && chartData[1].value === 0)) {
    return (
      <p className="text-xs text-muted-foreground italic">
        No source breakdown available.
      </p>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="h-32 w-32 shrink-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={30}
              outerRadius={55}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(val: number) => `${val.toFixed(1)}%`}
              contentStyle={{
                fontSize: "12px",
                borderRadius: "6px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2">
        {chartData.map((entry, i) => (
          <div key={entry.name} className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: COLORS[i] }}
            />
            <div>
              <p className="text-xs font-medium">{entry.name}</p>
              <p className="text-sm font-bold tabular-nums">
                {entry.value.toFixed(1)}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
