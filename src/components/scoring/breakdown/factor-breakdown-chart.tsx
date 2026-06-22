"use client";

import * as React from "react";
import { FACTOR_LABELS, type FactorDetail } from "@/lib/types/scoring";

interface FactorBreakdownChartProps {
  factors: Record<string, FactorDetail> | undefined;
}

export function FactorBreakdownChart({ factors }: FactorBreakdownChartProps) {
  const entries = React.useMemo(() => {
    if (!factors) return [];
    return Object.entries(factors)
      .map(([key, detail]) => ({
        key,
        label: FACTOR_LABELS[key] ?? key,
        score: detail.score ?? 0,
        weight: detail.weight ?? 0,
        contribution: detail.contribution ?? 0,
      }))
      .sort((a, b) => b.contribution - a.contribution);
  }, [factors]);

  if (entries.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">
        No factor breakdown available.
      </p>
    );
  }

  const maxContribution = Math.max(...entries.map((e) => e.contribution), 0.01);

  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const widthPct = (entry.contribution / maxContribution) * 100;
        const scorePct = Math.round(entry.score * 100);
        const weightPct = Math.round(entry.weight * 100);
        const contribPct = (entry.contribution * 100).toFixed(1);

        return (
          <div key={entry.key} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">{entry.label}</span>
              <span className="text-muted-foreground tabular-nums">
                Score: {scorePct}% · Weight: {weightPct}% · Contrib: {contribPct}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative h-6 flex-1 rounded-md bg-muted overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-md bg-primary/80 transition-all"
                  style={{ width: `${widthPct}%` }}
                />
                <div className="absolute inset-0 flex items-center px-2">
                  <span className="text-xs font-mono text-primary-foreground/90">
                    {contribPct}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
